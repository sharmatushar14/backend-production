import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const healthCheck = asyncHandler(async(req,res)=>{
    //Healthcheck response that simply returns the OK status as json with a message
    try {
        //Check Database connectivity
        await mongoose.connection.db.admin().ping();
        //If the ping succeeds, respond with a 200 Status
        return res.status(200)
        .json(new ApiResponse(200, {status: "OK", message: "Service is running operational"}))
    } catch (error) {
        throw new ApiError(500, error, "Database connection failed on healthCheck")
    }
})

export {
    healthCheck
}