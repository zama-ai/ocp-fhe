import mongoose from "mongoose";
import { v4 as uuid } from "uuid";

export const FACTORY_VERSION = {
    DIAMOND: "DIAMOND",
    LEGACY: "LEGACY",
};

const CHAIN_ID = {
    BASE_MAINNET: "8453",
    BASE_SEPOLIA: "84532",
    ANVIL: "31337",
};

const FactorySchema = new mongoose.Schema(
    {
        _id: { type: String, default: () => uuid() },
        object_type: { type: String, default: "FACTORY" },
        implementation_address: String,
        factory_address: String,
        chain_id: {
            type: String,
            required: true,
            enum: Object.values(CHAIN_ID),
        },
        version: {
            type: String,
            required: true,
            enum: Object.values(FACTORY_VERSION),
        },
    },
    { timestamps: true }
);

const Factory = mongoose.model("Factory", FactorySchema);

export default Factory;
