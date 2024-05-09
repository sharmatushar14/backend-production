import mongoose from "mongoose";
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
 
const getChannelStats = asyncHandler(async(req,res)=>{
    //Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelStats = [];
    if(req.user){
        //No of Subscribers
        const subscription = await Subscription.find({channel: req.user._id}) //array
        if(!subscription || subscription.length()===0){
            throw new ApiError(404, "Subscribers Not Found")
        } 
        const subscribers =  subscription.map(mpp => mpp.subscriber) //extracting IDs of subscribers using map
        const numOfSubscribers  = subscribers.length
        channelStats.push(numOfSubscribers);

        //No of Videos
        const videos = await Video.find({owner: req.user._id, isPublished: true})
        //Will return an array
        let numOfVideos = 0;
        if(!videos || videos.length===0){
            channelStats.push(0);
        } else {
            numOfVideos  = videos.length
            channelStats.push(numOfVideos)
        }
        //Total number of views
        let totalViews = 0;
        const views1 = videos.map(mpp => totalViews + mpp.views)
        channelStats.push(totalViews)

        //Total Number of Likes
        let videoLikes = 0;
        //For each video, we will do find() function, which will return an array showing that the current video is liked by how many users
        //in the Like Model. We will iterate over each video one by one and then do the grand total
        for( const video of videos){
            const likes = await Like.find({video: video._id}) //Array with all documents with this video _id
            videoLikes += likes.length
        }
        channelStats.push(videoLikes)

        return res.status(200)
        .json(new ApiResponse(200, `Number of Subscribers: ${channelStats[0]}, Number of Videos: ${channelStats[1]}, Total No of Likes: ${channelStats[2]}, Total No of Likes: ${channelStats[3]}, Channel Stats has been fetched successfully`))
    }
})

const getChannelVideos = asyncHandler(async(req,res)=>{
    //Get all the videos uploaded by the channel
    //Getting the user Id from the auth middleware
    const channelVideos = await Video.find({owner: req.user._id})
    if(!channelVideos || channelVideos.length===0){
        throw new ApiError(404, "No videos uploaded by the user")
    }
    return res.status(200)
    .json(new ApiResponse(200, channelVideos, "Channel Videos fetched Successfully!"))
})

export {
    getChannelStats,
    getChannelVideos
}