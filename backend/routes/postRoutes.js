
const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    createPost,
    getAllPosts,
    deletePost
} = require("../controllers/postController");

router.get("/", getAllPosts);
router.post("/", verifyToken, createPost);
router.delete("/:id", verifyToken, deletePost);

module.exports = router;
