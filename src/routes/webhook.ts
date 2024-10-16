import { Router } from "express";
import get from "lodash/get.js";
import axios from "axios";
import { API_URL } from "../fairmint/config.js";
import { convertBytes16ToUUID } from "../utils/convertUUID.js";
import {
    handleIssuer,
    handleIssuerAuthorizedSharesAdjusted,
    handleStakeholder,
    handleStockAcceptance,
    handleStockCancellation,
    handleStockClass,
    handleStockClassAuthorizedSharesAdjusted,
    handleStockIssuance,
    handleStockReissuance,
    handleStockRepurchase,
    handleStockRetraction,
    handleStockTransfer,
} from "../chain-operations/transactionHandlers.js";
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
} from "../chain-operations/structs.js";
import { AbiCoder } from "ethers";
import { readFairmintDataById } from "../db/operations/read.js";
const webhooks = Router();

/*
const TOPICS = {
    "0x9f88fb156974def70024c0bee5f2fefd94c4f8141b6468bd9e49eb0425639845": "TxCreated",
    "0x53df47344d1cdf2ddb4901af5df61e37e14606bb7c8cc004d65c7c83ab3d0693": "StakeholderCreated",
    "0xc7496d70298fcc793e1d058617af680232585e302f0185b14bba498b247a9c1d": "StockClassCreated",
    "0xb8cbde9f597f493a1b4d1c4db5fded9cd26293080750a0df6b7e7097f4b680dd": "IssuerCreated",
};
*/

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
};

// (idx => type name) derived from txMapper
export const txTypes = Object.fromEntries(
    // @ts-ignore
    Object.entries(txMapper).map(([i, [_, f]]) => [i, f.name.replace("handle", "")])
);
// (name => handler) derived from txMapper
export const txFuncs = Object.fromEntries(Object.entries(txMapper).map(([i, [_, f]]) => [txTypes[i], f]));

const abiCoder = new AbiCoder();
webhooks.get("/", async (req, res) => {
    res.status(200).json("ok");
});

webhooks.post("/tx-created", async (req, res) => {
    try {
        const { event } = req.body;
        console.log("Event received:", event);
        const logs = get(event, "data.block.logs", []);
        const timestamp = get(event, "data.block.timestamp");
        console.log("timestamp", timestamp);

        for (const log of logs) {
            const { data } = log;
            console.log("data", data);
            // Get issuer id from log
            const issuerIdBytes = get(log, "account.address", null);
            if (!issuerIdBytes) {
                // TODO: check if issuer exists in db
                console.error("No issuer id found");
                continue;
            }
            const issuerId = convertBytes16ToUUID(issuerIdBytes);

            // decode the data using abi.decode
            // TODO: make it a struct
            const [_, txTypeIdx, txData] = abiCoder.decode(["uint256", "uint8", "bytes"], data);
            const txType = txTypes[txTypeIdx];
            const [structType, handleFunc] = txMapper[txTypeIdx];
            const decodedData = abiCoder.decode([structType], txData);

            const tx = {
                type: txType,
                timestamp,
                data: decodedData[0],
            };

            if (handleFunc) {
                console.log("Handling transaction:", txType);
                await handleFunc(tx.data, issuerId, tx.timestamp);
            } else {
                console.error("Invalid transaction type: ", txType);
                throw new Error(`Invalid transaction type: "${txType}"`);
            }
        }
        res.status(200).json("ok");
    } catch (error) {
        console.error("Error handling transaction:", error);
        res.status(500).send("Failed to handle transaction");
    }
});

webhooks.post("/stock-class-created", async (req, res) => {
    try {
        console.log("stock-class-created route");
        const { event } = req.body;
        console.log("Event received:", event);

        const logs = get(event, "data.block.logs", []);

        for (const log of logs) {
            const { data } = log;
            console.log("data", data);

            const issuerIdBytes = get(log, "account.address", null);
            if (!issuerIdBytes) {
                console.error("No issuer id found");
                continue;
            }
            // TODO: check if issuer exists in db
            const stockClassIdEncoded = get(log, "topics.1", null);
            const stockClassId = abiCoder.decode(["bytes16"], stockClassIdEncoded)[0];
            if (!stockClassId) {
                console.error("No stock class id found");
                continue;
            }
            // TODO: check if stock class exists in db
            await handleStockClass(stockClassId);
        }
        res.status(200).json("ok");
    } catch (error) {
        console.error("Error handling transaction:", error);
        res.status(500).send("Failed to handle transaction");
    }
});

webhooks.post("/issuer-created", async (req, res) => {
    try {
        console.log("issuer-created route");
        const { event } = req.body;
        console.log("Event received:", event);
        const logs = get(event, "data.block.logs", []);

        for (const log of logs) {
            console.log("log", JSON.stringify(log, null, 2));
            const { data } = log;
            console.log("data", data);

            const issuerIdBytes = get(log, "topics.1", null);
            if (!issuerIdBytes) {
                console.error("No issuer id found");
                return;
            }
            // TODO: check if issuer exists in db

            const [issuerIdBytes16] = abiCoder.decode(["bytes16"], issuerIdBytes);
            console.log("issuerIdBytes16", issuerIdBytes16);
            await handleIssuer(issuerIdBytes16);
        }
        res.status(200).json("ok");
    } catch (error) {
        console.error("Error handling transaction:", error);
        res.status(500).send("Failed to handle transaction");
    }
});

webhooks.post("/stakeholder-created", async (req, res) => {
    try {
        console.log("stakeholder-created route");
        const { event } = req.body;
        console.log("Event received:", event);
        const logs = get(event, "data.block.logs", []);

        for (const log of logs) {
            console.log("log", JSON.stringify(log, null, 2));
            const stakeholderIdEncoded = get(log, "topics.1", null);
            console.log("before converting", stakeholderIdEncoded);
            const stakeholderId = abiCoder.decode(["bytes16"], stakeholderIdEncoded)[0];
            console.log("after converting", stakeholderId);
            if (!stakeholderId) {
                console.error("No stakeholder id found");
                continue;
            }
            await handleStakeholder(stakeholderId);
        }
        res.status(200).json("ok");
    } catch (error) {
        console.error("Error handling transaction:", error);
        res.status(500).send("Failed to handle transaction");
    }
});

export default webhooks;
