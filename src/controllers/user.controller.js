import { asyncHandler } from "../utils/asyncHandler.js"; //Just made a higher order function as wrapper which accepts a function
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

//Get user details from frontend
//Validation: not empty
//Check if user already exists: username, email
//Check for images, check for avatar
//Create User object- create entry in db
//Remove password and refresh token field from response
//Check for user creation
//return res
const registerUser = asyncHandler( async(req, res)=>{
    const {fullName, email, username, password} = req.body
    console.log('email', email); //Getting data from the frontend

    if(
        [fullName, email, username, password].some((field)=>{
            return field?.trim() === "" //Will return boolean value
            //It says if any one of them is empty, make us of ApiError utility we made
        })
    ){
        throw new ApiError(400, 'All fields are required')
    }

    //User already exists
    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, 'User with email or username already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0].path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, 'Avatar file is required')
    }

    //Create the user object in the database
    const user =  await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //Remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //Wierd syntax but it is what it is
    )

    if(!createdUser){
        throw new ApiError(500, 'Something Went wrong while registering the user')
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User Registered Successfully')
    )
})

export {registerUser}

