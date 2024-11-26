import { convertBytes16ToUUID } from "../utils/convertUUID.js";
import { createHistoricalTransaction } from "../db/operations/create.js";
import {
    upsertStakeholderById,
    updateStockClassById,
    upsertStockTransferById,
    upsertStockCancellationById,
    upsertStockRetractionById,
    upsertStockReissuanceById,
    upsertStockRepurchaseById,
    upsertStockAcceptanceById,
    upsertStockClassAuthorizedSharesAdjustment,
    upsertIssuerAuthorizedSharesAdjustment,
    updateStockPlanById,
    upsertStockIssuanceBySecurityId,
    upsertConvertibleIssuanceBySecurityId,
    upsertWarrantIssuanceBySecurityId,
    upsertEquityCompensationIssuanceBySecurityId,
    upsertEquityCompensationExerciseBySecurityId,
} from "../db/operations/update.js";
import { toDecimal } from "../utils/convertToFixedPointDecimals.js";
import {
    IssuerAuthorizedSharesAdjustment,
    StockAcceptance,
    StockCancellation,
    StockClassAuthorizedSharesAdjustment,
    StockIssuance,
    StockReissuance,
    StockRepurchase,
    StockRetraction,
    StockTransfer,
    ConvertibleIssuance,
    WarrantIssuance,
    EquityCompensationIssuance,
    EquityCompensationExercise,
} from "./structs.js";
const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
};

export const handleStockIssuance = async (stock, issuerId, timestamp) => {
    console.log("StockIssuanceCreated Event Emitted!", stock);
    const { stock_class_id, share_price, quantity, stakeholder_id, security_id } = stock;

    const _security_id = convertBytes16ToUUID(security_id);
    const chainDate = new Date(timestamp * 1000).toISOString().split("T")[0];
    const _stakeholder_id = convertBytes16ToUUID(stakeholder_id);

    const createdStockIssuance = await upsertStockIssuanceBySecurityId(_security_id, {
        stock_class_id: convertBytes16ToUUID(stock_class_id),
        share_price: {
            amount: toDecimal(share_price).toString(),
            currency: "USD",
        },
        quantity: toDecimal(quantity).toString(),
        stakeholder_id: _stakeholder_id,
        security_id: _security_id,
        date: chainDate,
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdStockIssuance._id,
        issuer: issuerId,
        transactionType: "StockIssuance",
    });

    console.log(
        `✅ | StockIssuance confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockIssuance
    );
};

export const handleStockTransfer = async (stock, issuerId) => {
    console.log(`Stock Transfer with quantity ${toDecimal(stock.quantity).toString()} received at `, new Date(Date.now()).toLocaleDateString());

    const id = convertBytes16ToUUID(stock.id);
    const quantity = toDecimal(stock.quantity).toString();
    const createdStockTransfer = await upsertStockTransferById(id, {
        _id: id,
        object_type: stock.object_type,
        quantity,
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        consideration_text: stock.consideration_text,
        balance_security_id: convertBytes16ToUUID(stock.balance_security_id),
        resulting_security_ids: convertBytes16ToUUID(stock.resulting_security_ids),
        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    console.log("Stock Transfer reflected and validated off-chain", createdStockTransfer);

    await createHistoricalTransaction({
        transaction: createdStockTransfer._id,
        issuer: createdStockTransfer.issuer,
        transactionType: "StockTransfer",
    });

    console.log(
        `✅ | StockTransfer confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockTransfer
    );
};

export const handleStakeholder = async (id) => {
    try {
        console.log("StakeholderCreated Event Emitted!", id);
        const incomingStakeholderId = convertBytes16ToUUID(id);
        const stakeholder = await upsertStakeholderById(incomingStakeholderId, { is_onchain_synced: true });
        console.log("✅ | Stakeholder confirmation onchain ", stakeholder);
    } catch (error) {
        throw Error("Error handing Stakeholder On Chain", error);
    }
};

export const handleStockClass = async (id) => {
    console.log("StockClassCreated Event Emitted!", id);
    const incomingStockClassId = convertBytes16ToUUID(id);
    const stockClass = await updateStockClassById(incomingStockClassId, { is_onchain_synced: true });
    console.log("✅ | StockClass confirmation onchain ", stockClass);
};

