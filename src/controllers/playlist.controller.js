import mongoose, {isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model";
import { User } from "../models/user.models";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";

const createPlaylist =  asyncHandler(async(req, res)=>{
    const {name, description} = req.body
    if(!(name || description)){
        throw new ApiError(404, "Provide both name & description")
    }

    const playlistExists = await Playlist.findOne({
        $or: [{name}, {description}]
    })
    if(playlistExists){
        throw new ApiError(402, "The playlist with following details already exists")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id,
        videos: [] //In starting empty
    })

    return res.status(200)
    .json(new ApiResponse(200, playlist, "Playlist Created Successfully"))
})

const getUserPlaylists  = asyncHandler(async(req, res)=>{
    //Get User Playlists
    const {userId} = req.params;
    if(!isValidObjectId(userId)){
        throw new ApiError(404, "Valid User ID not found")
    }

    const userPlaylist = await Playlist.findOne({owner: userId})
    if(!userPlaylist || userPlaylist.length===0){
        throw new ApiError(404, `Playlist does not exist with ${userId}`)
    }
    return res.status(200)
    .json(new ApiResponse(200, userPlaylist, "Playlist retrieved successfully"))
})

const getPlaylistById = asyncHandler(async(req, res)=>{
    const {playlistID} = req.params
    if(!isValidObjectId(playlistID)){
        throw new ApiError(401, "Not Valid PlaylistID")
    }

    const playlist = await Playlist.findById(playlistID)
    if(!playlist){
        throw new ApiError(404, "PlayList not found")
    }

    return res.status(200)
    .json(new ApiResponse(200, playlist, "Playlist by ID is fetched successfully!"))
})

const addVideoToPlaylist = asyncHandler(async(req, res)=>{
    const {playlistId, videoId} =  req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(403, "Playlist Id or Video Id not valid")
    }

    const playlist = await Playlist.findById(playlistId);
    if(!playlist){
        throw new ApiError(404, "Playlist not found")
    }
    //Check if the video already exists in the playlist's video array
    if(playlist.videos.includes(videoId)){
        // Video already exists in the playlist, send success response with the playlist
        return res.status(200).json(new ApiResponse(200, playlist, "Video Already exists in the playlist"))
    }

    //Add the video to the playlist's videos array
    const videoAddedPlaylist = await Playlist.findByIdAndUpdate(playlistId, 
        {
            $push: {
                videos: videoId
            }
        }, //Using $push to add videoId to the videos array
        {
            new: true,
            validateBeforeSae: false
        }
    )

    if(!videoAddedPlaylist || videoAddedPlaylist.length===0){
        throw new ApiError(404, "No videos to add in playlist")
    }

    return res.status(200)
    .json(new ApiResponse(200, videoAddedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res)=>{
    const {playlistId, videoId} = req.params
    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(403, "Invalid Video or Playlist Id")
    }
    const playlistWOVideo = await Playlist.findOne({_id: playlistId, videos: videoId})
    if(!playlistWOVideo){
        throw new ApiError(401, "Video does not exist in playlist or playlist was not created")
    }

    //Remove video from the playlist
    const indexOfVideoToBeRemoved = playlistWOVideo.videos.indexOf(videoId);
    //The indexOf() function is a built-in method Javascript method used to find the index of the first occurrence of a specified value within the array
    if(indexOfVideoToBeRemoved > -1){
        playlistWOVideo.videos.splice(indexOfVideoToBeRemoved,1);
    } 

    //Save the modified playlist 
    await playlistWOVideo.save();

    return res
    .status(200)
    .json(new ApiResponse(200, playlistWOVideo, "Video is removed from playlist"))
})

const deletePlaylist = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(403, "Invalid playlistId to delete playlist")
    }
    const playlistToDelete = await Playlist.findByIdAndDelete(playlistId);
    if(!playlistToDelete){
        throw new ApiError(405, "Playlist is deleted already")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deletePlaylist, "Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params
    const {playlistName, description} = req.body
    if(!isValidObjectId(playlistId)){
        throw new ApiError(404, "Invalid playlistId: Please provide a valid playlistId")
    }
    if(!playlistName || !description){
        throw new ApiError()
    }

    const alreadyPlaylist =  await Playlist.findOne({name: playlistName})
    if(alreadyPlaylist){
        throw new ApiError(400, "Playlist with this name already exists, in short no new update")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: playlistName,
                description:description
            }
        },
        {
            //These are called as options
            new: true,
            validateBeforeSae: false
        }
    )

    if (!updatedPlaylist) {
        throw new ApiError(404, "Could not find Playlist to update")
    }

    return res.status(200)
    .json(new ApiResponse(200, updatePlaylist, "Playlist Updated"))
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist    
}

// mongoose.isValidObjectId(new mongoose.Types.ObjectId()); // true
// mongoose.isValidObjectId('0123456789ab'); // true
// mongoose.isValidObjectId(6); // true
// mongoose.isValidObjectId(new User({ name: 'test' })); // true

// mongoose.isValidObjectId({ test: 42 }); // false