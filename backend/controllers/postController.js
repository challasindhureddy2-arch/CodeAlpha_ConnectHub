
const db = require("../config/db");

// CREATE POST
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Post content is required"
            });
        }

        const [result] = await db.execute(
            "INSERT INTO posts (user_id, content) VALUES (?, ?)",
            [req.user.id, content.trim()]
        );

        res.status(201).json({
            message: "Post created successfully",
            postId: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to create post"
        });
    }
};

// GET ALL POSTS
exports.getAllPosts = async (req, res) => {
    try {
        const [posts] = await db.execute(`
            SELECT
                posts.id,
                posts.user_id,
                posts.content,
                posts.created_at,
                users.name
            FROM posts
            JOIN users ON posts.user_id = users.id
            ORDER BY posts.created_at DESC
        `);

        res.json(posts);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to fetch posts"
        });
    }
};

// DELETE OWN POST
exports.deletePost = async (req, res) => {
    try {
        const [result] = await db.execute(
            "DELETE FROM posts WHERE id = ? AND user_id = ?",
            [req.params.id, req.user.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Post not found or you cannot delete this post"
            });
        }

        res.json({
            message: "Post deleted successfully"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Failed to delete post"
        });
    }
};
