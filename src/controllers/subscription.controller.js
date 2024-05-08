import mongoose, {isValidObjectId} from "mongoose";
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createChannel = asyncHandler(async(req,res)=>{
    const {user_Id} = req.params
    if(!isValidObjectId(user_Id)){
        throw new ApiError(404, "Invalid User ID")
    }

    const createdUserChannel = await Subscription.create({
        channel: user_Id,
        subsciber: null
    })

    if(!createdUserChannel){
        throw new ApiError(500, "Couldn't create channel")
    }

    return res.status(200)
    .json(new ApiResponse(200, createdUserChannel, "Your Videotube channel has been created successfully"))
})

const toggleSubscription = asyncHandler(async(req, res)=>{
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Invalid Channel Id")
    }
    const alreadySubscribed = await Subscription.findById(channelId)
    if(alreadySubscribed.channel.toString()===req.user._id){
        throw new ApiError(403, "You can not toggle subscription of  your own channel")
    }
    if(alreadySubscribed.subsciber){
        alreadySubscribed.subsciber= null;
        await alreadySubscribed.save();
        return res.status(200)
        .json(new ApiResponse(200, alreadySubscribed, "Unsubscribed Successfully"))
    } else {
        alreadySubscribed.subsciber = req.user._id
        await alreadySubscribed.save();
        return res.status(200)
        .json(new ApiResponse(200, alreadySubscribed, "Subscription toggled successfully"))
    }
})

const getUserChannelSubscribers = asyncHandler(async(req, res)=>{
    //Controller to return subscribers list of channel 
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(404, "Invalid Channel Id")
    }
    const channelS = await Subscription.find({channel:channelId})
    // channelS is an array of subscription documents, not a single document.
    // So, we need to iterate over channelUsers to access each subscribers ID.
    if(!channelS || channelS.length===0){
        throw new ApiError(404, "No channel exists with the following Id")
    }
    if(channelS.channel.toString()!==req.user._id){
        throw new ApiError(403, "You are not authorized to see the subscribers of others channel")
    }
    const subsciberIDs = channelS.map(subscription => subscription.subsciber)
    //This will return the array
    //The subscriberIDs array contains the IDs of all subscribers to the specified channel.
    return res.status(200)
    .json(new ApiResponse(200, subsciberIDs, "Channel Subscribers Fetched Successfully"))
})

const getSubscribedChannels =  asyncHandler(async(req, res)=>{
    //Controller to return channel list to which the user has subscribed
    const {subsciberId} = req.params
    if(!isValidObjectId(subsciberId)){
        throw new ApiError(404, "Invalid Subscriber Id")
    }

    const userSubscriptions = await Subscription.find({subsciber: subsciberId})
    if(!userSubscriptions ||  userSubscriptions.length === 0){
        throw new ApiError(404, "You have not subscribed to any channels")
    }

    const channelIDs = userSubscriptions.map(subscription =>  subscription.channel)
    //Will return the array
    return res.status(200)
    .json(new ApiResponse(200, channelIDs, "Subscribed Channels Fetched Successfully"))
})

export {
    createChannel,
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}

/*---------------------IMP DEFINITION--------------*/
/*
//--------------------ROUTE PARAMTERED METHODS--------------------`
Definition: 
Route parameters are part of the URL path and are defined in the route pattern using a colon (:) followed by the parameter name. For example, /users/:userId defines a route parameter named userId.
Usage: 
Route parameters are used to extract dynamic values from the URL path. These values can change with each request, and they are typically used to identify a specific resource or entity.
Access: 
In Express.js, route parameters are accessible via the req.params object. For example, if you define a route parameter :userId, you can access its value using req.params.userId.
Example: 
/users/:userId matches URLs like /users/123, /users/456, where 123 and 456 are values of the userId parameter.

//------------------------QUERY PARAMETERS------------------------
Definition: 
Query parameters are key-value pairs appended to the URL after a question mark (?). Each parameter is separated by an ampersand (&). For example, ?page=1&limit=10 contains two query parameters: page with a value of 1 and limit with a value of 10.
Usage:
 Query parameters are used to provide additional data to a server when making an HTTP request. They are often used for filtering, sorting, or pagination purposes.
Access:
 In Express.js, query parameters are accessible via the req.query object. For example, if a client sends a request with query parameters ?page=1&limit=10, you can access them using req.query.page and req.query.limit.
Example:
 /users?page=1&limit=10 contains query parameters page and limit, which are used to specify the page number and the number of results per page, respectively.


 //--------------------SUMMARY--------------------
 In summary, route parameters are part of the URL path and are used for dynamic values, while query parameters are appended to the URL and are used for additional data in an HTTP request. They serve different purposes and are accessed differently in Express.js.
*/