export const handleStockCancellation = async (stock, issuerId, timestamp) => {
    console.log("StockCancellationCreated Event Emitted!", stock.id);
    const id = convertBytes16ToUUID(stock.id);
    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];
    const createdStockCancellation = await upsertStockCancellationById(id, {
        _id: id,
        object_type: stock.object_type,
        quantity: toDecimal(stock.quantity).toString(),
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        date: dateOCF,
        reason_text: stock.reason_text,
        balance_security_id: convertBytes16ToUUID(stock.balance_security_id),
        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdStockCancellation._id,
        issuer: createdStockCancellation.issuer,
        transactionType: "StockCancellation",
    });
    console.log(
        `✅ | StockCancellation confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockCancellation
    );
};

export const handleStockRetraction = async (stock, issuerId, timestamp) => {
    console.log("StockRetractionCreated Event Emitted!", stock.id);
    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];
    const id = convertBytes16ToUUID(stock.id);
    const createdStockRetraction = await upsertStockRetractionById(id, {
        _id: id,
        object_type: stock.object_type,
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        date: dateOCF,
        reason_text: stock.reason_text,
        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdStockRetraction._id,
        issuer: createdStockRetraction.issuer,
        transactionType: "StockRetraction",
    });
    console.log(
        `✅ | StockRetraction confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockRetraction
    );
};

export const handleStockReissuance = async (stock, issuerId, timestamp) => {
    console.log("StockReissuanceCreated Event Emitted!", stock.id);
    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];
    const id = convertBytes16ToUUID(stock.id);
    const createdStockReissuance = await upsertStockReissuanceById(id, {
        _id: id,
        object_type: stock.object_type,
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        date: dateOCF,
        reason_text: stock.reason_text,
        resulting_security_ids: stock.resulting_security_ids.map((sId) => convertBytes16ToUUID(sId)),
        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdStockReissuance._id,
        issuer: createdStockReissuance.issuer,
        transactionType: "StockReissuance",
    });
    console.log(
        `✅ | StockReissuance confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockReissuance
    );
};

export const handleStockRepurchase = async (stock, issuerId, timestamp) => {
    console.log("StockRepurchaseCreated Event Emitted!", stock.id);
    const id = convertBytes16ToUUID(stock.id);

    const sharePriceOCF = {
        amount: toDecimal(stock.price).toString(),
        currency: "USD",
    };

    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];

    const createdStockRepurchase = await upsertStockRepurchaseById(id, {
        _id: id,
        object_type: stock.object_type,
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        date: dateOCF,
        price: sharePriceOCF,
        quantity: toDecimal(stock.quantity).toString(),
        consideration_text: stock.consideration_text,
        balance_security_id: convertBytes16ToUUID(stock.balance_security_id),

        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdStockRepurchase._id,
        issuer: createdStockRepurchase.issuer,
        transactionType: "StockRepurchase",
    });
    console.log(
        `✅ | StockRepurchase confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockRepurchase
    );
};

export const handleStockAcceptance = async (stock, issuerId, timestamp) => {
    console.log("StockAcceptanceCreated Event Emitted!", stock.id);
    const id = convertBytes16ToUUID(stock.id);
    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];

    const createdStockAcceptance = await upsertStockAcceptanceById(id, {
        _id: id,
        object_type: stock.object_type,
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        date: dateOCF,

        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdStockAcceptance._id,
        issuer: createdStockAcceptance.issuer,
        transactionType: "StockAcceptance",
    });
    console.log(
        `✅ | StockAcceptance confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdStockAcceptance
    );
};

export const handleStockClassAuthorizedSharesAdjusted = async (stock, issuerId, timestamp) => {
    console.log("StockClassAuthorizedSharesAdjusted Event Emitted!", stock.id);
    const id = convertBytes16ToUUID(stock.id);
    console.log("stock price", stock.price);

    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];

    const upsert = await upsertStockClassAuthorizedSharesAdjustment(id, {
        _id: id,
        stock_class_id: convertBytes16ToUUID(stock.stock_class_id),
        object_type: stock.object_type,
        comments: stock.comments,
        security_id: convertBytes16ToUUID(stock.security_id),
        date: dateOCF,
        new_shares_authorized: toDecimal(stock.new_shares_authorized).toString(),
        board_approval_date: stock.board_approval_date,
        stockholder_approval_date: stock.stockholder_approval_date,

        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: upsert._id,
        issuer: issuerId,
        transactionType: "StockClassAuthorizedSharesAdjustment",
    });
    console.log(
        `✅ | StockClassAuthorizedSharesAdjusted confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        upsert
    );
};

