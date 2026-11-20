const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    likePost,
    unlikePost,
    getLikes
} = require("../controllers/likeController");

router.post("/:postId", verifyToken, likePost);
router.delete("/:postId", verifyToken, unlikePost);
router.get("/:postId", getLikes);

module.exports = router;