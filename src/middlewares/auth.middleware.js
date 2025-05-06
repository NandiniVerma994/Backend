//This middleware verifies if user is there or not
// we are writing this in another becz we have to always know if the user is authentic or not like when the user
// will like a post then we need to know if the user is authenticated or not
import { ApiError } from "../utils/ApiError";
import { asyncHandler  } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model";

export const verifyJWT = asyncHandler(async(req, resizeBy, next) => {
    // if cookies send the accessToken or frontend
    try {
        const token = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "")
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})
