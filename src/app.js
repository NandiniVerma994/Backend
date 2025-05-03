import express from "express"
import cors from "cors"
import cookieParser  from "cookie-parser"

//all properties are transferred into this app using express method
const app = express()

//these all the middlewares
//Use the CORS middleware for all incoming routes/requests
//So you don’t have to manually add CORS for every route — it applies globally
app.use(cors({
    //this sets which origin(frontend is allowed to make requests to your backend)
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//data at backend will come from various places like some url or data wwill come in json form
//we can set limit on the json type of response
//app.use means we are configuring middle ware, we are accepting json type data and putting limits on it
app.use(express.json({limit: "16kb"}))
//sets maximum size of incoming data
//prevents users from sending huge requests that might crash your server
//url sometimes gets converted into % or $ so we are telling our express app to understand all these
app.use(express.urlencoded({extended: true, limit: "16kb"}))
//looks inside the public folder and automatically serves any files inside it as static files to the client
app.use(express.static("public"))
//It tells your Express app:
//“Use the cookie-parser middleware to automatically read and parse cookies from incoming requests.”
app.use(cookieParser())

export { app }
