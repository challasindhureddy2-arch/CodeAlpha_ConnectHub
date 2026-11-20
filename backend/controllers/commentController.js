const db = require("../config/db");

const addComment = async (req, res) => {
    try {
        const { comment_text } = req.body;
        const { postId } = req.params;
        const userId = req.user.id;

        if (!comment_text) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        const [result] = await db.query(
            "INSERT INTO comments (post_id, user_id, comment_text) VALUES (?, ?, ?)",
            [postId, userId, comment_text]
        );

        res.status(201).json({
            message: "Comment added successfully",
            commentId: result.insertId
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getComments = async (req, res) => {
    try {
        const [comments] = await db.query(
            `SELECT comments.*, users.name
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.post_id = ?
             ORDER BY comments.created_at ASC`,
            [req.params.postId]
        );

        res.json(comments);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addComment, getComments };