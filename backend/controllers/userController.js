
const db = require("../config/db");

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, name, email, bio, profile_image, created_at
             FROM users`
        );

        res.json(users);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a user profile
const getUserProfile = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT id, name, email, bio, profile_image, created_at
             FROM users WHERE id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json(users[0]);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update only the logged-in user's profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, bio } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                message: "Name cannot be empty"
            });
        }

        const [result] = await db.query(
            "UPDATE users SET name = ?, bio = ? WHERE id = ?",
            [name.trim(), bio || "", userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile updated successfully"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserProfile,
    updateProfile
};