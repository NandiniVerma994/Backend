import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken,
    changeCurrentPassword, getCurrentUser, updateUserAvatar, updateUserCoverImage, 
    getUserChannelProfile, getWatchHistory
 } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router() 

// we can see if anyone is requesting on register route then registerUser method is executed
// before execution of register method we define a middlelayer(jaane se phle mujhse milke jaana)
// we are sending image to be handled by multer
router.route("/register").post(
    // GET is an HTTP method used to request data from a server without modifying it, 
    // while POST is used to send data to the server to create or update resources, 
    // typically with the data included in the request body.
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
// patch is used when we want to update part of a resource else everthing will get updated
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
// upload.single("avatar") looks for a field named avatar in the form-data, expects only single file coming from 
//the frontend, saves uploaded file into the disk as upload is from multer middleware, adds file info to req.file
// that is path and filename etc , so the controller can acess req.file
// first use middleware verifyJWT because first the user needs to be logged in then only he can send file
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

// router.route("/register").post(registerUser)

export default router