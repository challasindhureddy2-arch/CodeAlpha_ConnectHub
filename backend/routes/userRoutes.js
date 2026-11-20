
const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
    getAllUsers,
    getUserProfile,
    updateProfile
} = require("../controllers/userController");

router.get("/", getAllUsers);

router.get("/:id", getUserProfile);

router.put("/me", verifyToken, updateProfile);

module.exports = router;