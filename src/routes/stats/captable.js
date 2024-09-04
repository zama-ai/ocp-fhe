import { find } from "../../db/operations/atomic.js";
import get from "lodash/get";
import Stockclass from "../../db/objects/StockClass.js";
import { getStockIssuances } from "./helpers.js";
import WarrantIssuance from "../../db/objects/transactions/issuance/WarrantIssuance.js";
import EquityCompensationIssuance from "../../db/objects/transactions/issuance/EquityCompensationIssuance.js";

const StockClassTypes = {
    COMMON: "COMMON",
    PREFERRED: "PREFERRED",
};

const getAllEquityCompensationIssuances = async (issuerId) => {
    return (await find(EquityCompensationIssuance, { issuer: issuerId })) || [];
};

const getAllWarrants = async (issuerId) => {
    return (await find(WarrantIssuance, { issuer: issuerId })) || [];
};

const getAllStockClasses = async (issuerId) => {
    return (await find(Stockclass, { issuer: issuerId })) || [];
};

const calculateTotalSharesAuthorized = (stockClasses) => {
    return stockClasses.reduce((acc, stockClass) => {
        return acc + Number(stockClass.initial_shares_authorized);
    }, 0);
};

const calculateTotalVotingPower = (stockClasses, totalStockIssuanceSharesByStockClass) => {
    return stockClasses.reduce((acc, stockClass) => {
        const outstandingShares = totalStockIssuanceSharesByStockClass[stockClass._id] || 0;
        return acc + Number(stockClass.votes_per_share) * outstandingShares;
    }, 0);
};


const calculateWarrantsAndNonPlanAwardsSummary = (
    warrants,
    equityCompensationIssuances,
    totalStockIssuanceSharesByStockClass,
    totalSharesAuthorized,
    totalVotingPower
) => {
    const groupedWarrants = warrants.reduce((acc, warrant) => {
        // iterate over exercise_triggers[N].conversion_right[]( — if type == WARRANT_CONVERSION_RIGHT) then take converts_to_stock_class_id
        const stockClassId = warrant.exercise_triggers.converts_to_stock_class_id;
        if (!acc[stockClassId]) {
            acc[stockClassId] = 0;
        }
        acc[stockClassId] += Number(warrant.quantity);
        return acc;
    }, {});

    const groupedEquityCompensations = equityCompensationIssuances.reduce((acc, issuance) => {
        const stockClassId = issuance.stock_class_id;
        if (!acc[stockClassId]) {
            acc[stockClassId] = 0;
        }
        acc[stockClassId] += Number(issuance.quantity);
        return acc;
    }, {});

    const combinedGroups = { ...groupedWarrants, ...groupedEquityCompensations };

    return Object.keys(combinedGroups).map((stockClassId) => {
        const outstandingShares = combinedGroups[stockClassId];
        const fullyDilutedShares = outstandingShares;
        const fullyDilutedPercentage = (fullyDilutedShares / totalSharesAuthorized).toFixed(2);
        const votingPower = (totalStockIssuanceSharesByStockClass[stockClassId] || 0) * (outstandingShares || 0);
        const votingPowerPercentage = (votingPower / totalVotingPower).toFixed(2);

        return {
            stockClassId,
            outstandingShares,
            fullyDilutedShares,
            fullyDilutedPercentage,
            votingPower,
            votingPowerPercentage,
        };
    });
};

/* calculates the summary of stock classes
1. totalSharesAuthorized
2. children
    a. name
    b. initialSharesAuthorized
    c. outstandingShares
    d. fullyDilutedShares
    e. fullyDilutedPercentage
    f. liquidationPreference
    g. votingPower
    h. votingPowerPercentage
*/
const calculateStockClassSummary = (stockClasses, totalStockIssuanceSharesByStockClass, totalSharesAuthorized, totalVotingPower) => {
    return {
        totalSharesAuthorized: totalSharesAuthorized ? String(totalSharesAuthorized) : null,
        children: stockClasses.map((stockClass) => {
            const outstandingShares = get(totalStockIssuanceSharesByStockClass, stockClass._id, null);
            const votingPower = stockClass.votes_per_share && outstandingShares ? stockClass.votes_per_share * outstandingShares : null;
            return {
                name: stockClass.name,
                initialSharesAuthorized: stockClass.initial_shares_authorized,
                outstandingShares,
                fullyDilutedShares: outstandingShares,
                fullyDilutedPercentage: outstandingShares ? (outstandingShares / totalSharesAuthorized).toFixed(2) : null,
                liquidationPreference: get(stockClass, "liquidation_preference_multiple"),
                votingPower,
                votingPowerPercentage: votingPower && totalVotingPower ? (votingPower / totalVotingPower).toFixed(2) : null,
            };
        }),
    };
};
const StockIssuanceTypes = {
    FOUNDERS_STOCK: "FOUNDERS_STOCK",
};

