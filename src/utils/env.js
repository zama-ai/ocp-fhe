import { config } from "dotenv";
import fs from "fs";
import pathTools from "path";
import get from "lodash/get.js";

const splitPath = (path) => {
    /* 
    Split the file/dir path into its directory and the rightMost piece
     ie /home/user/file.txt --> {dir: "/home/user", rightMost: "file.txt"}
    */
    const normalizedPath = path.replace(/\/+$/, "");
    const lastIndex = normalizedPath.lastIndexOf("/");
    const dir = normalizedPath.substring(0, lastIndex);
    const rightMost = normalizedPath.substring(lastIndex + 1);
    return { dir, rightMost };
};

const getEnvFile = (fileName) => {
    // Find the .env file by iterating up the PWD. However do not go past the repo root!
    const repoRootDirName = "open-captable-protocol";
    const cwd = process.env.PWD;
    let { dir, rightMost } = splitPath(cwd);
    let check = pathTools.join(cwd, fileName);
    while (!fs.existsSync(check)) {
        if (rightMost === repoRootDirName) {
            // console.error(`Unable to locate .env file in ${check}, falling back`);
            // Instead of throwing, return null to allow fallback
            return null;
        }
        // Check our current dir
        check = pathTools.join(dir, fileName);
        // The dir to look in next
        ({ dir, rightMost } = splitPath(dir));
    }
    return check;
};

let _ALREADY_SETUP = false;

export const setupEnv = () => {
    if (_ALREADY_SETUP) {
        return;
    }

    // If we're in a Docker environment, skip file loading
    if (get(process, "env.DOCKER_ENV", false)) {
        console.log("Using runtime environment variables");
        _ALREADY_SETUP = true;
        return;
    }

    // Try loading files in order of precedence (least specific to most specific)
    const NODE_ENV = process.env.NODE_ENV || "development";
    const envFiles = [
        ".env", // 1. .env (base defaults)
        `.env.${NODE_ENV}`, // 2. .env.development, .env.test, .env.production
        `.env.local`, // 3. .env.local (local overrides)
        `.env.${NODE_ENV}.local`, // 4. .env.development.local, .env.test.local, .env.production.local (most specific)
    ];

    for (const fileName of envFiles) {
        const envPath = getEnvFile(fileName);
        if (envPath) {
            console.log(`Loading environment from ${fileName}:`, envPath);
            config({ path: envPath, override: true }); // override: true means later files take precedence
        }
    }

    _ALREADY_SETUP = true;
};
