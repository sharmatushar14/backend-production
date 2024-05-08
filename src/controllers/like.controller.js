import mongoose, {isValidObjectId} from "mongoose";
import { Like } from "../models/like.model";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Playlist } from "../models/playlist.model";

const toggleVideoLike =  asyncHandler(async(req, res)=>{
    const {videoId} =  req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(403, "Not Valid Video Id")
    }

    //If the video is already liked
    const existingLike = await Like.findOne({video: videoId, likedBy: req.user._id})
    if(existingLike){
        await Like.deleteOne({video: videoId, likedBy: req.user._id})
        //await Like.deleteOne({_id: existingLike._id})---> Optimized Way
        return res.status(200)
        .json(new ApiResponse(200, null, "Liked Removed Successfully"))
    }else {
        const videoLiked = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        return res.status(200)
        .json(new ApiResponse(200, videoLiked, "Like Added Successfully"))
    }
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(403, "Invalid Comment ID")
    }

    const existingCommentLike = await Like.findOne({comment: commentId, likedBy: req.user._id})
    if(existingCommentLike){
        await Like.deleteOne({_id: existingCommentLike._id})
        return res.status(200)
        .json(new ApiResponse(200, null, "Liked from comment removed successfully"))
    } else {
        const commentLiked = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        return res.status(200)
        .json(new ApiResponse(200, commentLiked, "Comment Liked Successfully"))
    }
})

const toogleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(404, "Invalid tweetId provided: Provide a valid tweet id")
    }

    const existingTweetLike = await Like.findOne({tweet: tweetId, likedBy: req.user._id})
    if(existingTweetLike){
        await Playlist.deleteOne({_id: existingTweetLike._id})
        return res.status(200)
        .json(new ApiResponse(200, null, "Liked from tweet removed successfully"))
    }else{
        const tweetLiked = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id           
        })
        return res.status(200)
        .json(new ApiResponse(200, tweetLiked, "Tweet Liked Successfully"))
    }
})

const getLikedVidoes = asyncHandler(async(req,res)=>{
    //Get all the liked videos
    const likedVideos = await Like.find({video: {$ne: null}, likedBy: req.user._id})
    //Find documents where the "video" field is not empty & liked by a particular user
    if(!likedVideos || likedVideos.length===0){
        throw new ApiError(404, "No liked videos found")
    }

    return res.status(200)
    .json(new ApiResponse(200, likedVideos, "Liked Videos Fetched Successfully!"))
})

//ToDo: getLikedComments, getLikedTweets

export {
    toggleCommentLike,
    toggleVideoLike,
    toogleTweetLike,
    getLikedVidoes
}


//Notes:
// In the provided code, Like.find() is a method call made on the Mongoose model Like. 
// Here's what it does:

// Like.find(): This Mongoose method is used to find documents in the Like 
// collection that match the specified criteria. When called without any
// arguments, it returns all documents in the collection.

// After executing Like.find(), the returned value will be an array containing 
// all the liked video documents found in the Like collection. This array
// will be assigned to the videos variable in the code, 
// which can then be processed further or sent back as a response to the client