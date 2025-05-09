//This middleware verifies if user is there or not
// we are writing this in another becz we have to always know if the user is authentic or not like when the user
// will like a post then we need to know if the user is authenticated or not
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler  } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js";


export const verifyJWT = asyncHandler(async(req, resizeBy, next) => {
    // if cookies send the accessToken or frontend
    try {
        // checks if access token is present in cookies if not it checks in the authorization head then it removes
        // the bearer part of the token because tokens appear many places like this Authorization: "Bearer xyz456"
// token = "xyz456" (cookies me se token le lo ya phir..)
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "")
    
        //if no token found
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        
        //the first parameter is verified using the second parameter, if its valid it decodes data like id, email etc
        // ( the access token carried so many info)
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // looks up in the mongodb by the id we got from the decoded token, the password and refresh token
        // are not included in the result
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        // if user does not exist
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
        // if everything is good adds the user data to the req.user
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})
