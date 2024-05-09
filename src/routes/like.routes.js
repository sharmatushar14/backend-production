import { Router } from "express";
import { 
    toggleVideoLike,
    toogleTweetLike,
    getLikedVidoes,
    toggleCommentLike
} from "../controllers/like.controller";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router = Router();

app.use(verifyJWT)

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("toggle/t/:tweetId").post(toogleTweetLike)
router.route("toggle/c/:commentId").post(toggleCommentLike)
router.route("/videos").get(getLikedVidoes)

export default router