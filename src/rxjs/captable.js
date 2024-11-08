const StockClassTypes = {
    COMMON: "COMMON",
    PREFERRED: "PREFERRED",
};

const StockIssuanceTypes = {
    FOUNDERS_STOCK: "FOUNDERS_STOCK",
};

const processFounderPreferredStock = (state, summary, stockClassId, numShares, liquidation, votingPower) => {
    // Initialize if this is the first founder preferred issuance
    if (!summary.founderPreferred) {
        summary.founderPreferred = {
            outstandingShares: 0,
            sharesAuthorized: 0, // There's no shares authorized for founder preferred stock, we use outstanding shares
            fullyDilutedShares: 0,
            liquidation: 0,
            votingPower: 0
        };
    }

    // Add new shares to existing totals
    summary.founderPreferred.sharesAuthorized += numShares;
    summary.founderPreferred.outstandingShares += numShares;
    summary.founderPreferred.fullyDilutedShares += numShares;
    summary.founderPreferred.liquidation += liquidation;
    summary.founderPreferred.votingPower += votingPower;

    return summary;
};

export const processCaptableStockIssuance = (state, transaction, _stakeholder, originalStockClass) => {
    const { stock_class_id, quantity, issuance_type } = transaction;
    const numShares = parseInt(quantity);
    const classType = originalStockClass.class_type;

    let newSummary = { ...state.summary };

    // Calculate metrics for this issuance
    const votingPower = originalStockClass.votes_per_share * numShares;
    const liquidation = numShares * Number(originalStockClass.price_per_share.amount) * Number(originalStockClass.liquidation_preference_multiple);

    // Check if this is founder preferred stock
    if (classType === StockClassTypes.PREFERRED &&
        issuance_type === StockIssuanceTypes.FOUNDERS_STOCK) {

        newSummary = processFounderPreferredStock(
            state,
            newSummary,
            stock_class_id,
            numShares,
            liquidation,
            votingPower
        );

        return { summary: newSummary };
    }

    // Handle regular stock issuance
    const section = classType === StockClassTypes.COMMON ? newSummary.common : newSummary.preferred;
    const existingRowIndex = section.rows.findIndex(row => row.name === originalStockClass.name);

    if (existingRowIndex >= 0) {
        const existingRow = section.rows[existingRowIndex];
        section.rows[existingRowIndex] = {
            ...existingRow,
            outstandingShares: existingRow.outstandingShares + numShares,
            fullyDilutedShares: existingRow.fullyDilutedShares + numShares,
            liquidation: existingRow.liquidation + liquidation,
            votingPower: existingRow.votingPower + votingPower
        };
    } else {
        section.rows.push({
            name: originalStockClass.name,
            sharesAuthorized: state.stockClasses[stock_class_id].sharesAuthorized,
            outstandingShares: numShares,
            fullyDilutedShares: numShares,
            liquidation: liquidation,
            votingPower: votingPower
        });
    }

    return { summary: newSummary };
};

export const captableInitialState = (issuer, stockClasses, stockPlans, _stakeholders) => {
    // Initialize sections with empty rows
    return {
        summary: {
            common: {
                rows: []
            },
            preferred: {
                rows: []
            },
            founderPreferred: null,
            warrantsAndNonPlanAwards: {
                rows: []
            },
            stockPlans: {
                rows: stockPlans
                    .filter(plan => plan.initial_shares_reserved > 0)
                    .map(plan => ({
                        name: `${plan.plan_name} Available for Grants`,
                        fullyDilutedShares: Number(plan.initial_shares_reserved)
                    }))
            },
            totals: {} // Empty totals object - will be calculated in index.js
        },
        convertibles: {
            isEmpty: true,
            convertiblesSummary: {},
            totals: {}
        },
        isCapTableEmpty: true
    };
};

export const processCaptableStockClassAdjustment = (state, transaction, originalStockClass) => {
    const { stock_class_id } = transaction;
    let newSummary = { ...state.summary };

    // Just update the sharesAuthorized in the appropriate row
    const section = originalStockClass.class_type === StockClassTypes.COMMON ?
        newSummary.common : newSummary.preferred;

    const rowIndex = section.rows.findIndex(row => row.name === originalStockClass.name);
    if (rowIndex >= 0) {
        section.rows[rowIndex] = {
            ...section.rows[rowIndex],
            sharesAuthorized: state.stockClasses[stock_class_id].sharesAuthorized
        };
    }

    return { summary: newSummary };
};

export const processCaptableStockPlanAdjustment = (state, transaction) => {
    const { stock_plan_id, shares_reserved } = transaction;
    let newSummary = { ...state.summary };

    const planName = state.stockPlans[stock_plan_id].name;
    const rowIndex = newSummary.stockPlans.rows.findIndex(
        row => row.name === `${planName} Available for Grants`
    );

    const issuedShares = state.stockPlans[stock_plan_id].sharesIssued || 0;
    const availableShares = parseInt(shares_reserved) - issuedShares;

    if (rowIndex >= 0) {
        newSummary.stockPlans.rows[rowIndex] = {
            ...newSummary.stockPlans.rows[rowIndex],
            fullyDilutedShares: availableShares,
            name: `${planName} Available for Grants`
        };
    } else {
        newSummary.stockPlans.rows.push({
            name: `${planName} Available for Grants`,
            fullyDilutedShares: availableShares
        });
    }

    return { summary: newSummary };
};


