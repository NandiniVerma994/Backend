import { Router } from "express";
import { logoutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"

const router = Router() 

// we can see if anyone is requesting on register route then registerUser method is executed
// before execution of register method we define a middlelayer(jaane se phle mujhse milke jaana)
// we are sending image to be handled by multer
router.route("/register").post(
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

router.route("/logout").post(verifyJWT, logoutUser)


// router.route("/register").post(registerUser)

export default router