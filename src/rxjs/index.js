import { from } from 'rxjs';
import { scan, tap } from 'rxjs/operators';
import { getAllStateMachineObjectsById } from "../db/operations/read.js";

// Initial state structure
const createInitialState = (issuer, stockClasses) => ({
    issuer: {
        id: issuer._id,
        sharesAuthorized: parseInt(issuer.initial_shares_authorized),
        sharesIssued: 0
    },
    stockClasses: stockClasses.reduce((acc, sc) => ({
        ...acc,
        [sc._id]: {
            id: sc._id,
            sharesAuthorized: parseInt(sc.initial_shares_authorized),
            sharesIssued: 0
        }
    }), {}),
    errors: []
});

// Process transactions
const processTransaction = (state, transaction) => {
    switch (transaction.object_type) {
        case 'TX_STOCK_ISSUANCE':
            return processStockIssuance(state, transaction);
        case 'TX_ISSUER_AUTHORIZED_SHARES_ADJUSTMENT':
            return processIssuerAdjustment(state, transaction);
        case 'TX_STOCK_CLASS_AUTHORIZED_SHARES_ADJUSTMENT':
            return processStockClassAdjustment(state, transaction);
        default:
            return state;
    }
};

// Process stock issuance
const processStockIssuance = (state, transaction) => {
    const { stock_class_id, quantity } = transaction;
    const numShares = parseInt(quantity);
    const stockClass = state.stockClasses[stock_class_id];

    // Validate
    if (stockClass.sharesIssued + numShares > stockClass.sharesAuthorized) {
        return {
            ...state,
            errors: [...state.errors, `Cannot issue ${numShares} shares - exceeds stock class authorized amount`]
        };
    }

    if (state.issuer.sharesIssued + numShares > state.issuer.sharesAuthorized) {
        return {
            ...state,
            errors: [...state.errors, `Cannot issue ${numShares} shares - exceeds issuer authorized amount`]
        };
    }

    // Update state
    return {
        ...state,
        issuer: {
            ...state.issuer,
            sharesIssued: state.issuer.sharesIssued + numShares
        },
        stockClasses: {
            ...state.stockClasses,
            [stock_class_id]: {
                ...stockClass,
                sharesIssued: stockClass.sharesIssued + numShares
            }
        }
    };
};

// Process issuer adjustment
const processIssuerAdjustment = (state, transaction) => {
    return {
        ...state,
        issuer: {
            ...state.issuer,
            sharesAuthorized: parseInt(transaction.new_shares_authorized)
        }
    };
};

// Process stock class adjustment
const processStockClassAdjustment = (state, transaction) => {
    const { stock_class_id, new_shares_authorized } = transaction;
    return {
        ...state,
        stockClasses: {
            ...state.stockClasses,
            [stock_class_id]: {
                ...state.stockClasses[stock_class_id],
                sharesAuthorized: parseInt(new_shares_authorized)
            }
        }
    };
};

export const rxjs = async (issuerId) => {
    const { issuer, stockClasses, transactions } = await getAllStateMachineObjectsById(issuerId);

    // Create observable from transactions
    const transactions$ = from(transactions).pipe(
        scan(processTransaction, createInitialState(issuer, stockClasses)),
        tap(state => {
            console.log('\nProcessed transaction. New state:', {
                issuerShares: state.issuer.sharesIssued,
                issuerAuthorized: state.issuer.sharesAuthorized,
                stockClasses: Object.entries(state.stockClasses).map(([id, data]) => ({
                    id,
                    authorized: data.sharesAuthorized,
                    issued: data.sharesIssued
                }))
            });
            if (state.errors.length > 0) {
                console.log('Errors:', state.errors);
            }
        })
    );

    // Subscribe to process transactions
    transactions$.subscribe();
};