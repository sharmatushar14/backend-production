import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";
import { User } from "../models/user.models.js";
import {Comment} from "../models/comment.model.js"
import {Like} from "../models/like.model.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const {page=1, limit=10, query, sortBy, sortType, userId}= req.query
      //TODO: get all videos based on query, sort, pagination
      const user_Id = req.user._id;
      const pageNumber = parseInt(page)
      const pageLimit = parseInt(limit)
      //Skip value for pagination
      const skip = (pageNumber-1) * pageLimit;
      //Piplines
      let pipeline = [
        {
            $match: {
                $or: [
                    {title: { $regex: query, $options:"i"}},
                    {description: { $regex: query, $options: "i"}},
                    {owner: new mongoose.Types.ObjectId(user_Id)}
                ]
            }
        }, 
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerdetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            coverImage: 1,
                            email: 1
                        }
                    }, 
                    {
                        $addFields: {
                            $ownerDetails: {
                                $first: "$ownerdetails"
                            }
                        }
                    }
                ]
            }
        }, 
        {
          $lookup: {
            from: 'comments',
            localField: "_id",
            foreignField: "video",
            as: 'commentsOnVideo',
            pipeline: [
                {
                    $project: {
                        content: 1,
                    }
                },
                {
                    $addFields: {
                        commentsOnVideo: "$commentsOnVideo"
                    }
                }
            ]
          }  
        },
        {
            $lookup: {
                from: 'likes',
                localField: "_id",
                foreignField: "video",
                as: 'likesOnVideo',
                pipeline: [
                    {
                        $project: {
                            content: 1
                        }
                    },
                    {
                        $addFields: {
                            commentOnVideo: "$likesOnVideo"
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: 'playlist',
                localField: "_id",
                foreignField: "video",
                as: 'playlistsOnVideo',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            owner: 1
                        }
                    }, 
                    {
                        $addFields: {
                            PlaylistsOnVideo: "$PlaylistsOnVideo" //All playlists for the particular video 
                        }
                    }
                ]
            }
        }, 
        {
            $sort: {
                [sortBy]: sortType === "desc" ? -1 : 1,
                createdAt: -1
                //Sort by createdAt in descending order as an option newest first
            } //Sort by ascending order (1) or descending order (-1)
        }, 
        {
            $skip: skip
            //Skip documents for pagination
        },
        {
            $limit: pageLimit
        }
      ]

      console.log(pipeline, 'Pipeline of videos');
      if(!pipeline || pipeline.length === null){
        throw new ApiError(500, "Loading Failed, Please try again later")    
      }

      const video = await Video.aggregate(pipeline)
      const videoPaginate = await Video.aggregatePaginate(pipeline)

      if(!video || video.length==(0 || null)){
        throw new ApiError(500, "Failed to get all videos, please try again later")
      }

      return res
      .status(200)
      .json( new ApiResponse(200, {video, videoPaginate}, "Video Pagination and Aggregation Retrived Successfully"))
})

const publishVideo =  asyncHandler(async(req, res)=>{
    const {title, description} = req.body
    if(!title || !description){
        //If any one of them is absent, throw the error
        throw new ApiError(404, "Title and description is required")
    }
    let videoUploadLocal = req.files?.videoUpload?.[0]?.path
    let thumbnailUploadLocal =  req.files?.thumbnail?.[0]?.path

    if(!videoUploadLocal){
        throw new ApiError(404, "Video File Not Found")
    }
    if(!thumbnailUploadLocal){
        throw new ApiError(403, 'Thumbnail Not Found')
    }
    
    const {url: videoCloudinaryURL, duration} = await uploadOnCloudinary(videoUploadLocal);
    const thumbnailUploadURL = await uploadOnCloudinary(thumbnailUploadLocal);
    const video = Video.create({
        title: title,
        description,
        videoFile: videoCloudinaryURL,
        thumbnail: thumbnailUploadURL,
        duration: duration
    })

    return res.status(200)
    .json(
        new ApiResponse(200, video, "Video Details Fetched Successfully")
    )

})

