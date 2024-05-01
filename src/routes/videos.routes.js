import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { publishVideo } from "../controllers/video.controller.js";
const router = Router();
router.use(verifyJWT);
//Apply verifyJWT middleware to all routes in the file

router.route("/video").post(
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        }, 
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]), publishVideo
)

router.route("/:videoId").get(getVideoById).delete(deleteVideo).patch(upload.single('thumbnail'), updateVideoDetails)

router.route('/toggle/publish/:videoId').patch(togglePublishStatus)


export default router