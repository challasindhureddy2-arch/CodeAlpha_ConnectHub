
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Test database connection
db.getConnection()
    .then(connection => {
        console.log("MySQL Database Connected Successfully!");
        connection.release();
    })
    .catch(error => {
        console.error("Database Connection Failed:", error.message);
    });

// Authentication routes
app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/users", require("./routes/userRoutes"));

app.use("/api/posts", require("./routes/postRoutes"));

app.use("/api/comments", require("./routes/commentRoutes"));

app.use("/api/likes", require("./routes/likeRoutes"));

app.use("/api/follow", require("./routes/followRoutes"));

// Home route
app.get("/", (req, res) => {
    res.send("Welcome to ConnectHub API!");
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`ConnectHub Server running at http://localhost:${PORT}`);
});
