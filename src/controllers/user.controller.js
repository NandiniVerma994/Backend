import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// generating tokens only if users exist
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        //checking if the user exists
        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found while generating tokens")
        }
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        //db me tokens save ho gya
        // Stores the new refresh token in the user document (in the DB).
        // This ensures the backend knows which refresh token is valid for the use
        user.refreshToken = refreshToken;
        // no need for validation just save
        // validateBeforeSave: false → tells Mongoose skip schema validations 
        // (e.g., required fields), because we are only updating refreshToken, 
        // and we don’t want other fields to block the save.
        // When you call:
        // await user.save() Mongoose automatically runs schema validations before saving.
        // For example:
        // Checks if all required fields are filled, like fullname we had made required field
        // so it will throw validation error because we are logging in using just username
        // and password so we make it as false
        await user.save({validateBeforeSave: false})
        // access token returned to frontend
        return {accessToken, refreshToken}
    } catch(error) {
        //error from our side
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


//this method will register user
// registerUser function is an asynchronous function wrapped in asynchHandler so that errors
// are handled properly. 
// req: Request object containing data sent by the client (like user details).
// res: Response object used to send data back to the client.
// next: Used to pass control to the next middleware in case of errors.
const registerUser = asyncHandler( async (req, res) => {
    //Step-1 get user details from frontend
    //Step-2 validation - not empty
    //Step-3 check if user already exist: username, email
    //Step-4 check for images, check for avatar
    //Step-5 upload them to cloudinary, avatar
    //Step-6 create user object = create entry in db
    //Step-7 remove password and refresh token field from response
    //Step-8 check for user creation
    //Step-9 return res

    //STEP1
    //here data comes into the req.body from there we are destructuring and accessing the data
    //req.body contains data sent from frontend
    // req.body is a built-in object used to hold data sent by client
    const {fullName, email, username, password} = req.body;
    console.log("Email:", email);

    //STEP2
    //even after trimming its empty then throw error
    //checks if any of these fields are empty even after trimming spaces
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //STEP3
    // this checks if the user already exists in db so User
    const existedUser = await User.findOne({
        //either of these two found then 
        $or: [{ username }, { email }]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email of username already exists")
    }

    //STEP4
    //req.body(iske aandar saara data aata h) access is given by express
    //similarly multer gives us req.files (middleware req ke andar aur fields add krta h)
    //files ka access ho v skta aur nhi v , path of file deta h(av cloudinary pe upload nhi kiye h)
    //this will give us the path which multer has uploaded

    // req.files contains the uploaded files from the client
    // ?. is optional chaining. it checks if files exists before trying to access .avatar
    // avatar[0] gets first file from the avatar field
    // .path safely access the .path property of the avatar file
    // .path holds the local file system path where the uploaded file is stored
    // multer is middleware so file already got saved and we are holding the path of the file
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    //check for avatar
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    //STEP5
    //aage ka code nhi jaana jb tk ye upload nhi ho jaata
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // STEP6(user is talking to db) these all will be saved in db
    // create is a method of mongodb
    // save only urls of images on db
    // User.create({...}) creates a new user document in your MongoDB database.

// It also returns the full user document (the same type of object you'd get with .find()). 
// it returns objects id also
    const user = await User.create({
        fullName,
        //avatar toh check ho gya h ki ye h ya nhi h
        avatar: avatar.url,
        // coverimage ko check kro phle agr h toh usse url nikal lo nhi toh empty
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // STEP8(passowrd and refreshToken wont be selected) by default all fields are selected
    //user._id is given to all users so we will find that user id if present then we will select
    //  certain fields from it
    // this is a mongodb query means findthe user by id which was previously create in the 
    // step above and just remove the password and refresh token fields from it and this
    // is held by created user to be saved in db
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // STEP9
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering a user")
    }

    // STEP 10(apiresponse.js me yhi sb jaa rha h data jo created user me stored h)
    // response returned to the frontend
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler( async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }
    //phla entry db me mil jayega findOne usko wapas kr dega
    // agr db me ya phir username ya email mil jayega koi v ek toh return kr degi
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }
    console.log("Generating tokens for userId:", user._id)

    const {accessToken, refreshToken} = await
    generateAccessAndRefreshTokens(user._id)
    
    //user ko kya kya information bhejni h
    // select means kya kya field nhi bhejni h
    // exclude the password and refreshToken fields from the returned object.
    // so that frontend does not get sensitive information
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    //sending cookies
    //ye cookies sirf server se modifiable hoti h 
    // frontend se nhi modify ho payega
    // this ensures tokens are stored safely in browser
    // Only your server (backend) can read the cookie.
// Frontend JavaScript CANNOT access it.(document.cookie is not accessible)
// The cookie is automatically sent by the browser (but only if it's secure + httpOnly).


    const options = {
        httpOnly: true,// frontend js cannot access these cookies
        secure: true // cookies are sent over https connection so are secure
    }

    return res
    .status(200)
    // This cookie will be saved in the browser(with name "accessTo..." and the value 
    // generated by accesToken along with options(http and secure)) and automatically 
    // sent with every future request.
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )
})

// we run verifyJWT before the logout as logout is a protected action, the server must know who is making the
//logout action
const logoutUser = asyncHandler(async(req, res) => {
    //Before executing this already verifyJwt will run as it is a middle ware 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 //(remove ths field from the document) removes refresh token from the db
            }
        },
        {   // return me undefined refresh token return hoga
            // nhi toh old wala refresh token return ho jayega
            new: true
        },
    )
    // HTTP = HyperText Transfer Protocol 
    // HTTPS = HyperText Transfer Protocol Secure
    const options = {
        httpOnly: true, // Ensures the cookies can't be accessed by JavaScript on the client side
        secure: true //Ensures cookies are only sent over HTTPS (securing data transfer).
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    //db se v hta liye h 
    .clearCookie("refreshToken", options)
    // response sent to the frontend
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// When the access token expires, instead of asking the user to log in again, we use a refresh token
//  to generate a new access token and refresh token.
const refreshAccessToken = asyncHandler(async (req, res) => {
    // req.body -> incase u sent it manually through frontend
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    // the token contains the user id,(fields with the generaterefreshtoken was id, and with access token 
    // was id, email, username ) so we look up for the user by the id 
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
        //extra layer of protection we check if the refresh token matches with the one in the db
        // now user is holding th id and rest info (look above)
        if(incomingRefreshToken != user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        // access token will be generated and also a new refresh token and the old refresh token is invalidated
        // If someone steals the old refresh token, it won’t work anymore once the new one is issued.
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        // frontend gets new accessToken
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

//will make the user change the current password
// whenever we do anything user specific first we must verify who the user
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // old password was right now we need to set the new password
    user.password = newPassword
    user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
    //we can access req.user bcz at this point already on req middleware has already run
    // and user has already been injected on the object 
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if(!(fullName || email )) {
        throw new ApiError(400, "All fields are required")
    }

    // whenever talking to db we need to put awai
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true} // this means the updated info will also be returned back
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    // Cloudinary sends back an object  like file url , public id and many more so we access
    // using avatar.url
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        // as verifyJWT has also run
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    // this coverImage matching with models name of coverImage
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    // we are sending response so in const user
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if(!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }
    // here user is the channel
    const channel = await User.aggregate([
        {
            // match is simila to where clause in sql
            $match: {
                //if username exists then to lowercase
                username: username?.toLowerCase()
            }
        },
        {
            //user ke andr h now i want to find how many have subscribed to chai aur code
            // user aur subscription -> left join perform krna h (user left me h )
            // joining users with subscriptions  where users._id == subscriptions.channel
            // this finds one channel has how many subscribers(user here is the channel)
            // it collects all subscriptions whers this user is the channel
            // This finds all subscriptions where the user is a channel (like "chai aur code") and gets a
            //  list of people who subscribed to this channel.
            // Find all users who subscribed to THIS user (the channel).
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            // lookup used for joining, lookup returns data in array
            //users._id == subscriptions.subscriber
            // This finds which channels the user has subscribed to.
            // Find all channels that THIS user has subscribed to.
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            //original user object ke andr fields add kiye h
            $addFields: {
                subscribersCount: {
                    // we use $subscribers as subscribers has now become a field
                    // subscriber is the array of documents that came from lookup and subscriber is a field in 
                    // the document because after performing join the document will contain everything like user and ll
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        // if userid found in array of subscriber values then that channel is subscirbed
                        // by the user
                        if: {$in: [req.user?. _id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            // saari chizen ko nhi dunga project hone only selected chizon ko
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])



    //because it comes in form of array
    if (!channel?.length) {
        throw new ApiError(404, "Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            // match is equivalent to where clause
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


// const registerUser = asyncHandler( async (req, res) => {
//     res.status(200).json({
//         message: "ok"
//     })
// })


export {
    registerUser,
     loginUser,
      logoutUser,
       refreshAccessToken,
        changeCurrentPassword, 
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
    }