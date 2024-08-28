import { find } from "../../db/operations/atomic.js";
import StockIssuance from "../../db/objects/transactions/issuance/StockIssuance.js";
import get from "lodash/get";
import Stockclass from "../../db/objects/StockClass.js";

const StockClassTypes = {
    COMMON: "COMMON",
    PREFERRED: "PREFERRED",
};

const getAllStockClasses = async (issuerId) => {
    return (await find(Stockclass, { issuer: issuerId })) || [];
};

const getStockIssuances = async (issuerId) => {
    return await find(StockIssuance, { issuer: issuerId });
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

const calculateStockClassSummary = (stockClasses, totalStockIssuanceSharesByStockClass, totalSharesAuthorized, totalVotingPower) => {
    return {
        totalSharesAuthorized: String(totalSharesAuthorized),
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

const calculateCaptableStats = async (issuerId) => {
    const allStockClasses = await getAllStockClasses(issuerId);
    const stockIssuances = await getStockIssuances(issuerId);

    const totalStockIssuanceSharesByStockClass = stockIssuances.reduce((acc, issuance) => {
        const stockClassId = issuance.stock_class_id;
        if (!acc[stockClassId]) {
            acc[stockClassId] = 0;
        }
        acc[stockClassId] += Number(get(issuance, "quantity"));
        return acc;
    }, {});

    const commonStockClasses = allStockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.COMMON);
    const preferredStockClasses = allStockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.PREFERRED);

    const commonTotalSharesAuthorized = calculateTotalSharesAuthorized(commonStockClasses);
    const preferredTotalSharesAuthorized = calculateTotalSharesAuthorized(preferredStockClasses);

    const commonTotalVotingPower = calculateTotalVotingPower(commonStockClasses, totalStockIssuanceSharesByStockClass);
    const preferredTotalVotingPower = calculateTotalVotingPower(preferredStockClasses, totalStockIssuanceSharesByStockClass);

    const totalVotingPower = commonTotalVotingPower + preferredTotalVotingPower;

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
            },
        },
    };
};

export default calculateCaptableStats;
