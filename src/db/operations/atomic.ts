/* eslint-disable @typescript-eslint/no-explicit-any */
// Store a global mongo session to allows us to bundle CRUD operations into one transaction
import { Connection, QueryOptions, ClientSession } from "mongoose";
import { connectDB } from "../config/mongoose";
type TQueryOptions = QueryOptions | null;

let _globalSession: ClientSession | null = null;

export const setGlobalSession = (session: ClientSession) => {
    if (_globalSession !== null) {
        throw new Error(
            `globalSession is already set! ${_globalSession}. 
            Nested transactions are not supported`
        );
    }
    _globalSession = session;
};

export const clearGlobalSession = () => {
    _globalSession = null;
};

const isReplSet = () => {
    if (process.env.DATABASE_REPLSET === "1") {
        return true;
    }
    return false;
};

export const withGlobalTransaction = async (func: () => Promise<void>, useConn?: Connection) => {
    if (!isReplSet()) {
        // Transactions in mongo only work when running with --replSet
        //  https://www.mongodb.com/docs/manual/tutorial/convert-standalone-to-replica-set/
        return await func();
    }

    // Wrap a user defined `func` in a global transaction
    const dbConn = useConn || (await connectDB());
    await dbConn.transaction(async (session) => {
        setGlobalSession(session);
        try {
            return await func();
        } finally {
            clearGlobalSession();
        }
    });
};

const includeSession = (options?: TQueryOptions) => {
    let useOptions = options || {};
    if (_globalSession !== null) {
        if (useOptions.session) {
            throw new Error(`options.session is already set!: ${useOptions}`);
        }
        useOptions.session = _globalSession;
    }
    return useOptions;
};

/* 
Wrapped mongoose db calls. All mongo interaction should go through a function below
*/

// CREATE

export const save = (model: any, options?: TQueryOptions) => {
    return model.save(includeSession(options));
};

// UPDATE

export const findByIdAndUpdate = (model: any, id: string, updatedData: any, options?: TQueryOptions) => {
    return model.findByIdAndUpdate(id, updatedData, includeSession(options));
};

export const findBySecurityIdAndUpdate = (model: any, securityId: string, updatedData: any, options?: TQueryOptions) => {
    return model.findOneAndUpdate({ security_id: securityId }, updatedData, includeSession(options));
};

// DELETE

export const findByIdAndDelete = (model: any, id: string, options?: TQueryOptions) => {
    return model.findByIdAndDelete(id, includeSession(options));
};

// QUERY

export const findById = (model: any, id: string, projection?: any, options?: TQueryOptions) => {
    return model.findById(id, projection, includeSession(options));
};

export const findOne = (model: any, filter: any, projection?: any, options?: TQueryOptions) => {
    return model.findOne(filter, projection, includeSession(options));
};

export const find = (model: any, filter: any, projection?: any, options?: TQueryOptions) => {
    return model.find(filter, projection, includeSession(options));
};

export const countDocuments = (model: any, options?: TQueryOptions) => {
    return model.countDocuments(includeSession(options));
};
