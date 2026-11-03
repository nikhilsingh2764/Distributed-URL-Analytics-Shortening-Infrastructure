import mongoose from "mongoose";
import logger from "./logger.js";
import env from "./env.js";

const connectDB = async () => {
    mongoose.set("strictQuery", true);
    const connection = await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    logger.info(`MongoDB connected: ${connection.connection.host}/${connection.connection.name}`);
    return connection;
};

export default connectDB;
