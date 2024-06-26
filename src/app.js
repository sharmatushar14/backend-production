import express from "express"
import cookieParser from "cookie-parser"
import cors from 'cors'

const app =  express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static('public'))
app.use(cookieParser())

//Routes Import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/videos.routes.js" 
import playlistRouter from "./routes/playlist.routes.js"
import commentRouter from "./routes/comment.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import likeRouter from "./routes/like.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js";
import healthRouter from "./routes/healthcheck.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//Routes Declaration
app.use("/api/v1/users", userRouter)
//http://localhost:8000/api/v1/users/register
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/subscribers", subscriptionRouter)
app.use("/api/v1/healthStatus", healthRouter)
app.use("/api/v1/dashboard", dashboardRouter)


export default app; //can have only 1 export default
//export default is used for exporting a single value, while export { } is used for exporting multiple values from a module.
