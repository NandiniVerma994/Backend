import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema( {
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true//so that it comes in database searching
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercae: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        //type string because we will be storing the url
        type: String, //cloudinary url
        required: true,
    },
    email: {
        type: String,
    },
    //stores array of videos watched references from videos
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }  
}, {timestamps: true})

//befor saving the data we just want to encrypt the password so we use preHook
//encryption takes time so async
//without if everytime it will change(encrypt) the password like when we change our profile pic and try to save then before that it wil do
//we dont want this so we do it such that if we try to modify the password/ whenever we will do anything on password then only this should execute
userSchema.pre("save", async function (next) {
    //is password is not modified then just move to next else first encrypt the password
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    //compares if the password sent by the user and the encrypted one is correct or not then only allow for login
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            //this.username if coming from database
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            //this.username if coming from database
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)