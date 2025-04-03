import { ethers } from "ethers";
import { getChainConfig } from "../utils/chains.js";

const getProvider = (chainId) => {
    const chainConfig = getChainConfig(chainId);
    console.log("Getting provider for chain:", chainId);
    console.log("Chain config:", chainConfig);

    if (!chainConfig) {
        throw new Error(`Chain ${chainId} not supported`);
    }

    // Force IPv4 by using 127.0.0.1 instead of localhost
    const rpcUrl = process.env.RPC_URL.replace("localhost", "127.0.0.1");
    console.log("Using RPC URL:", rpcUrl);

    return new ethers.JsonRpcProvider(rpcUrl);
};

export default getProvider;
