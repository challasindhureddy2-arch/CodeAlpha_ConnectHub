const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const {
    addComment,
    getComments
} = require("../controllers/commentController");

router.post("/:postId", verifyToken, addComment);
router.get("/:postId", getComments);

module.exports = router;