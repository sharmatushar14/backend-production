import mongoose, {isValidObjectId} from "mongoose";
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
//Mongoose is the MongoDB library for Javascript

const getVideoComments = asyncHandler(async(req,res)=>{
    //Get all comments for a video
    const {videoId} = req.params
    const {page=1, limit=10} = req.query
    if(!videoId){
        throw new ApiError(404, "Video Id not found to find comments")
    }

    const videoComments = await Comment.find({video: videoId}).skip((page-1)*limit).limit(limit).exec();
    //.exec(): This executes the query. In some MongoDB libraries for JavaScript, such as Mongoose, 
    //the exec() method is used at the end of the query chain to actually perform the database operation.
    if(!videoComments || videoComments.length===0){
        throw new ApiError(404, "Could not find comments for the specified video")
    }

    return res.status(200)
    .json(new ApiResponse(200, videoComments, "Comments for the video fetched successfully!"))
})

const addComment = asyncHandler(async(req,res)=>{
    // Extracting video ID from request parameters
    const {videoId} = req.params;
    // Extracting the content from request body
    const {content} = req.body

    if(!(videoId||content)){
        throw new ApiError(402, "Invalid video_Id or you have not written any comment")
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if(!newComment){
        throw new ApiError(500, "Cannot add the comment, please try again")
    }

    return res.status(200)
    .json(new ApiResponse(200, newComment, "Comment added Successfully"))
})

const updateComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
    const {newComment} = req.body
    if(!(commentId||content)){
        throw new ApiError(403, "Invalid Comment Id or Please provide the content to be updated")
    }

    const commentToUpdate = await Comment.findById(commentId)
    if(!commentToUpdate){
        throw new ApiError(404, "No comment found with this commentID")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            $set: {
                content: newComment
            }
        },
        {
            new: true, validitionBeforeSave: false
        }
    )

    if(!updateComment){
        throw new ApiError(500, "Comment cannot be updated, please try again")
    }

    return res.status(200)
    .json(new ApiResponse(200, updateComment, "Comment Updated Successfully!"))
})

const deleteComment = asyncHandler(async(req,res)=>{
    const {commentID} = req.params
    if(!(commentID || isValidObjectId(commentID))){
        throw new ApiError(402, "Invalid Comment ID")
    }
    const comment = await findById({_id: commentID})
    if(!comment){
        throw new ApiError(404, "Comment not found, see if comment id is correct")
    }
    if(comment.owner._id !== req.user._id){
        throw new ApiError(403, "You are not allowed to delete this comment: Requested Resource Forbidden")
    }
    const deletedComment  = await Comment.findByIdAndDelete(commentID)
    if(!deletedComment){
        throw new ApiError(500, "Comment cannot be deleted, please try again later")
    }
    return res.status(200)
    .json(new ApiResponse(200, deletedComment, "Comment Deleted Successfully"))
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}