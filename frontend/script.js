
const API = "http://localhost:3000/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

// Safely display user-provided text
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// API request helper
async function apiRequest(endpoint, method = "GET", data = null) {
    const headers = {};

    if (data !== null) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API}${endpoint}`, {
        method,
        headers,
        body: data !== null ? JSON.stringify(data) : null
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
    }

    return result;
}

// Display messages
function showMessage(message) {
    alert(message);
}

// Switch between registration and login
function toggleAuth() {
    const registerForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");

    registerForm.hidden = !registerForm.hidden;
    loginForm.hidden = !loginForm.hidden;
}

// Register
async function register() {
    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    if (!name || !email || !password) {
        return showMessage("Please fill all fields");
    }

    try {
        await apiRequest("/auth/register", "POST", {
            name,
            email,
            password
        });

        showMessage("Registration successful! Please login.");
        toggleAuth();

    } catch (error) {
        showMessage(error.message);
    }
}

// Login
async function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
        return showMessage("Please enter email and password");
    }

    try {
        const result = await apiRequest("/auth/login", "POST", {
            email,
            password
        });

        token = result.token;
        currentUser = result.user;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(currentUser));

        updateNavigation();
        showSection("home");

        showMessage("Login successful!");

    } catch (error) {
        showMessage(error.message);
    }
}

// Logout
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    token = null;
    currentUser = null;

    updateNavigation();
    showSection("auth");

    showMessage("Logged out successfully");
}

// Update navigation
function updateNavigation() {
    document.getElementById("logoutBtn").hidden = !token;
}

// Show application sections
function showSection(section) {
    if (!token && section !== "auth") {
        section = "auth";
    }

    document.getElementById("authSection").hidden = section !== "auth";
    document.getElementById("homeSection").hidden = section !== "home";
    document.getElementById("profileSection").hidden = section !== "profile";

    if (section === "home") {
        loadPosts();
        loadUsers();
    }

    if (section === "profile") {
        loadProfile();
    }
}

// Create post
async function createPost() {
    const content = document.getElementById("postContent").value.trim();

    if (!content) {
        return showMessage("Please write something first");
    }

    try {
        await apiRequest("/posts", "POST", { content });

        document.getElementById("postContent").value = "";

        showMessage("Post created successfully!");
        await loadPosts();

    } catch (error) {
        showMessage(error.message);
    }
}

// Load posts with like counts
async function loadPosts() {
    const container = document.getElementById("postsContainer");

    try {
        const posts = await apiRequest("/posts");

        container.innerHTML = "";

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML = "<p>No posts yet. Create the first post!</p>";
            return;
        }

        for (const post of posts) {
            const postId = Number(post.id);
            const likeData = await apiRequest(`/likes/${postId}`);

            const card = document.createElement("div");
            card.className = "post-card";

            card.innerHTML = `
                <h3>${escapeHTML(post.name)}</h3>

                <p>${escapeHTML(post.content)}</p>

                <small>
                    ${escapeHTML(new Date(post.created_at).toLocaleString())}
                </small>

                <br><br>

                <div class="post-actions">
                    <button onclick="likePost(${postId})">
                        ❤️ Like
                    </button>

                    <button onclick="unlikePost(${postId})">
                        Unlike
                    </button>

                    <strong>
                        ❤️ ${Number(likeData.totalLikes)} Likes
                    </strong>

                    <button onclick="loadComments(${postId})">
                        💬 Comments
                    </button>

                    ${currentUser &&
                    Number(post.user_id) === Number(currentUser.id)
                        ? `<button onclick="deletePost(${postId})">Delete</button>`
                        : ""}
                </div>

                <div id="comments-${postId}"></div>

                <div class="comment-form">
                    <input
                        id="comment-input-${postId}"
                        placeholder="Write a comment..."
                    >

                    <button onclick="addComment(${postId})">
                        Comment
                    </button>
                </div>
            `;

            container.appendChild(card);
        }

    } catch (error) {
        showMessage(error.message);
    }
}

// Delete your own post
async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) {
        return;
    }

    try {
        await apiRequest(`/posts/${postId}`, "DELETE");

        showMessage("Post deleted successfully!");
        await loadPosts();

    } catch (error) {
        showMessage(error.message);
    }
}

// Like a post
async function likePost(postId) {
    try {
        await apiRequest(`/likes/${postId}`, "POST");

        await loadPosts();

        showMessage("Post liked successfully!");

    } catch (error) {
        showMessage(error.message);
    }
}

// Unlike a post
async function unlikePost(postId) {
    try {
        await apiRequest(`/likes/${postId}`, "DELETE");

        await loadPosts();

        showMessage("Post unliked successfully!");

    } catch (error) {
        showMessage(error.message);
    }
}

// Add comment
async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const comment_text = input.value.trim();

    if (!comment_text) {
        return showMessage("Please enter a comment");
    }

    try {
        await apiRequest(`/comments/${postId}`, "POST", {
            comment_text
        });

        input.value = "";
        await loadComments(postId);

    } catch (error) {
        showMessage(error.message);
    }
}

// Load comments
async function loadComments(postId) {
    try {
        const comments = await apiRequest(`/comments/${postId}`);
        const container = document.getElementById(`comments-${postId}`);

        container.innerHTML = `
            <h4>Comments (${comments.length})</h4>

            ${comments.map(comment => `
                <p>
                    <strong>${escapeHTML(comment.name)}:</strong>
                    ${escapeHTML(comment.comment_text)}
                </p>
            `).join("")}
        `;

    } catch (error) {
        showMessage(error.message);
    }
}

// Load profile
async function loadProfile() {
    if (!currentUser) return;

    try {
        const user = await apiRequest(`/users/${currentUser.id}`);

        document.getElementById("profileName").textContent = user.name;
        document.getElementById("profileEmail").textContent = user.email;

        document.getElementById("editName").value = user.name;
        document.getElementById("editBio").value = user.bio || "";

    } catch (error) {
        showMessage(error.message);
    }
}

// Update profile

async function updateProfile() {
    const name = document.getElementById("editName").value.trim();
    const bio = document.getElementById("editBio").value.trim();

    if (!name) {
        return showMessage("Name cannot be empty");
    }

    try {
        await apiRequest("/users/me", "PUT", {
            name,
            bio
        });

        currentUser.name = name;
        localStorage.setItem("user", JSON.stringify(currentUser));

        document.getElementById("profileName").textContent = name;

        showMessage("Profile updated successfully!");

        await loadPosts();
        await loadUsers();

    } catch (error) {
        showMessage(error.message);
    }
}

// Load users and following information
async function loadUsers() {
    if (!currentUser) return;

    try {
        const users = await apiRequest("/users");

        const followingData = await apiRequest(
            `/follow/${currentUser.id}/following`
        );

        const followingIds = followingData.following.map(
            user => Number(user.id)
        );

        const container = document.getElementById("usersContainer");

        if (!container) return;

        container.innerHTML = "<h3>Discover People</h3>";

        users
            .filter(user => Number(user.id) !== Number(currentUser.id))
            .forEach(user => {
                const isFollowing = followingIds.includes(Number(user.id));

                const item = document.createElement("div");
                item.className = "post-card";

                item.innerHTML = `
                    <strong>${escapeHTML(user.name)}</strong>

                    <p>${escapeHTML(user.email)}</p>

                    <button onclick="toggleFollow(
                        ${Number(user.id)},
                        ${isFollowing}
                    )">
                        ${isFollowing ? "Unfollow" : "Follow"}
                    </button>
                `;

                container.appendChild(item);
            });

    } catch (error) {
        showMessage(error.message);
    }
}

// Follow or unfollow
async function toggleFollow(userId, isFollowing) {
    try {
        const method = isFollowing ? "DELETE" : "POST";

        await apiRequest(`/follow/${userId}`, method);

        showMessage(
            isFollowing
                ? "User unfollowed successfully!"
                : "User followed successfully!"
        );

        await loadUsers();

    } catch (error) {
        showMessage(error.message);
    }
}

// Initial application setup
window.addEventListener("DOMContentLoaded", () => {
    updateNavigation();

    if (token && currentUser && currentUser.id) {
        showSection("home");
    } else {
        showSection("auth");
    }
});
