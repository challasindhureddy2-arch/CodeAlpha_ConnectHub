
const db = require("../config/db");

// Like a post
const likePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;

        const [existingLike] = await db.query(
            "SELECT * FROM likes WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (existingLike.length > 0) {
            return res.status(400).json({
                message: "You already liked this post"
            });
        }

        await db.query(
            "INSERT INTO likes (post_id, user_id) VALUES (?, ?)",
            [postId, userId]
        );

        res.status(201).json({
            message: "Post liked successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unlike a post
const unlikePost = async (req, res) => {
    try {
        const postId = req.params.postId;
        const userId = req.user.id;

        const [result] = await db.query(
            "DELETE FROM likes WHERE post_id = ? AND user_id = ?",
            [postId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Like not found"
            });
        }

        res.json({
            message: "Post unliked successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get likes and total like count
const getLikes = async (req, res) => {
    try {
        const [likes] = await db.query(
            `SELECT likes.user_id, users.name
             FROM likes
             JOIN users ON likes.user_id = users.id
             WHERE likes.post_id = ?`,
            [req.params.postId]
        );

        res.json({
            totalLikes: likes.length,
            likes
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    likePost,
    unlikePost,
    getLikes
};
