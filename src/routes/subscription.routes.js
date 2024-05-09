import { Router } from "express";
import { 
    createChannel,
    getSubscribedChannels,
    toggleSubscription,
    getUserChannelSubscribers
 } from "../controllers/subscription.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();
router.use(verifyJWT);

router.route("/user/:user_Id").post(createChannel)
router.route("/channel/:channelId").get(getUserChannelSubscribers)
router.route("/toggle/c/:channelId").post(toggleSubscription)
router.route("/s/:subsciberId").get(getSubscribedChannels)

export default router
