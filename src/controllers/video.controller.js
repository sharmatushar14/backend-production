import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.models.js";
import mongoose from "mongoose";

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
        }
      ]



})

const publishVideo =  asyncHandler(async(req, res)=>{
    const {title, description} = req.body
    if(!title && !description){
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
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, 'Video not found')
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

    const videoDelete =  await Video.findByIdAndDelete(videoId)
    //Returns the deleted document
    return res.status(200)
    .json( new ApiResponse(200, videoDeleted, "Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async(req,re)=>{
    const {videoId} =  req.params
})


export {
    publishVideo,
    getAllVideos,
    getVideosById,
    deleteVideo,
    togglePublishStatus,
    updateVideoDetails
}