export const handleIssuerAuthorizedSharesAdjusted = async (issuer, issuerId, timestamp) => {
    console.log("IssuerAuthorizedSharesAdjusted Event Emitted!", issuer.id);
    const id = convertBytes16ToUUID(issuer.id);
    console.log("stock price", issuer.price);

    const dateOCF = new Date(timestamp * 1000).toISOString().split("T")[0];

    const upsert = await upsertIssuerAuthorizedSharesAdjustment(id, {
        _id: id,
        object_type: issuer.object_type,
        comments: issuer.comments,
        issuer_id: convertBytes16ToUUID(issuer.security_id),
        date: dateOCF,
        new_shares_authorized: toDecimal(issuer.new_shares_authorized).toString(),
        board_approval_date: issuer.board_approval_date,
        stockholder_approval_date: issuer.stockholder_approval_date,

        // OCP Native Fields
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: upsert._id,
        issuer: issuerId,
        transactionType: "IssuerAuthorizedSharesAdjustment",
    });
    console.log(
        `✅ | IssuerAuthorizedSharesAdjusted confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        upsert
    );
};

export const handleStockPlan = async (id, sharesReserved) => {
    console.log("StockPlanCreated Event Emitted!", id);
    const incomingStockPlanId = convertBytes16ToUUID(id);
    const stockPlan = await updateStockPlanById(incomingStockPlanId, {
        initial_shares_reserved: toDecimal(sharesReserved).toString(),
        is_onchain_synced: true,
    });
    console.log("✅ | StockPlan confirmation onchain ", stockPlan);
};

export const handleConvertibleIssuance = async (convertible, issuerId, timestamp) => {
    console.log("ConvertibleIssuanceCreated Event Emitted!", convertible);
    const { security_id, stakeholder_id, investment_amount } = convertible;

    const _security_id = convertBytes16ToUUID(security_id);
    const chainDate = new Date(timestamp * 1000).toISOString().split("T")[0];
    const _stakeholder_id = convertBytes16ToUUID(stakeholder_id);

    const createdConvertibleIssuance = await upsertConvertibleIssuanceBySecurityId(_security_id, {
        investment_amount: {
            amount: toDecimal(investment_amount).toString(),
            currency: "USD",
        },
        stakeholder_id: _stakeholder_id,
        security_id: _security_id,
        date: chainDate,
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdConvertibleIssuance._id,
        issuer: issuerId,
        transactionType: "ConvertibleIssuance",
    });

    console.log(
        `✅ | ConvertibleIssuance confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdConvertibleIssuance
    );
};

