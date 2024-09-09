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

const StockIssuanceTypes = {
    FOUNDERS_STOCK: "FOUNDERS_STOCK",
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


const calculateTotalVotingPower = (stockClasses, outstandingSharesByStockClass) => {
    return stockClasses.reduce((acc, stockClass) => {
        const outstandingShares = outstandingSharesByStockClass[stockClass._id] || 0;
        return acc + Number(stockClass.votes_per_share) * outstandingShares;
    }, 0);
};

/*
    Note: we exclude the founder preferred stock issuances from the preferred stock classes summary.
*/
const calculateStockClassSummary = (stockClasses, stockIssuances, totalOutstandingShares, totalVotingPower, excludeIssuanceType = null) => {
    const totalSharesAuthorized = stockClasses.reduce((sum, sc) => sum + Number(sc.initial_shares_authorized), 0);

    const rows = stockClasses.map(stockClass => {
        const classIssuances = stockIssuances.filter(issuance =>
            issuance.stock_class_id === stockClass._id &&
            (excludeIssuanceType ? issuance.issuance_type !== excludeIssuanceType : true)
        );

        console.log('classIssuances', classIssuances);

        if (classIssuances.length === 0) return null;

        const outstandingShares = classIssuances.reduce((sum, issuance) => sum + Number(issuance.quantity), 0);
        const votingPower = stockClass.votes_per_share * outstandingShares;

        return {
            name: stockClass.name,
            sharesAuthorized: stockClass.initial_shares_authorized,
            outstandingShares,
            fullyDilutedShares: outstandingShares,
            fullyDilutedPercentage: (outstandingShares / totalOutstandingShares * 100).toFixed(2),
            liquidationPreference: stockClass.liquidation_preference_multiple,
            votingPower,
            votingPercentage: (votingPower / totalVotingPower * 100).toFixed(2)
        };
    }).filter(row => row !== null);

    return {
        totalSharesAuthorized,
        rows
    };
};

const calculateFounderPreferredSummary = (preferredStockClasses, stockIssuances, totalOutstandingShares, totalVotingPower) => {
    const founderIssuances = stockIssuances.filter(issuance => issuance.issuance_type === StockIssuanceTypes.FOUNDERS_STOCK);

    console.log('founderIssuances', founderIssuances);

    if (founderIssuances.length === 0) return null;

    const outstandingShares = founderIssuances.reduce((sum, issuance) => sum + Number(issuance.quantity), 0);

    const founderPreferredClasses = preferredStockClasses.filter(stockClass =>
        founderIssuances.some(issuance => issuance.stock_class_id === stockClass._id)
    );

    const votingPower = founderIssuances.reduce((sum, issuance) => {
        const stockClass = founderPreferredClasses.find(sc => sc._id === issuance.stock_class_id);
        return sum + (stockClass ? stockClass.votes_per_share * Number(issuance.quantity) : 0);
    }, 0);

    return {
        outstandingShares,
        sharesAuthorized: outstandingShares,
        fullyDilutedShares: outstandingShares,
        fullyDilutedPercentage: (outstandingShares / totalOutstandingShares * 100).toFixed(2),
        liquidationPreference: Math.max(...founderPreferredClasses.map(sc => sc.liquidation_preference_multiple)),
        votingPower,
        votingPercentage: (votingPower / totalVotingPower * 100).toFixed(2)
    };
};



// Note: warrants only have fully diluted shares and fds %
const calculateWarrantAndNonPlanAwardSummary = (warrantIssuances, equityCompensationIssuancesWithoutStockPlan) => {

    console.log('warrantIssuances', warrantIssuances);
    console.log('equityCompensationIssuancesWithoutStockPlan', equityCompensationIssuancesWithoutStockPlan);

    // // find the stockClassId that each warrant converts to
    // const warrantStockClassIds = warrantIssuances.map(warrant => warrant.convert_to_stock_class_id);

    // // const rowsWarrant = warrantIssuances.map(warrant => {
    // //     return {
    // //         name: "some name to fill",
    // //         fullyDilutedShares: ,
    // //         fullyDilutedPercentage: "some number to fill"
    // //     }
    // // })

    // const rowsEquityCompensation = equityCompensationIssuancesWithoutStockPlan.map(equityCompensation => {
    //     return {
    //         name: "some name to fill",
    //         fullyDilutedShares: "some number to fill",
    //         fullyDilutedPercentage: "some number to fill"
    //     }
    // })


}


const calculateCaptableStats = async (issuerId) => {
    // First Section: Stock Classes
    const stockClasses = await getAllStockClasses(issuerId);
    const stockIssuances = await getStockIssuances(issuerId);
    const warrantIssuances = await getAllWarrants(issuerId);
    const equityCompensationIssuances = await getAllEquityCompensationIssuances(issuerId);
    const equityCompensationIssuancesWithoutStockPlan = equityCompensationIssuances.filter(issuance => issuance.stock_plan_id === null);

    // Creates a map of stockClassId to the total number of shares issued
    const outstandingSharesByStockClass = stockIssuances.reduce((acc, issuance) => {
        const stockClassId = issuance.stock_class_id;
        if (!acc[stockClassId]) {
            acc[stockClassId] = 0;
        }
        acc[stockClassId] += Number(get(issuance, "quantity"));
        return acc;
    }, {});

    const totalOutstandingShares = stockIssuances.reduce((acc, issuance) => acc + Number(issuance.quantity), 0);

    const commonStockClasses = stockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.COMMON);
    const preferredStockClasses = stockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.PREFERRED);

    // only used for the voting % calculation
    const commonTotalVotingPower = calculateTotalVotingPower(commonStockClasses, outstandingSharesByStockClass);
    const preferredTotalVotingPower = calculateTotalVotingPower(preferredStockClasses, outstandingSharesByStockClass);
    const totalVotingPower = commonTotalVotingPower + preferredTotalVotingPower;


    return {
        summary: {
            common: calculateStockClassSummary(commonStockClasses, stockIssuances, totalOutstandingShares, totalVotingPower),
            preferred: calculateStockClassSummary(preferredStockClasses, stockIssuances, totalOutstandingShares, totalVotingPower, StockIssuanceTypes.FOUNDERS_STOCK),
            founderPreferred: calculateFounderPreferredSummary(preferredStockClasses, stockIssuances, totalOutstandingShares, totalVotingPower),
            warrantsAndNonPlanAwards: calculateWarrantAndNonPlanAwardSummary(warrantIssuances, equityCompensationIssuancesWithoutStockPlan)
        }
    }


};

export default calculateCaptableStats;


// calculate the totalSharesAuthorized in the frontend.