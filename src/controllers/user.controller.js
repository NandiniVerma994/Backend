import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

// generating tokens only if users exist
const generateAccessAndRefreshTokens = async(userId) => {
    try {
        //checking if the user exists
        const user = await User.findById(userId)
        const accessToken = user.generateAccessTokens()
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

    if (!username || !email) {
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

    const {accessToken, refreshToken} = await
    generateAccessAndRefreshTokens(user._id)
    
    //user ko kya kya information bhejni h
    // select means kya kya field nhi bhejni h
    // exclude the password and refreshToken fields from the returned object.
    // so that frontend does not get sensitive information
    const loggedInUser = User.findById(user._id).select("-password -refreshToken")

    //sending cookies
    //ye cookies sirf server se modifiable hoti h 
    // frontend se nhi modify ho payega
    // this ensures tokens are stored safely in browser
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

const logoutUser = asyncHandler(async(req, res) => {
    //Before executing this already verifyJwt will run
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {   // return me undefined refresh token return hoga
            // nhi toh old wala refresh token return ho jayega
            new: true
        },
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    //db se v hta liye h 
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

// const registerUser = asyncHandler( async (req, res) => {
//     res.status(200).json({
//         message: "ok"
//     })
// })


export {registerUser, loginUser, logoutUser}