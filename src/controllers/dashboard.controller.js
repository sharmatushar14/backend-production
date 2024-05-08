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
        
    }

})

const getChannelVideos = asyncHandler(async(req,res)=>{
    //Get all the videos uploaded by the channel
})

export {
    getChannelStats,
    getChannelVideos
}