const updateVideoDetails =  asyncHandler(async(req, res)=>{
    const {videoId} = req.params 
    //Destructuring should be same as in defined route name
    const {title, description} =  req.body
    const existedTitle= await Video.findOne(
        {title: title}
    )
    if(existedTitle){
        throw new ApiError(400, "Do not use existing title")
    }
    const existedDesc= await Video.findOne(
        {description: description}
    )
    if(existedDesc){
        throw new ApiError(400, "Do not use existing desc")
    }
    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description
            },
        },
    {
        new: true
    })

    return res.status(200)
    .json(new ApiResponse(200, video, "Video Details Updated Successfully"))

})

const getVideosById = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(500, 'Id not found')
    }

    const user = await User.findById(req.user._id)
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, 'Video not found')
    }

    if(!video.isPublished){
        throw new ApiError(403, "Video is not published yet")
    }

    const updateVideoInfo = await Video.updateOne(
        {_id: videoId},
        {
            $inc: {
                views: 1
            }
        },
        { new: true, validateBeforeSave: false}      
    )
    if(updateVideoInfo.nModified===0){
        throw new ApiError(404, "Video not Found, no updates happened")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, video, 'Video and its details found successfully')
    )
})

const deleteVideo = asyncHandler(async(req, res)=>{
    const {videoId} =  req.params
    if(!videoId){
        throw new ApiError(500, 'Id not found')
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, 'Video not found')
    }

    const thumbnailURL = video.thumbnail
    //Extract video URL from video document
    const urlArrayofThumbnail = thumbnailURL.split("/")
    const thumbnailfromURL = urlArrayofThumbnail[urlArrayofThumbnail.length-1]
    const thumbnailName = thumbnailfromURL.split(".")[0]

    //Deleting video from database, then from cloudinary
    if(video.owner.toString()=== req.user._id.toString){
        const videoDeleteFromDatabase =  await Video.findByIdAndDelete(videoId)
        if(!videoDeleteFromDatabase){
            throw new ApiError(404, "Video Not Found, might be already deleted")
        }

        //Delete Video File from Cloudinary
        await deleteOnCloudinaryVideo(video.videoFile)

        //Deleting thumbnail from Cloudinary
        await cloudinary.uploader.destroy(thumbnailName,
            {
                invalidate: true
            },
            
                (error, result)=>{
                    console.log("Result:", result, "Error:", error, "Result or Error after deleting thumbnail from cloudinary");
                }
            )
        const comments = await Comment.find({video: videoDeleteFromDatabase._id})
        //Taking out the comment IDs
        const commentIDs = comments.map((comment)=>{comment._id})
        //deleteMany()-->Removes all the documents that match the filter from a collection
        await Like.deleteMany({video: videoDeleteFromDatabase._id})
        await Like.deleteMany({comment: { $in: commentIDs}})
        await Comment.deleteMany({video: videoDeleteFromDatabase._id})
    } else {
        throw new ApiError(403, "You are not authorized to delete this video")
    }

    
    //Return the deleted document
    return res.status(200)
    .json( new ApiResponse(200, videoDeleted, "Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async(req,res)=>{
    //To toggle between published status==> On or Off
    const {videoId} =  req.params
    if(!videoId){
        throw new ApiError(404, "Invalid Video ID to know publish status")
    }
    const video =  await Video.findById(videoId)
    if(!video){
        throw new ApiError(400, "Cannot toggle publish status, either video does not exist or deleted")
    }

    video.isPublished = !video.isPublished
    await video.save({validateBeforeSave: false})

    return res.status(200)
    .json(new ApiResponse(200, videoId, "Video Status is toggled successfully"))
})
//If isPublished is true video will be shown, otherwise not


export {
    publishVideo,
    getAllVideos,
    getVideosById,
    deleteVideo,
    togglePublishStatus,
    updateVideoDetails
}