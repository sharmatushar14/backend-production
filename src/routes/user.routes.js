import { Router } from "express";
import {refreshAccessToken, registerUser, loginUser, logoutUser, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//Secured Routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route('/updateAccount').post(verifyJWT, updateAccountDetails);
router.route('/updateAvatar').patch(verifyJWT, upload.single("avatar"), updateAvatar)
router.route('/updateCoverImage').patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route('/u/:username').get(verifyJWT, getUserChannelProfile) //As we are extracting username from URL params
router.route('/history').get(verifyJWT, getWatchHistory)

export default router