export const handleWarrantIssuance = async (warrant, issuerId, timestamp) => {
    console.log("WarrantIssuanceCreated Event Emitted!", warrant);
    const { stakeholder_id, quantity, security_id } = warrant;

    const _security_id = convertBytes16ToUUID(security_id);
    const chainDate = new Date(timestamp * 1000).toISOString().split("T")[0];
    const _stakeholder_id = convertBytes16ToUUID(stakeholder_id);

    const createdWarrantIssuance = await upsertWarrantIssuanceBySecurityId(_security_id, {
        date: chainDate,
        quantity: toDecimal(quantity).toString(),
        stakeholder_id: _stakeholder_id,
        security_id: _security_id,
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdWarrantIssuance._id,
        issuer: issuerId,
        transactionType: "WarrantIssuance",
    });

    console.log(
        `✅ | WarrantIssuance confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdWarrantIssuance
    );
};

export const handleEquityCompensationIssuance = async (equity, issuerId, timestamp) => {
    console.log("EquityCompensationIssuanceCreated Event Emitted!", equity);
    const { stakeholder_id, stock_class_id, stock_plan_id, quantity, security_id } = equity;

    const _security_id = convertBytes16ToUUID(security_id);
    const chainDate = new Date(timestamp * 1000).toISOString().split("T")[0];
    const _stakeholder_id = convertBytes16ToUUID(stakeholder_id);

    const createdEquityCompIssuance = await upsertEquityCompensationIssuanceBySecurityId(_security_id, {
        date: chainDate,
        stakeholder_id: _stakeholder_id,
        stock_class_id: convertBytes16ToUUID(stock_class_id),
        stock_plan_id: convertBytes16ToUUID(stock_plan_id),
        quantity: toDecimal(quantity).toString(),
        security_id: _security_id,
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdEquityCompIssuance._id,
        issuer: issuerId,
        transactionType: "EquityCompensationIssuance",
    });
};

export const handleEquityCompensationExercise = async (exercise, issuerId, timestamp) => {
    console.log("EquityCompensationExerciseCreated Event Emitted!", exercise);
    const { equity_comp_security_id, resulting_stock_security_id, quantity } = exercise;

    const _equity_comp_security_id = convertBytes16ToUUID(equity_comp_security_id);
    const chainDate = new Date(timestamp * 1000).toISOString().split("T")[0];
    const _resulting_stock_security_id = convertBytes16ToUUID(resulting_stock_security_id);

    const createdExercise = await upsertEquityCompensationExerciseBySecurityId(_equity_comp_security_id, {
        date: chainDate,
        equity_comp_security_id: _equity_comp_security_id,
        resulting_security_ids: [_resulting_stock_security_id],
        quantity: toDecimal(quantity).toString(),
        issuer: issuerId,
        is_onchain_synced: true,
    });

    await createHistoricalTransaction({
        transaction: createdExercise._id,
        issuer: issuerId,
        transactionType: "EquityCompensationExercise",
    });

    console.log(
        `✅ | EquityCompensationExercise confirmation onchain with date ${new Date(Date.now()).toLocaleDateString("en-US", options)}`,
        createdExercise
    );
};

export const contractFuncs = new Map([
    ["StakeholderCreated", handleStakeholder],
    ["StockClassCreated", handleStockClass],
    ["StockPlanCreated", handleStockPlan],
]);

// DANGEROUS DANGEROUS DANGEROUS THIS HAS TO BE IN SAME ORDER AS DiamondTxHelper:TxType Enum
export const txMapper = {
    1: [IssuerAuthorizedSharesAdjustment, handleIssuerAuthorizedSharesAdjusted],
    2: [StockClassAuthorizedSharesAdjustment, handleStockClassAuthorizedSharesAdjusted],
    3: [StockAcceptance, handleStockAcceptance],
    4: [StockCancellation, handleStockCancellation],
    5: [StockIssuance, handleStockIssuance],
    6: [StockReissuance, handleStockReissuance],
    7: [StockRepurchase, handleStockRepurchase],
    8: [StockRetraction, handleStockRetraction],
    9: [StockTransfer, handleStockTransfer],
    10: [ConvertibleIssuance, handleConvertibleIssuance],
    11: [EquityCompensationIssuance, handleEquityCompensationIssuance],
    // 12: [null, /*TODO: StockPlanPoolAdjustment, handleStockPlanPoolAdjustment*/ null],
    13: [WarrantIssuance, handleWarrantIssuance],
    14: [EquityCompensationExercise, handleEquityCompensationExercise],
};
// (idx => type name) derived from txMapper
export const txTypes = Object.fromEntries(
    // @ts-ignore
    Object.entries(txMapper).map(([i, [_, f]]) => [i, f.name.replace("handle", "")])
);
// (name => handler) derived from txMapper
export const txFuncs = Object.fromEntries(Object.entries(txMapper).map(([i, [_, f]]) => [txTypes[i], f]));
