const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
} = require("../controllers/followController");

router.post("/:userId", verifyToken, followUser);
router.delete("/:userId", verifyToken, unfollowUser);

router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

module.exports = router;