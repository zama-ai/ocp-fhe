const StockClassTypes = {
    COMMON: "COMMON",
    PREFERRED: "PREFERRED",
};

const StockIssuanceTypes = {
    FOUNDERS_STOCK: "FOUNDERS_STOCK",
};

export const processCaptableStockIssuance = (state, transaction, _stakeholder, originalStockClass) => {
    const { stock_class_id, quantity, share_price } = transaction;
    const numShares = parseInt(quantity);

    // Early return if stock class not found
    if (!originalStockClass) {
        return {
            errors: [`Stock class not found: ${stock_class_id}`]
        };
    }

    // Get current state of the stock class (including any adjustments)
    const currentStockClass = state.stockClasses[stock_class_id];
    console.log('currentStockClass', currentStockClass);
    const classType = originalStockClass.class_type;

    // Determine if this is a founder's preferred stock issuance
    const isFounderPreferred = classType === StockClassTypes.PREFERRED &&
        transaction.issuance_type === StockIssuanceTypes.FOUNDERS_STOCK;

    // Calculate voting power and liquidation
    const votingPower = originalStockClass.votes_per_share * numShares;
    const liquidation = numShares * Number(share_price?.amount || 0);

    // Update appropriate summary section
    let newSummary = { ...state.summary };

    if (isFounderPreferred) {
        // Update or create founder preferred summary
        newSummary.founderPreferred = newSummary.founderPreferred || {
            outstandingShares: 0,
            sharesAuthorized: currentStockClass.sharesAuthorized,
            fullyDilutedShares: 0,
            liquidation: 0,
            votingPower: 0
        };

        newSummary.founderPreferred = {
            ...newSummary.founderPreferred,
            outstandingShares: newSummary.founderPreferred.outstandingShares + numShares,
            fullyDilutedShares: newSummary.founderPreferred.fullyDilutedShares + numShares,
            liquidation: newSummary.founderPreferred.liquidation + liquidation,
            votingPower: newSummary.founderPreferred.votingPower + votingPower
        };
    } else {
        const summarySection = classType === StockClassTypes.COMMON ? newSummary.common : newSummary.preferred;

        // Find existing row for this stock class
        const existingRowIndex = summarySection.rows.findIndex(row => row.name === originalStockClass.name);

        if (existingRowIndex >= 0) {
            // Update existing row
            const existingRow = summarySection.rows[existingRowIndex];
            summarySection.rows[existingRowIndex] = {
                ...existingRow,
                sharesAuthorized: currentStockClass.sharesAuthorized,
                outstandingShares: existingRow.outstandingShares + numShares,
                fullyDilutedShares: existingRow.fullyDilutedShares + numShares,
                liquidation: existingRow.liquidation + liquidation,
                votingPower: existingRow.votingPower + votingPower
            };
        } else {
            // Create new row
            summarySection.rows.push({
                name: originalStockClass.name,
                sharesAuthorized: currentStockClass.sharesAuthorized,
                outstandingShares: numShares,
                fullyDilutedShares: numShares,
                liquidation: liquidation,
                votingPower: votingPower
            });
        }
    }

    // Update totals
    newSummary.totals = {
        ...newSummary.totals,
        totalOutstandingShares: newSummary.totals.totalOutstandingShares + numShares,
        totalFullyDilutedShares: newSummary.totals.totalFullyDilutedShares + numShares,
        totalVotingPower: newSummary.totals.totalVotingPower + votingPower,
        totalLiquidation: (newSummary.totals.totalLiquidation || 0) + liquidation
    };

    return {
        summary: newSummary,
        isCapTableEmpty: false
    };
};


export const captableInitialState = (issuer, stockClasses, _stockPlans, _stakeholders) => {
    // Calculate initial authorized shares for common and preferred
    const { commonAuthorized, preferredAuthorized } = stockClasses.reduce((acc, sc) => {
        if (sc.class_type === StockClassTypes.COMMON) {
            acc.commonAuthorized += Number(sc.initial_shares_authorized);
        } else if (sc.class_type === StockClassTypes.PREFERRED) {
            acc.preferredAuthorized += Number(sc.initial_shares_authorized);
        }
        return acc;
    }, { commonAuthorized: 0, preferredAuthorized: 0 });

    const totalAuthorizedShares = commonAuthorized + preferredAuthorized;

    return {
        summary: {
            common: {
                totalSharesAuthorized: Number(commonAuthorized),
                rows: []
            },
            preferred: {
                totalSharesAuthorized: Number(preferredAuthorized),
                rows: []
            },
            founderPreferred: null,
            warrantsAndNonPlanAwards: {
                rows: []
            },
            stockPlans: {
                totalSharesAuthorized: 0,
                rows: []
            },
            totals: {
                totalAuthorizedShares,
                totalOutstandingShares: 0,
                totalFullyDilutedShares: 0,
                totalFullyPercentage: 0,
                totalVotingPower: 0,
                totalVotingPowerPercentage: 0,
                totalLiquidation: 0
            }
        },
        convertibles: {
            isEmpty: true,
            convertiblesSummary: {},
            totals: {
                outstandingAmount: 0
            }
        },
        isCapTableEmpty: true
    };
};


export const processCaptableStockClassAdjustment = (state, transaction, originalStockClass) => {
    const { stock_class_id, new_shares_authorized } = transaction;
    const classType = originalStockClass.class_type;

    // Create new summary with updated totals
    let newSummary = { ...state.summary };

    // Update the appropriate section's total authorized shares
    if (classType === StockClassTypes.COMMON) {
        newSummary.common = {
            ...newSummary.common,
            totalSharesAuthorized: Number(new_shares_authorized) // Convert to number
        };
    } else if (classType === StockClassTypes.PREFERRED) {
        newSummary.preferred = {
            ...newSummary.preferred,
            totalSharesAuthorized: Number(new_shares_authorized) // Convert to number
        };
    }

    // Calculate total authorized shares as sum of all sections
    const totalAuthorizedShares =
        Number(newSummary.common.totalSharesAuthorized) +
        Number(newSummary.preferred.totalSharesAuthorized) +
        (newSummary.founderPreferred ? Number(newSummary.founderPreferred.sharesAuthorized) : 0);

    // Update totals
    newSummary.totals = {
        ...newSummary.totals,
        totalAuthorizedShares
    };

    return {
        summary: newSummary
    };
}; 