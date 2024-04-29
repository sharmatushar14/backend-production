import { asyncHandler } from "../utils/asyncHandler.js"; //Just made a higher order function as wrapper which accepts a function
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userID) =>{
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken(); //Short lived--> To validate in starting
        const refreshToken = user.generateRefreshToken(); //Long Lived--> To validate overr subsquent requests by user to validate avoiding repeatable tasks

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something Went Wrong While Generating refresh and access tokens")
    }
}

const registerUser = asyncHandler( async(req, res)=>{
    //Get user details from frontend
    //Validation: not empty
    //Check if user already exists: username, email
    //Check for images, check for avatar
    //Create User object- create entry in db
    //Remove password and refresh token field from response
    //Check for user creation
    //return res
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
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, 'User with email or username already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0].path //Causing undefined when there is no coverImage file
    //Another approach
    //const coverImageLocalPath  = req.files?.coverImage?.[0]?.path
    //if else approach
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

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

const loginUser = asyncHandler(async(req, res)=>{
    //Req body--> data
    //Username or email se validation
    //Find the user
    //Password Check
    //Access and refresh token
    //Send cookie
    const {email, username, password} = req.body

    if(!username && !email){
        //Both of them are absent
        throw new ApiError(400, "username or email is required")
    }
    //if(!(username || email)) which means when !(false ||  false) --> make it true, hence when both of thema are absent

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, 'Invalid user credentials')
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id, 
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options= {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refresToken", options)
    .json(new ApiResponse(200, {}, 'User Logged Out Successfully'))
})

const refreshAccessToken =  asyncHandler(async(req, res)=>{
    //Access Token - Short lived, not stored in db
    //Refresh Token - Long lived, stored in db
    //When access token expires, the frontend sends the refresh token to the backend to validate user (login), once again.
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    //When using phone, the refreshToken comes in body
    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        //Taking out user with the refresh Token saved in the db and using it to make a new access token for the user from the second time
        
        if(!user){
                throw new ApiError(401, "Invalid Refresh Token")
        }

        if(incomingRefreshToken !== user?.refreshToken){
            //Above we got the user from ._id from the database, hence matching this user?.refreshToken from database
            //to the token we just recieved and decoded
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access Token Refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} =  req.body
    //We will be getting this all info from auth middleware, where will be getting the req.user
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Old Password is incorrect")
    }

    user.password =  newPassword
    //Want only this field to be changed and updated, hence using next line
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"))  
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Fetched Successfully"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        //If any one of them is not recieved, then we will throw error
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id, {
            $set: {
                fullName: fullName, //can be written as fullName
                email: email
            }
        },
        {new: true} // return the updated values
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account Details Updated Successfully")
    )
})

const updateAvatar = asyncHandler(async(req, res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar File is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error While Uploading the file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Image Updated Successfully")
    )
})

const updateUserCoverImage =  asyncHandler(async(req, res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover Image File is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error While Uploading the file")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Cover Image Updated Successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res)=>{
    const {username} = req.params
    if(!username){
        throw new ApiError(404, "Username not found")
    }

    //Aggregation Pipelines--> [{}, {}, {}] 3 Pipelines
    //The concept is simple that the output of prev pipeline will be used as input for next pipline
    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        }, 
        {
            $lookup: {
                from: "subscriptions",
                localField: '_id', //As this field is present in User Model and we got 1 document with the desired username as we used the $match operation above
                //to find out that what subs and to whom the current username has done
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: '_id', //As this field is present in User Model and we got 1 document with the desired username as we used the $match operation above
                //to find out that what subs and to whom the current username has done
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    //$size works as count here
                    $size: "$subscribers" // $, coz subscribers is a field now in the document
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        //3 parameters of $cond: {if, then, else}
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
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

    if(!channel?.length){
        throw new ApiError(404, "Channel Does Not Exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User Channel Fetched Successfully!")
    )
})

export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateAvatar,
        updateUserCoverImage,
        getUserChannelProfile
}

