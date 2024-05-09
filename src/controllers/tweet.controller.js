import mongoose, {isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async(req, res)=>{
    const {tweetContent} = req.body
    if(!tweetContent){
        throw new ApiError(402, "Please provide the tweet content")
    }
    const newTweet = await Tweet.create({
        content: tweetContent,
        owner: req.user._id
    })

    if(!newTweet){
        throw new ApiError(500, "Error while creating the Tweet, try again")
    }

    return res.status(200)
    .json(new ApiResponse(200, newTweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async(req,res)=>{
    const {user_Id} = req.params
    if(!isValidObjectId(user_Id)){
        throw new ApiError(404, "Invalid User ID")
    }

    const tweet = await Tweet.find({owner: user_Id})
    if(!tweet || tweet.length===0){
        throw new ApiError(403, "No tweets exists with this userId")
    }

    return res.status(200)
    .json(new ApiResponse(200, tweet, "Tweets Fetched Successfully"))

})

const updateTweet =  asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    const {newContent} = req.body
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid Tweet Id")
    }
    const existingTweet = await Tweet.findOne({_id: tweetId, owner: req.user._id})
    if(!existingTweet){
        throw new ApiError(401, `Tweet does not exist with user ${req.user.username} which you are trying to update`)      
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetID,
        {
            $set: {
                content: newContent,
            }
        },
        {
            new: true, validationBeforeSave: true
        }
    )
    return res.status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated Successfully!"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid tweet id")
    }
    const tweetToDelete = await Tweet.findById(tweetId)
    if(!tweetToDelete){
        throw new ApiError(404, "Requested tweet is already deleted")
    }
    if(tweetToDelete.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }
    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)
    if(!deletedTweet){
        throw new ApiError(500, "Delete Tweet Function Failed")
    }
    return res.status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet Deleted Successfully!"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}