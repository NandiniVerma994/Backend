import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

//this method will register user
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
    const {fullName, email, username, password} = req.body;
    console.log("Email:", email);

    //STEP2
    //even after trimming its empty then throw error
    if (
        [fullName, email, username, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    //STEP3
    const existedUser = User.findOne({
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
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

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
    const user = await User.create({
        fullName,
        //avatar toh check ho gya h ki ye h ya nhi h
        avatar: avatar.url,
        // coverimage ko check kro phle agr h toh usse url nikal lo nhi toh empty
        coverImage: coverImage?.url || "",
        eamil,
        password,
        username: username.toLowerCase()
    })

    // STEP8(passowrd and refreshToken wont be selected) by default all fields are selected
    //user._id is given to all users so we will find that user id if present then we will select certain fields from it
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

export {registerUser}