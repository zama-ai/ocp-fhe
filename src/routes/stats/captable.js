import { find } from "../../db/operations/atomic.js";
import StockIssuance from "../../db/objects/transactions/issuance/StockIssuance.js";
import get from "lodash/get";
import Stockclass from "../../db/objects/StockClass.js";

const StockClassTypes = {
    COMMON: "COMMON",
    PREFERRED: "PREFERRED",
};
const calculateCaptableStats = async (issuerId) => {
    /*
                summary:{
                    stockclass: {
                        common: {
                            totalSharesAuthorized: 0,
                            children: [{
                                name: "",
                                total: 0,
                                initialSharesAuthorized: 0,
                                outstandingShares: 0,
                                fullyDilutedShares: 0,
                                fullyDilutedPercentage: '0.10',
                                liquidationPreference: 0,
                                votingPower: 0,
                                votingPowerPercentage: '0.10',
                            }]
                        },
                        }
                        preferred: {}
                    }
                }
    */

    const allStockClasses = (await find(Stockclass, { issuer: issuerId })) || [];
    console.log({ allStockClasses });
    const commonStockClass = allStockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.COMMON);
    const stockIssuances = await find(StockIssuance, { issuer: issuerId });

    const totalStockIssuanceSharesByStockClass = stockIssuances.reduce((acc, issuance) => {
        const stockClassId = issuance.stock_class_id;
        if (!acc[stockClassId]) {
            acc[stockClassId] = 0;
        }
        acc[stockClassId] += Number(get(issuance, "quantity"));
        return acc;
    }, {});

    const commonTotalSharesAuthorized = commonStockClass.reduce((acc, stockClass) => {
        return acc + Number(stockClass.initial_shares_authorized);
    }, 0);

    const preferredStockClass = allStockClasses.filter((stockClass) => stockClass.class_type === StockClassTypes.PREFERRED);
    const preferredTotalSharesAuthorized = preferredStockClass.reduce((acc, stockClass) => {
        return acc + Number(stockClass.initial_shares_authorized);
    }, 0);

    // const preferredStockClass = allStockClasses.filter((stockClass) => stockClass.class_type === "PREFERRED");
    const commonTotalVotingPower = commonStockClass.reduce((acc, stockClass) => {
        const outstandingShares = totalStockIssuanceSharesByStockClass[stockClass._id] || 0;
        return acc + Number(stockClass.votes_per_share) * outstandingShares;
    }, 0);

    const preferredTotalVotingPower = preferredStockClass.reduce((acc, stockClass) => {
        const outstandingShares = totalStockIssuanceSharesByStockClass[stockClass._id] || 0;
        return acc + Number(stockClass.votes_per_share) * outstandingShares;
    }, 0);

    const totalVotingPower = commonTotalVotingPower + preferredTotalVotingPower;
    return {
        summary: {
            common: {
                totalSharesAuthorized: String(commonTotalSharesAuthorized),
                children: commonStockClass.map((stockClass) => {
                    const outstandingShares = get(totalStockIssuanceSharesByStockClass, stockClass._id, null);
                    const votingPower = stockClass.votes_per_share && outstandingShares ? stockClass.votes_per_share * outstandingShares : null;
                    return {
                        name: stockClass.name,
                        initialSharesAuthorized: stockClass.initial_shares_authorized,
                        outstandingShares,
                        fullyDilutedShares: outstandingShares,
                        fullyDilutedPercentage: outstandingShares ? (outstandingShares / commonTotalSharesAuthorized).toFixed(2) : null,
                        liquidationPreference: get(stockClass, "liquidation_preference_multiple"),
                        votingPower,
                        votingPowerPercentage: votingPower && totalVotingPower ? (votingPower / totalVotingPower).toFixed(2) : null,
                    };
                }),
            },
            preferred: {
                totalSharesAuthorized: String(preferredTotalSharesAuthorized),
                children: preferredStockClass.map((stockClass) => {
                    const outstandingShares = get(totalStockIssuanceSharesByStockClass, stockClass._id, null);
                    const votingPower = stockClass.votes_per_share && outstandingShares ? stockClass.votes_per_share * outstandingShares : null;
                    return {
                        name: stockClass.name,
                        initialSharesAuthorized: stockClass.initial_shares_authorized,
                        outstandingShares,
                        fullyDilutedShares: outstandingShares,
                        fullyDilutedPercentage: outstandingShares ? (outstandingShares / preferredTotalSharesAuthorized).toFixed(2) : null,
                        liquidationPreference: get(stockClass, "liquidation_preference_multiple"),
                        votingPower,
                        votingPowerPercentage: votingPower && totalVotingPower ? (votingPower / totalVotingPower).toFixed(2) : null,
                    };
                }),
            },
        },
    };
};
export default calculateCaptableStats;
