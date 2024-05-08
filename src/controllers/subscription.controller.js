import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleSubscription = asyncHandler(async(req, res)=>{
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Invalid Channel Id")
    }
    const alreadySubscribed = await Subscription.findById(channelId)
    if(alreadySubscribed){
        await Subscription.deleteOne({_id: channelId})
        return res.status(200)
        .json(new ApiResponse(200, null, "Unsubscribed Successfully"))
    } else {
        const newSubscriber = await Subscription.create({
            channel: channelId,
            subsciber: req.user._id
        })
    }
})

const getUserChannelSubscribers = asyncHandler(async(req, res)=>{
    //Controller to return subscribers list of channel 
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Invalid Channel Id")
    }
    const channelS = await Subscription.findById(channelId)
    if(!channelS){
        throw new ApiError(404, "No channel exists with the following Id")
    }
    if(channelS.channel.toString()!==req.user._id){
        throw new ApiError(403, "You are not authorized to see the subscribers of others channel")
    }

    return res.status(200)
    .json(new ApiResponse(200, channelS, "Subscribers Fetched Successfully"))

})

const getSubscribedChannels =  asyncHandler(async(req, res)=>{
    //Controller to return channel list to which the user has subscribed
    s
})

export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}