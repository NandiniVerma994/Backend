//require('dotenv').config({path: './env'})
import dotenv from "dotenv"

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
})

//after database connection is done it will return a promise so we are handling it using then catch as its an asynchronous function
//app.listen() starts the server and opens the network port, only after the server is listening it can accept http request like get, post, put and send response to the client
//res.send() send a response for a specific request
//the app listens for HTTP requests of client not the database
//if the db connection fails, we dont want server to start bcz it cant fulfil requests without the database connection
//if db connecction is successful then only we start listening for client request
//app.get ('/)...server decides and responds
//app.get(path, callback)
// path → the URL you want to listen on (like '/' or '/users')
// callback → the function that runs when someone visits that URL.
// It receives two arguments:
// req → the request object (holds info about the incoming request)
// res → the response object (used to send back data to the client)
connectDB() 
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`)
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!!", err);
})

/*import express from "express"
const app = express()

( async() => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR:", error);//console not able to talk to the database
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()
    */