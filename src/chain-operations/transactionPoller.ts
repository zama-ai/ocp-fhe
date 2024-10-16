import { AbiCoder, EventLog } from "ethers";
import { withGlobalTransaction } from "../db/operations/atomic.ts";
import { readAllIssuers, readFairmintDataById } from "../db/operations/read.js";
import { updateIssuerById, upsertFairmintData } from "../db/operations/update.js";
import { getIssuerContract } from "../utils/caches.ts";
import sleep from "../utils/sleep.js";
import { verifyIssuerAndSeed } from "./seed.js";
import { contractFuncs, txFuncs, txMapper, txTypes } from "./transactionHandlers.js";

const abiCoder = new AbiCoder();

interface QueuedEvent {
    type: string;
    timestamp: Date;
    data: any;
    o: EventLog;
}

let _keepProcessing = true;
let _finishedProcessing = false;

export const stopEventProcessing = async () => {
    _keepProcessing = false;
    while (!_finishedProcessing) {
        await sleep(50);
    }
};

export const pollingSleepTime = 5000;

export const startEventProcessing = async (finalizedOnly: boolean, dbConn) => {
    // flags to allow the process to get shut down elegantly
    _keepProcessing = true;
    _finishedProcessing = false;
    while (_keepProcessing) {
        const issuers = await readAllIssuers();

        // console.log(`Processing synchronously for ${issuers.length} issuers`);
        for (const issuer of issuers) {
            if (issuer.deployed_to) {
                const { contract, provider, libraries } = await getIssuerContract(issuer);
                await processEvents(dbConn, contract, provider, issuer, libraries.txHelper, finalizedOnly);
            }
        }
        await sleep(pollingSleepTime);
    }
    _finishedProcessing = true;
};

// search across X number of blocks, but process up to maxEvents per loop.
const processEvents = async (dbConn, contract, provider, issuer, txHelper, finalizedOnly, maxBlocks = 1500, maxEvents = 250) => {
    console.log("Processing events for issuer", issuer._id);
    /*
    We process up to `maxEvents` across `maxBlocks` to ensure our transaction sizes dont get too big and bog down our db
    */
    let { _id: issuerId, last_processed_block: lastProcessedBlock, tx_hash: deployedTxHash } = issuer;
    const { number: latestBlock } = await provider.getBlock(finalizedOnly ? "finalized" : "latest");
    if (lastProcessedBlock === null) {
        const receipt = await provider.getTransactionReceipt(deployedTxHash);
        if (!receipt) {
            console.error("Deployment receipt not found");
            return;
        }
        if (receipt.blockNumber > latestBlock) {
            // console.log("Deployment tx not finalized", {receipt, lastFinalizedBlock: latestBlock});
            return;
        }
        //
        lastProcessedBlock = receipt.blockNumber - 1;
        // we've never processed this issuer before, process.
        await issuerDeployed(issuerId, lastProcessedBlock, contract, dbConn);
    }
    const startBlock = lastProcessedBlock + 1;
    let endBlock = Math.min(startBlock + maxBlocks, latestBlock);
    if (startBlock >= endBlock) {
        return;
    }

    // console.log(" processing from", { startBlock, endBlock });
    let events: QueuedEvent[] = [];

    const contractEvents: EventLog[] = await contract.queryFilter("*", startBlock, endBlock);
    for (const event of contractEvents) {
        const type = event?.fragment?.name;
        if (contractFuncs.has(type)) {
            const { timestamp } = await provider.getBlock(event.blockNumber);
            events.push({ type, timestamp, data: event.args[0], o: event });
        }
    }

    const txEvents: EventLog[] = await txHelper.queryFilter(txHelper.filters.TxCreated, startBlock, endBlock);
    for (const event of txEvents) {
        if (event.removed) {
            continue;
        }
        const [_len, typeIdx, txData] = event.args;
        const [structType, _] = txMapper[typeIdx];
        const decodedData = abiCoder.decode([structType], txData);
        const { timestamp } = await provider.getBlock(event.blockNumber);
        events.push({ type: txTypes[typeIdx], timestamp, data: decodedData[0], o: event });
    }

    // Nothing to process
    if (events.length === 0) {
        await updateLastProcessed(issuerId, endBlock);
        return;
    }

    // Process only up to a certain amount
    [events, endBlock] = trimEvents(events, maxEvents, endBlock);

    await withGlobalTransaction(async () => {
        await persistEvents(issuerId, events);
        await updateLastProcessed(issuerId, endBlock);
    }, dbConn);
};

const issuerDeployed = async (issuerId, lastProcessedBlock, contract, dbConn) => {
    console.log("New issuer was deployed", { issuerId });

    const events = await contract.queryFilter(contract.filters.IssuerCreated);
    if (events.length === 0) {
        throw new Error(`No issuer events found!`);
    }
    const issuerCreatedEventId = events[0].args[0];
    console.log("IssuerCreated event captured!", { issuerCreatedEventId });

    await withGlobalTransaction(async () => {
        await verifyIssuerAndSeed(contract, issuerCreatedEventId);
        await updateLastProcessed(issuerId, lastProcessedBlock);
    }, dbConn);
};

const persistEvents = async (issuerId, events: QueuedEvent[]) => {
    // Persist all the necessary changes for each event gathered in process events
    console.log(`${events.length} events to process for issuerId ${issuerId}`);
    for (const event of events) {
        const { type, data, timestamp } = event;
        const txHandleFunc = txFuncs[type];
        if (txHandleFunc) {
            // @ts-ignore
            await txHandleFunc(data, issuerId, timestamp);
            continue;
        }
        const contractHandleFunc = contractFuncs.get(type);
        if (contractHandleFunc) {
            await contractHandleFunc(data);
            continue;
        }
        console.error("Invalid transaction type: ", type, event);
        throw new Error(`Invalid transaction type: "${type}"`);
    }
};

export const trimEvents = (origEvents: QueuedEvent[], maxEvents, endBlock) => {
    // Sort for correct execution order
    let events = [...origEvents];
    events.sort((a, b) => a.o.blockNumber - b.o.blockNumber || a.o.transactionIndex - b.o.transactionIndex || a.o.index - b.o.index);
    let index = 0;
    while (index < maxEvents && index < events.length) {
        // Include the entire next block
        const includeBlock = events[index].o.blockNumber;
        index++;
        // skipping blocs with the same blockNumber
        while (index < events.length && events[index].o.blockNumber === includeBlock) {
            index++;
        }
    }
    // Nothing to trim!
    if (index >= events.length) {
        return [events, endBlock];
    }
    // We processed up to the last events' blockNumber
    // `index` is *exclusive* when trimming
    const useEvents = [...events.slice(0, index)];
    return [useEvents, useEvents[useEvents.length - 1].o.blockNumber];
};

const updateLastProcessed = async (issuerId, lastProcessedBlock) => {
    return updateIssuerById(issuerId, { last_processed_block: lastProcessedBlock });
};
