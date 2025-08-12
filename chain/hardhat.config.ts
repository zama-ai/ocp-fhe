
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";
import "hardhat-preprocessor";

import "./tasks/accounts";
import "./tasks/FHECounter";
import "./tasks/CapTable";
import fs from "fs";

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const RPC_URL: string = vars.get("RPC_URL", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");

function getRemappings() {
    return fs
        .readFileSync("remappings.txt", "utf8")
        .split("\n")
        .filter(Boolean) // remove empty lines
        .map((line) => line.trim().split("="));
}

const config: HardhatUserConfig = {
    // preprocess: {
    //     eachLine: (hre) => ({
    //         transform: (line: string) => {
    //             if (line.match(/^\s*import /i)) {
    //                 getRemappings().forEach(([find, replace]) => {
    //                     // console.log(find, replace);
    //                     if (line.match(find)) {
    //                         console.log(`Replacing ${find} with ${replace}`);
    //                         line = line.replace(find, replace);
    //                     }
    //                 });
    //             }
    //             return line;
    //         },
    //     }),
    // },
    defaultNetwork: "hardhat",
    namedAccounts: {
        deployer: 0,
    },
    etherscan: {
        apiKey: {
            sepolia: vars.get("ETHERSCAN_API_KEY", ""),
        },
    },
    gasReporter: {
        currency: "USD",
        enabled: process.env.REPORT_GAS ? true : false,
        excludeContracts: [],
    },
    networks: {
        hardhat: {
            accounts: {
                mnemonic: MNEMONIC,
            },
            chainId: 31337,
        },

        sepolia: {
            accounts: {
                mnemonic: MNEMONIC,
                path: "m/44'/60'/0'/0/",
                count: 10,
            },
            chainId: 11155111,
            url: `${RPC_URL}`,
        },
    },
     paths: {
         artifacts: "./artifacts",
         cache: "./cache",
         sources: "./src",
         tests: "./test",
     },
    solidity: {
        version: "0.8.24",
        settings: {
            metadata: {
                // Not including the metadata hash
                // https://github.com/paulrberg/hardhat-template/issues/31
                bytecodeHash: "none",
            },
            // Disable the optimizer when debugging
            // https://hardhat.org/hardhat-network/#solidity-optimizer-support
            optimizer: {
                enabled: true,
                runs: 800,
            },
            evmVersion: "cancun",
        },
    },
    typechain: {
        outDir: "types",
        target: "ethers-v6",
    },
};

export default config;
