import { Log, WebSocketProvider, AbiCoder, AlchemyProvider, Provider, Block } from "ethers";
import getProvider from "./chain-operations/getProvider";
import WebSocket from "ws";
import get from "lodash/get.js";
import { txFuncs, txTypes, txMapper } from "./routes/webhook";
import Issuer from "./db/objects/Issuer";
import { connectDB } from "./db/config/mongoose";
import { handleIssuer, handleStakeholder, handleStockClass } from "./chain-operations/transactionHandlers";
// @dev this script needs to run first in order to run the others scripts in this file

const TOPICS = {
    TxCreated: "0x9f88fb156974def70024c0bee5f2fefd94c4f8141b6468bd9e49eb0425639845",
    StakeholderCreated: "0x53df47344d1cdf2ddb4901af5df61e37e14606bb7c8cc004d65c7c83ab3d0693",
    StockClassCreated: "0xc7496d70298fcc793e1d058617af680232585e302f0185b14bba498b247a9c1d",
    IssuerCreated: "0xb8cbde9f597f493a1b4d1c4db5fded9cd26293080750a0df6b7e7097f4b680dd",
};
const abiCoder = new AbiCoder();
// Create a Set to store unique addresses
const watchedAddresses = new Set<string>();

// Function to add new addresses to the filter (can handle single or multiple addresses)
export const addAddressesToWatch = (addresses: string | string[]) => {
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    addressArray.forEach((address) => watchedAddresses.add(address));
    console.log("watchedAddresses", watchedAddresses);
    updateProviderFilter();
};

// Function to remove addresses from the filter (can handle single or multiple addresses)
export const removeAddressesToWatch = (addresses: string | string[]) => {
    const addressArray = Array.isArray(addresses) ? addresses : [addresses];
    addressArray.forEach((address) => watchedAddresses.delete(address));
    updateProviderFilter();
};

// let provider: Provider;
const provider = getProvider() as Provider;

// Function to update the provider filter
const updateProviderFilter = () => {
    if (!provider) {
        console.log("🔗 | No provider found");
        return;
    }
    console.log("🔗 | Updating provider filter");
    provider.removeAllListeners();
    setupProviderListener();
};

// Function to set up the provider listener
const setupProviderListener = () => {
    console.log("🔗 | Setting up provider listener");
    provider.on("block", async (block: Block) => {
        console.log("🔗 | Block received:", block.number);
        // block.transactions.forEach(async (tx) => {
        //     const receipt = await tx.getReceipt();
        //     console.log("🔗 | Transaction receipt:", receipt);
        // });
    });
    provider.on(
        {
            address: Array.from(watchedAddresses),
            topics: [Object.values(TOPICS)],
        },
        async (log: Log) => {
            console.log("log", JSON.stringify(log, null, 2));
            const eventReceivedTime = Date.now();
            const block = await log.getBlock();
            if (!block) {
                console.error("No block found");
                return;
            }
            const deployed_to = log.address;
            await handleEventType(log, block, deployed_to);

            const blockTimestamp = block.timestamp * 1000; // Convert to milliseconds
            console.log("Block timestamp:", new Date(blockTimestamp).toISOString());
            console.log("Event received time:", new Date(eventReceivedTime).toISOString());
            console.log("Time difference:", eventReceivedTime - blockTimestamp, "ms");
        }
    );

    provider.on("error", (err) => {
        console.error(err);
    });
};

export const startListener = async (contracts: string[]) => {
    console.log("🔗 | Starting listener");
    addAddressesToWatch(contracts);
    setupProviderListener();
};

const handleEventType = async (log: Log, block: Block, deployed_to: string) => {
    switch (log.topics[0]) {
        case TOPICS.StockClassCreated:
            console.log("stock class created");
            const stockClassIdBytes = get(log, "topics.1", null);
            if (!stockClassIdBytes) {
                console.error("No stock class id found");
                return;
            }
            const [stockClassIdBytes16] = abiCoder.decode(["bytes16"], stockClassIdBytes);
            await handleStockClass(stockClassIdBytes16);
            break;

        case TOPICS.StakeholderCreated:
            console.log("stakeholder created");
            const stakeholderIdBytes = get(log, "topics.1", null);
            if (!stakeholderIdBytes) {
                console.error("No stakeholder id found");
                return;
            }
            const [stakeholderIdBytes16] = abiCoder.decode(["bytes16"], stakeholderIdBytes);
            console.log("stakeholderIdBytes16", stakeholderIdBytes16);
            await handleStakeholder(stakeholderIdBytes16);
            break;

        case TOPICS.IssuerCreated:
            console.log("issuer created");
            const issuerIdBytes = get(log, "topics.1", null);
            if (!issuerIdBytes) {
                console.error("No issuer id found");
                return;
            }
            const [issuerIdBytes16] = abiCoder.decode(["bytes16"], issuerIdBytes);
            console.log("issuerIdBytes16", issuerIdBytes16);
            await handleIssuer(issuerIdBytes16);
            break;

        case TOPICS.TxCreated:
            console.log("tx created");
            const issuer = await Issuer.findOne({ deployed_to });
            if (!issuer) {
                console.error("No issuer found");
                return;
            }
            const issuerId = issuer._id;
            console.log("issuer", issuerId);
            const [_, txTypeIdx, txData] = abiCoder.decode(["uint256", "uint8", "bytes"], log.data);
            const txType = txTypes[txTypeIdx];
            const [structType, handleFunc] = txMapper[txTypeIdx];
            const decodedData = abiCoder.decode([structType], txData);

            const _tx = {
                type: txType,
                timestamp: block.timestamp,
                data: decodedData[0],
            };

            if (handleFunc) {
                console.log("Handling transaction:", txType);
                await handleFunc(_tx.data, issuerId, _tx.timestamp);
                console.log("✅ | Transaction handled:", txType);
            } else {
                console.error("Invalid transaction type: ", txType);
                throw new Error(`Invalid transaction type: "${txType}"`);
            }
            break;

        default:
            console.warn(`Unhandled event type for address: ${deployed_to}`);
    }
};

const main = async () => {
    await connectDB();
    console.log("connected to db");

    startListener([]); // TODO: add contracts to watch
};

// main()
//     .then()
//     .catch((err) => {
//         console.error(err);
//     });
export default main;