const calculateFounderPreferredSummary = (
    founderPreferredStockClasses, // preferred and founder class type
    totalStockIssuanceSharesByStockClass,
    totalSharesAuthorized,
    totalVotingPower
) => {
    const initialSharesAuthorized = calculateTotalSharesAuthorized(founderPreferredStockClasses);
    console.log("initialSharesAuthorized", initialSharesAuthorized);

    // According to thibauld, outstanding and fully diluted shares are the same for founder preferred stock class
    const outstandingShares = founderPreferredStockClasses.reduce((acc, stockClass) => {
        return acc + (totalStockIssuanceSharesByStockClass[stockClass._id] || 0);
    }, 0);
    const fullyDilutedShares = outstandingShares;

    console.log("fullyDilutedShares", fullyDilutedShares);

    const fullyDilutedPercentage = totalSharesAuthorized ? (fullyDilutedShares / totalSharesAuthorized).toFixed(2) : null;

    // TODO: we do not add liqudidation preference, I think we take the first one
    const liquidationPreference = founderPreferredStockClasses.reduce((acc, stockClass) => {
        return acc + (Number(stockClass.liquidation_preference_multiple) || 0);
    }, 0);

    // TODO: same here, verify
    const votingPower = founderPreferredStockClasses.reduce((acc, stockClass) => {
        const shares = totalStockIssuanceSharesByStockClass[stockClass._id] || 0;
        return acc + Number(stockClass.votes_per_share) * shares;
    }, 0);
    const votingPowerPercentage = totalVotingPower ? (votingPower / totalVotingPower).toFixed(2) : null;

    return {
        initialSharesAuthorized,
        outstandingShares,
        fullyDilutedShares,
        fullyDilutedPercentage,
        liquidationPreference,
        votingPower,
        votingPowerPercentage,
    };
};

const calculateCaptableStats = async (issuerId) => {
    // First Section: Stock Classes
    const allStockClasses = await getAllStockClasses(issuerId);
    const stockIssuances = await getStockIssuances(issuerId);
    const warrants = await getAllWarrants(issuerId); // Assuming a function to get warrants
    const equityCompensationIssuances = await getAllEquityCompensationIssuances(issuerId);

    const totalStockIssuanceSharesByStockClass = stockIssuances.reduce((acc, issuance) => {
        const stockClassId = issuance.stock_class_id;
        if (!acc[stockClassId]) {
            acc[stockClassId] = 0;
        }
        acc[stockClassId] += Number(get(issuance, "quantity"));
        return acc;
    }, {});

    console.log("totalStockIssuanceSharesByStockClass", totalStockIssuanceSharesByStockClass);

    const commonStockClasses = allStockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.COMMON);
    const preferredStockClasses = allStockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.PREFERRED);
    const founderPreferredStockClasses = allStockClasses.filter(
        (stockClass) =>
            stockClass.class_type === StockClassTypes.PREFERRED &&
            stockIssuances.some(
                (issuance) => issuance.issuance_type === StockIssuanceTypes.FOUNDERS_STOCK && issuance.stock_class_id === stockClass._id
            )
    );

    console.log("commonStockClasses", commonStockClasses);

    const commonTotalSharesAuthorized = calculateTotalSharesAuthorized(commonStockClasses);
    const preferredTotalSharesAuthorized = calculateTotalSharesAuthorized(preferredStockClasses);
    const founderPreferredTotalSharesAuthorized = calculateTotalSharesAuthorized(founderPreferredStockClasses);

    const commonTotalVotingPower = calculateTotalVotingPower(commonStockClasses, totalStockIssuanceSharesByStockClass);
    const preferredTotalVotingPower = calculateTotalVotingPower(preferredStockClasses, totalStockIssuanceSharesByStockClass);
    // const founderPreferredTotalVotingPower = calculateTotalVotingPower(founderPreferredStockClasses, totalStockIssuanceSharesByStockClass);

    const totalVotingPower = commonTotalVotingPower + preferredTotalVotingPower;

    // Second Section: Warrants and Non-Plan Awards
    const warrantsAndNonPlanAwardsSummary = calculateWarrantsAndNonPlanAwardsSummary(
        warrants,
        equityCompensationIssuances.filter((issuance) => !issuance.stock_plan_id),
        totalStockIssuanceSharesByStockClass,
        commonTotalSharesAuthorized + preferredTotalSharesAuthorized + founderPreferredTotalSharesAuthorized,
        totalVotingPower
    );

    // Third Section (second tab): Convertibles


    return {
        summary: {
            stockclasses: {
                common: calculateStockClassSummary(
                    commonStockClasses,
                    totalStockIssuanceSharesByStockClass,
                    commonTotalSharesAuthorized,
                    totalVotingPower
                ),
                preferred: calculateStockClassSummary(
                    preferredStockClasses,
                    totalStockIssuanceSharesByStockClass,
                    preferredTotalSharesAuthorized,
                    totalVotingPower
                ),
                founderPreferred: calculateFounderPreferredSummary(
                    founderPreferredStockClasses,
                    totalStockIssuanceSharesByStockClass,
                    founderPreferredTotalSharesAuthorized,
                    totalVotingPower
                ),
                // WIP - need to review
                warrantsAndNonPlanAwards: {
                    totalSharesAuthorized: null, // Assuming no initial shares authorized for warrants and non-plan awards
                    children: warrantsAndNonPlanAwardsSummary.map((summary) => ({
                        name: summary.stockClassId, // Assuming stockClassId can be used as name
                        initialSharesAuthorized: null, // Assuming no initial shares authorized for warrants and non-plan awards
                        outstandingShares: summary.outstandingShares,
                        fullyDilutedShares: summary.fullyDilutedShares,
                        fullyDilutedPercentage: summary.fullyDilutedPercentage,
                        liquidationPreference: null, // Assuming no liquidation preference for warrants and non-plan awards
                        votingPower: summary.votingPower,
                        votingPowerPercentage: summary.votingPowerPercentage,
                    })),
                },
            },
        },
    };
};

export default calculateCaptableStats;
