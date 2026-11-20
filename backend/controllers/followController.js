const db = require("../config/db");

const followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);

        if (!Number.isInteger(followingId) || followingId <= 0) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (followerId === followingId) {
            return res.status(400).json({
                message: "You cannot follow yourself"
            });
        }

        const [users] = await db.query(
            "SELECT id FROM users WHERE id = ?",
            [followingId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        await db.query(
            "INSERT INTO followers (follower_id, following_id) VALUES (?, ?)",
            [followerId, followingId]
        );

        res.status(201).json({
            message: "User followed successfully"
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
                message: "You already follow this user"
            });
        }

        res.status(500).json({ message: error.message });
    }
};

const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const followingId = parseInt(req.params.userId);

        const [result] = await db.query(
            "DELETE FROM followers WHERE follower_id = ? AND following_id = ?",
            [followerId, followingId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Follow relationship not found"
            });
        }

        res.json({
            message: "User unfollowed successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFollowers = async (req, res) => {
    try {
        const [followers] = await db.query(
            `SELECT users.id, users.name
             FROM followers
             JOIN users ON followers.follower_id = users.id
             WHERE followers.following_id = ?`,
            [req.params.userId]
        );

        res.json({
            totalFollowers: followers.length,
            followers
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getFollowing = async (req, res) => {
    try {
        const [following] = await db.query(
            `SELECT users.id, users.name
             FROM followers
             JOIN users ON followers.following_id = users.id
             WHERE followers.follower_id = ?`,
            [req.params.userId]
        );

        res.json({
            totalFollowing: following.length,
            following
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing
};