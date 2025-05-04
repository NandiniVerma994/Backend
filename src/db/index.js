import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

//this is asynchronous method so it will return a promise
const connectDB = async () => {
    try {
        //This line connects your Node.js app to a MongoDB database using the Mongoose library.
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        // gives the hostname of the MongoDB server you connected to.
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection error ", error);
        process.exit(1)
    }
}

export default connectDB