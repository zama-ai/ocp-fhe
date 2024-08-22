import { verifyIssuerAndSeed } from "./seed.js";
import {
    handleStockCancellation,
    handleIssuerAuthorizedSharesAdjusted,
    handleStockAcceptance,
    handleStockReissuance,
    handleStockRepurchase,
    handleStockRetraction,
    handleStockClass,
    handleStakeholder,
    handleStockIssuance,
    handleStockTransfer,
    handleStockClassAuthorizedSharesAdjusted,
} from "./transactionHandlers.js";
import { AbiCoder } from "ethers";
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
} from "./structs.js";
import { readFairmintDataById } from "../db/operations/read.js";
import { API_URL } from "../fairmint/config.js";
import axios from "axios";

const abiCoder = new AbiCoder();

const txMapper = {
    0: ["INVALID"],
    1: ["ISSUER_AUTHORIZED_SHARES_ADJUSTMENT", IssuerAuthorizedSharesAdjustment],
    2: ["STOCK_CLASS_AUTHORIZED_SHARES_ADJUSTMENT", StockClassAuthorizedSharesAdjustment],
    3: ["STOCK_ACCEPTANCE", StockAcceptance],
    4: ["STOCK_CANCELLATION", StockCancellation],
    5: ["STOCK_ISSUANCE", StockIssuance],
    6: ["STOCK_REISSUANCE", StockReissuance],
    7: ["STOCK_REPURCHASE", StockRepurchase],
    8: ["STOCK_RETRACTION", StockRetraction],
    9: ["STOCK_TRANSFER", StockTransfer],
};

async function startOnchainListeners(contract, provider, issuerId, libraries, redisClient) {
    console.log("🌐 | Initiating on-chain event listeners for issuer", issuerId, "at address", contract.target);

    let isProcessing = false;

    const processEventQueue = async () => {
        if (isProcessing) return; // avoid unnecessary processing if there's already events in the queue.

        isProcessing = true;
        const queueLength = await redisClient.lLen(`queue:${issuerId}`);

        try {
            while (queueLength > 0) {
                const event = await redisClient.lIndex(`queue:${issuerId}`); // Peak the first element

                await processEvent(JSON.parse(event));
                await redisClient.lPop(`queue:${issuerId}`); // Pop event from queue only if successful

            }
        } catch (error) {
            console.error(`Error processing event of type ${event.type}:`, error);
            // Consider adding the event back to the queue or to a separate error queue
        } finally {
            isProcessing = false;
        }
    };

    const queueAndProcessEvent = async (event) => {
        // Ensure the queue exists by checking its length, in redis it auto creates a list if it doesn't exists when using push command
        const queueLength = await redisClient.lLen(`queue:${issuerId}`);
        console.log("Issuer ", issuerId, "has queue length", queueLength);
        // push to the most right position of the array
        await redisClient.rPush(`queue:${issuerId}`, JSON.stringify(event));
        await processEventQueue();
    };

    libraries.txHelper.on("TxCreated", async (_, txTypeIdx, txData, event) => {
        const [type, structType] = txMapper[txTypeIdx];
        const decodedData = abiCoder.decode([structType], txData);
        const { timestamp } = await provider.getBlock(event.blockNumber);
        await queueAndProcessEvent({ type, data: decodedData[0], issuerId, timestamp });
    });

    contract.on("StakeholderCreated", async (id, _) => {
        console.log("Create Stakeholder event");
        await queueAndProcessEvent({ type: "STAKEHOLDER_CREATED", data: id, issuerId });
    });

    contract.on("StockClassCreated", async (id, _) => {
        await queueAndProcessEvent({ type: "STOCK_CLASS_CREATED", data: id, issuerId });
    });

    // Issuer Initialization: This is the first time we're processing the issuer.
    const issuerCreatedFilter = contract.filters.IssuerCreated;
    const issuerEvents = await contract.queryFilter(issuerCreatedFilter);

    const issuerEventFired = new Set();

    if (issuerEvents.length > 0 && !issuerEventFired.has(issuerEvents[0].args[0])) {
        const id = issuerEvents[0].args[0];
        console.log("IssuerCreated Event Emitted!", id);
        console.log("New issuer was deployed", { issuerId: id });

        const fairmintData = await readFairmintDataById(issuerId);
        if (fairmintData !== null && fairmintData._id) {
            console.log("Fairmint data", fairmintData._id);
            console.log("Reflecting Issuer into fairmint...");
            const webHookUrl = `${API_URL}/ocp/reflectCaptable?portalId=${issuerId}`;
            const resp = await axios.post(webHookUrl, {});
            console.log(`Successfully reflected Issuer ${issuerId} into Fairmint webhook`);
            console.log("Fairmint response:", resp.data);
        }

        await verifyIssuerAndSeed(contract, id);
        issuerEventFired.add(issuerEvents[0].args[0]);
    }
}

async function processEvent(event) {
    switch (event.type) {
        case "STAKEHOLDER_CREATED":
            await handleStakeholder(event.data);
            break;
        case "STOCK_CLASS_CREATED":
            await handleStockClass(event.data);
            break;
        case "ISSUER_AUTHORIZED_SHARES_ADJUSTMENT":
            await handleIssuerAuthorizedSharesAdjusted(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_CLASS_AUTHORIZED_SHARES_ADJUSTMENT":
            await handleStockClassAuthorizedSharesAdjusted(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_ACCEPTANCE":
            await handleStockAcceptance(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_CANCELLATION":
            await handleStockCancellation(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_ISSUANCE":
            await handleStockIssuance(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_REISSUANCE":
            await handleStockReissuance(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_REPURCHASE":
            await handleStockRepurchase(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_RETRACTION":
            await handleStockRetraction(event.data, event.issuerId, event.timestamp);
            break;
        case "STOCK_TRANSFER":
            await handleStockTransfer(event.data, event.issuerId, event.timestamp);
            break;
        case "INVALID":
            throw new Error("Invalid transaction type");
        default:
            console.warn(`Unhandled event type: ${event.type}`);
    }
}

export default startOnchainListeners;
