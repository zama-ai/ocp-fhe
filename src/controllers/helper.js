import { isCallException, Interface } from "ethers";
import CAP_TABLE_ABI from "../../chain/out/CapTable.sol/CapTable.json" assert { type: "json" };
// Create an Interface instance
const iface = new Interface(CAP_TABLE_ABI.abi);

export const withChainErrorHandler =
    (fn) =>
    async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            if (isCallException(error)) {
                const decodedError = iface.parseError(error.data);
                console.error(`Decoded error: ${decodedError.name}`, decodedError.args);
                throw new Error(`Decoded error - ${decodedError.name}: ${JSON.stringify(decodedError.args, null, 2)}`);
            } else {
                throw new Error("Unhandled error:", error?.message);
            }
            throw error; // Re-throw the error after logging
        }
    };
