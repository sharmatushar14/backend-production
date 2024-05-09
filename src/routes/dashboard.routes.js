import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyJWT)

router.route("/channelStats").get(getChannelStats)
router.route("/channelVideos").get(getChannelVideos)

export default router