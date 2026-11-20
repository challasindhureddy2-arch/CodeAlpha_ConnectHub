
/* ==========================================
   CONNECTHUB - COMPLETE FRONTEND JAVASCRIPT
   HTML + CSS + JavaScript + Node.js + MySQL
========================================== */

const API = "http://localhost:3000/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");
let currentSection = "auth";

// ==========================================
// COMMON FUNCTIONS
// ==========================================

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

// Local activity storage
function activityKey() {
    return `connecthub_activity_${currentUser?.id || "guest"}`;
}

// Record activity
function recordActivity(message) {
    if (!currentUser) return;

    const activities = JSON.parse(
        localStorage.getItem(activityKey()) || "[]"
    );

    activities.unshift({
        message,
        time: new Date().toLocaleString()
    });

    localStorage.setItem(
        activityKey(),
        JSON.stringify(activities.slice(0, 50))
    );
}

// ==========================================
// AUTHENTICATION
// ==========================================

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
    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.hidden = !token;
    }
}

// ==========================================
// NAVIGATION
// ==========================================

function showSection(section) {
    const sections = [
        "auth",
        "home",
        "explore",
        "saved",
        "activity",
        "profile"
    ];

    if (!token && section !== "auth") {
        section = "auth";
    }

    if (!sections.includes(section)) {
        section = "home";
    }

    currentSection = section;

    // Display selected section
    sections.forEach(name => {
        const element = document.getElementById(name + "Section");

        if (element) {
            element.hidden = name !== section;
        }
    });

    // Highlight active navbar link
    document.querySelectorAll(".navbar nav a").forEach(link => {
        const onclickText = link.getAttribute("onclick") || "";

        if (onclickText.includes(`'${section}'`)) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    if (section === "home") {
        loadPosts();
        loadUsers();
        renderStories();
    }

    if (section === "explore") {
        searchExplore();
    }

    if (section === "saved") {
        loadSavedPosts();
    }

    if (section === "activity") {
        loadActivity();
    }

   if (section === "profile") {
    loadProfile();
    renderHighlights();
}
}
// ==========================================
// POSTS
// ==========================================

// Create post
async function createPost() {
    const input = document.getElementById("postContent");
    const content = input.value.trim();

    if (!content) {
        return showMessage("Please write something first");
    }

    try {
        await apiRequest("/posts", "POST", { content });

        input.value = "";

        recordActivity("You created a new post ✨");

        showMessage("Post created successfully!");

        await loadPosts();

    } catch (error) {
        showMessage(error.message);
    }
}

// Get saved posts
function savedKey() {
    return `connecthub_saved_${currentUser?.id || "guest"}`;
}

function getSavedPosts() {
    return JSON.parse(localStorage.getItem(savedKey()) || "[]");
}

function isPostSaved(postId) {
    return getSavedPosts().some(
        post => Number(post.id) === Number(postId)
    );
}

// Create reusable post card
function createPostCard(post, options = {}) {
    const postId = Number(post.id);

    const card = document.createElement("div");
    card.className = "post-card";

    const saved = isPostSaved(postId);
    const showLikes = options.showLikes !== false;

    card.innerHTML = `
        <h3>${escapeHTML(post.name)}</h3>

        <p>${escapeHTML(post.content)}</p>

        <small>
            ${escapeHTML(
                new Date(post.created_at).toLocaleString()
            )}
        </small>

        <br><br>

        ${showLikes ? `
            <div class="post-actions">

                <button class="like-btn">
                    ❤️ Like
                </button>

                <button class="unlike-btn">
                    Unlike
                </button>

                <strong>
                    ❤️ ${Number(post.totalLikes || 0)} Likes
                </strong>

                <button class="comments-btn">
                    💬 Comments
                </button>

            </div>

            <div id="comments-${postId}"></div>

            <div class="comment-form">

                <input
                    class="comment-input"
                    placeholder="Write a comment..."
                >

                <button class="comment-submit">
                    Comment
                </button>

            </div>
        ` : ""}

        <div class="post-actions">

            <button class="save-post-btn">
                ${saved ? "🔖 Saved" : "🔖 Save"}
            </button>

            ${currentUser &&
            Number(post.user_id) === Number(currentUser.id)
                ? `<button class="delete-post-btn">Delete</button>`
                : ""}

        </div>
    `;

    // Attach post actions safely
    const likeButton = card.querySelector(".like-btn");
    const unlikeButton = card.querySelector(".unlike-btn");
    const commentsButton = card.querySelector(".comments-btn");
    const commentSubmit = card.querySelector(".comment-submit");
    const saveButton = card.querySelector(".save-post-btn");
    const deleteButton = card.querySelector(".delete-post-btn");

    if (likeButton) {
        likeButton.addEventListener("click", () => likePost(postId));
    }

    if (unlikeButton) {
        unlikeButton.addEventListener("click", () => unlikePost(postId));
    }

    if (commentsButton) {
        commentsButton.addEventListener("click", () => loadComments(postId));
    }

    if (commentSubmit) {
        commentSubmit.addEventListener("click", () => addComment(postId, card));
    }

    if (saveButton) {
        saveButton.addEventListener("click", () => toggleSavePost(post));
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", () => deletePost(postId));
    }

    return card;
}

// Load posts
async function loadPosts() {
    const container = document.getElementById("postsContainer");

    if (!container) return;

    try {
        const posts = await apiRequest("/posts");

        container.innerHTML = "";

        if (!Array.isArray(posts) || posts.length === 0) {
            container.innerHTML =
                "<p>No posts yet. Create the first post! 🌸</p>";
            return;
        }

        for (const post of posts) {
            try {
                const likeData = await apiRequest(`/likes/${post.id}`);
                post.totalLikes = Number(likeData.totalLikes || 0);
            } catch {
                post.totalLikes = 0;
            }

            container.appendChild(createPostCard(post));
        }

    } catch (error) {
        showMessage(error.message);
    }
}

// Delete post
async function deletePost(postId) {
    if (!confirm("Are you sure you want to delete this post?")) {
        return;
    }

    try {
        await apiRequest(`/posts/${postId}`, "DELETE");

        recordActivity("You deleted a post.");

        showMessage("Post deleted successfully!");

        await loadPosts();
        loadSavedPosts();

    } catch (error) {
        showMessage(error.message);
    }
}

// Like post
async function likePost(postId) {
    try {
        await apiRequest(`/likes/${postId}`, "POST");

        recordActivity("You liked a post ❤️");

        await loadPosts();

    } catch (error) {
        showMessage(error.message);
    }
}

// Unlike post
async function unlikePost(postId) {
    try {
        await apiRequest(`/likes/${postId}`, "DELETE");

        await loadPosts();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// COMMENTS
// ==========================================

// Add comment
async function addComment(postId, card) {
    const input = card.querySelector(".comment-input");
    const commentText = input.value.trim();

    if (!commentText) {
        return showMessage("Please enter a comment");
    }

    try {
        await apiRequest(`/comments/${postId}`, "POST", {
            comment_text: commentText
        });

        input.value = "";

        recordActivity("You commented on a post 💬");

        await loadComments(postId);

        showMessage("Comment added successfully!");

    } catch (error) {
        showMessage(error.message);
    }
}

// Load comments
async function loadComments(postId) {
    try {
        const comments = await apiRequest(`/comments/${postId}`);

        const container = document.getElementById(`comments-${postId}`);

        if (!container) return;

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

// ==========================================
// SAVED POSTS
// ==========================================

// Save or remove post
function toggleSavePost(post) {
    let saved = getSavedPosts();

    if (saved.some(item => Number(item.id) === Number(post.id))) {
        saved = saved.filter(
            item => Number(item.id) !== Number(post.id)
        );

        showMessage("Post removed from Saved 🔖");
        recordActivity("You removed a post from Saved.");

    } else {
        saved.push(post);

        showMessage("Post saved successfully! 🔖");
        recordActivity("You saved a post.");
    }

    localStorage.setItem(savedKey(), JSON.stringify(saved));

    if (currentSection === "saved") {
        loadSavedPosts();
    } else if (currentSection === "home") {
        loadPosts();
    }
}

// Load saved posts
function loadSavedPosts() {
    const container = document.getElementById("savedPostsContainer");

    if (!container) return;

    const saved = getSavedPosts();

    container.innerHTML = "<h3>Your Saved Collection 🔖</h3>";

    if (saved.length === 0) {
        container.innerHTML +=
            "<p>No saved posts yet. Save posts you love!</p>";
        return;
    }

    saved.forEach(post => {
        container.appendChild(
            createPostCard(post, { showLikes: false })
        );
    });
}

// ==========================================
// EXPLORE
// ==========================================

async function searchExplore() {
    const container = document.getElementById("exploreResults");

    if (!container) return;

    const input = document.getElementById("exploreSearch");
    const query = input ? input.value.trim().toLowerCase() : "";

    container.innerHTML = "<p>Discovering posts and people... 🌸</p>";

    try {
        const [posts, users] = await Promise.all([
            apiRequest("/posts"),
            apiRequest("/users")
        ]);

        const matchingUsers = users.filter(user =>
            Number(user.id) !== Number(currentUser?.id) &&
            (
                String(user.name).toLowerCase().includes(query) ||
                String(user.email).toLowerCase().includes(query) ||
                String(user.bio || "").toLowerCase().includes(query)
            )
        );

        const matchingPosts = posts.filter(post =>
            String(post.content).toLowerCase().includes(query) ||
            String(post.name).toLowerCase().includes(query)
        );

        container.innerHTML = "<h3>Discover People 🌷</h3>";

        if (matchingUsers.length === 0) {
            container.innerHTML += "<p>No matching people found.</p>";
        }

        matchingUsers.forEach(user => {
            const item = document.createElement("div");
            item.className = "post-card";

            item.innerHTML = `
                <strong>${escapeHTML(user.name)}</strong>
                <p>${escapeHTML(user.bio || "Connect and share moments 🌸")}</p>
            `;

            container.appendChild(item);
        });

        const heading = document.createElement("h3");
        heading.textContent = "Interesting Posts ✨";
        container.appendChild(heading);

        if (matchingPosts.length === 0) {
            const message = document.createElement("p");
            message.textContent = "No matching posts found.";
            container.appendChild(message);
        }

        matchingPosts.forEach(post => {
            container.appendChild(
                createPostCard(post, { showLikes: false })
            );
        });

    } catch (error) {
        container.innerHTML =
            "<p>Unable to load Explore right now.</p>";

        showMessage(error.message);
    }
}

// ==========================================
// PROFILE
// ==========================================

// Load profile
async function loadProfile() {
    if (!currentUser) return;

    try {
        const user = await apiRequest(`/users/${currentUser.id}`);

        document.getElementById("profileName").textContent = user.name;
        document.getElementById("profileEmail").textContent = user.email;

        document.getElementById("editName").value = user.name;
        document.getElementById("editBio").value = user.bio || "";

        const [posts, followersData, followingData] = await Promise.all([
            apiRequest("/posts"),
            apiRequest(`/follow/${currentUser.id}/followers`),
            apiRequest(`/follow/${currentUser.id}/following`)
        ]);

        const myPosts = posts.filter(
            post => Number(post.user_id) === Number(currentUser.id)
        );

        const followers = followersData.followers || [];
        const following = followingData.following || [];

        const postCount = document.getElementById("myPostCount");
        const followerCount = document.getElementById("myFollowerCount");
        const followingCount = document.getElementById("myFollowingCount");

        if (postCount) postCount.textContent = myPosts.length;
        if (followerCount) followerCount.textContent = followers.length;
        if (followingCount) followingCount.textContent = following.length;

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
        await apiRequest("/users/me", "PUT", { name, bio });

        currentUser.name = name;

        localStorage.setItem("user", JSON.stringify(currentUser));

        recordActivity("You updated your profile.");

        showMessage("Profile updated successfully!");

        await loadProfile();
        await loadPosts();
        await loadUsers();

    } catch (error) {
        showMessage(error.message);
    }
}

// ==========================================
// FOLLOW / UNFOLLOW
// ==========================================

async function loadUsers() {
    if (!currentUser) return;

    try {
        const users = await apiRequest("/users");

        const followingData = await apiRequest(
            `/follow/${currentUser.id}/following`
        );

        const followingIds = (followingData.following || []).map(
            user => Number(user.id)
        );

        const container = document.getElementById("usersContainer");

        if (!container) return;

        container.innerHTML = "<h3>Discover People 🌸</h3>";

        users
            .filter(user => Number(user.id) !== Number(currentUser.id))
            .forEach(user => {
                const isFollowing = followingIds.includes(Number(user.id));

                const item = document.createElement("div");
                item.className = "post-card";

                item.innerHTML = `
                    <strong>${escapeHTML(user.name)}</strong>
                    <p>${escapeHTML(user.email)}</p>
                    <button class="follow-button">
                        ${isFollowing ? "Unfollow" : "Follow"}
                    </button>
                `;

                item.querySelector(".follow-button").addEventListener(
                    "click",
                    () => toggleFollow(Number(user.id), isFollowing)
                );

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

        recordActivity(
            isFollowing
                ? "You unfollowed someone."
                : "You started following someone."
        );

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

// ==========================================
// ACTIVITY & NOTIFICATIONS
// ==========================================

function loadActivity() {
    const container = document.getElementById("notificationsContainer");

    if (!container) return;

    const activities = JSON.parse(
        localStorage.getItem(activityKey()) || "[]"
    );

    container.innerHTML = "<h3>Your Recent Activity 🔔</h3>";

    if (activities.length === 0) {
        container.innerHTML +=
            "<p>No recent activity yet. Start connecting!</p>";
        return;
    }

    activities.forEach(activity => {
        const item = document.createElement("div");
        item.className = "post-card";

        item.innerHTML = `
            <p>${escapeHTML(activity.message)}</p>
            <small>${escapeHTML(activity.time)}</small>
        `;

        container.appendChild(item);
    });
}

// ==========================================
// STORIES FEATURE
// ==========================================

let storyQueue = [];
let storyIndex = 0;

// Get active stories
function getStories() {
    let stories = JSON.parse(
        localStorage.getItem("connecthub_stories") || "[]"
    );

    stories = stories.filter(
        story => story.expiresAt > Date.now()
    );

    localStorage.setItem(
        "connecthub_stories",
        JSON.stringify(stories)
    );

    return stories;
}


function recordStoryView(story) {
    if (!currentUser) return;

    // Do not count the owner's own views
    if (Number(story.userId) === Number(currentUser.id)) return;

    const stories = getStories();

    const currentStory = stories.find(
        item => Number(item.id) === Number(story.id)
    );

    if (!currentStory) return;

    if (!Array.isArray(currentStory.views)) {
        currentStory.views = [];
    }

    const alreadyViewed = currentStory.views.some(
        view => Number(view.userId) === Number(currentUser.id)
    );

    if (!alreadyViewed) {
        currentStory.views.push({
            userId: currentUser.id,
            name: currentUser.name,
            viewedAt: Date.now()
        });

        localStorage.setItem(
            "connecthub_stories",
            JSON.stringify(stories)
        );
    }
}


function reactToStory(storyId, emoji) {
    if (!currentUser) return;

    const stories = getStories();

    const story = stories.find(
        item => Number(item.id) === Number(storyId)
    );

    if (!story) return;

    // Owners cannot react to their own stories
    if (Number(story.userId) === Number(currentUser.id)) {
        return;
    }

    if (!Array.isArray(story.reactions)) {
        story.reactions = [];
    }

    const existingReaction = story.reactions.find(
        item => Number(item.userId) === Number(currentUser.id)
    );

    if (existingReaction) {
        if (existingReaction.emoji === emoji) {
            story.reactions = story.reactions.filter(
                item => Number(item.userId) !== Number(currentUser.id)
            );
        } else {
            existingReaction.emoji = emoji;
        }
    } else {
        story.reactions.push({
            userId: currentUser.id,
            name: currentUser.name,
            emoji: emoji
        });
    }

    localStorage.setItem(
        "connecthub_stories",
        JSON.stringify(stories)
    );

    displayCurrentStory();
}


// Get saved story highlights
function getHighlights() {
    return JSON.parse(
        localStorage.getItem("connecthub_highlights") || "[]"
    );
}


// Save current story to a highlight
function saveCurrentStoryToHighlight() {
    if (!storyQueue.length || !currentUser) return;

    const story = storyQueue[storyIndex];

    if (Number(story.userId) !== Number(currentUser.id)) {
        return showMessage("You can save only your own stories!");
    }

    const highlightName = prompt(
        "Enter a highlight name (e.g. Memories, College, Friends):"
    );

    if (!highlightName || !highlightName.trim()) return;

    const name = highlightName.trim();
    const highlights = getHighlights();

    let highlight = highlights.find(
        item =>
            Number(item.userId) === Number(currentUser.id) &&
            item.name.toLowerCase() === name.toLowerCase()
    );

    if (!highlight) {
        highlight = {
            id: Date.now(),
            userId: currentUser.id,
            name: name,
            stories: []
        };

        highlights.push(highlight);
    }

    const alreadySaved = highlight.stories.some(
        item => Number(item.id) === Number(story.id)
    );

    if (alreadySaved) {
        return showMessage("This story is already in that highlight!");
    }

    highlight.stories.push({ ...story });

    localStorage.setItem(
        "connecthub_highlights",
        JSON.stringify(highlights)
    );

    showMessage("Story added to " + name + " ✨");
}


// Display highlights on profile
function renderHighlights() {
    const container = document.getElementById("highlightsContainer");

    if (!container || !currentUser) return;

    container.innerHTML = "";

    const highlights = getHighlights().filter(
        item => Number(item.userId) === Number(currentUser.id)
    );

    if (highlights.length === 0) {
        container.innerHTML = `
            <p class="no-highlights">
                No highlights yet. Save your favourite stories! ✨
            </p>
        `;
        return;
    }

    highlights.forEach(highlight => {
        const card = document.createElement("div");
        card.className = "highlight-card";

        const cover = document.createElement("div");
        cover.className = "highlight-cover";
        cover.textContent = "🌸";

        const name = document.createElement("p");
        name.textContent = highlight.name;

        const count = document.createElement("small");
        count.textContent = `${highlight.stories.length} stories`;

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-highlight-btn";
        deleteBtn.textContent = "🗑 Delete";

        card.append(cover, name, count, deleteBtn);

     card.addEventListener("click", () => {
    if (highlight.stories.length > 0) {
        openAccountStories(highlight.stories);
    }
});

        deleteBtn.addEventListener("click", event => {
            event.stopPropagation();

            if (!confirm(`Delete "${highlight.name}" highlight?`)) {
                return;
            }

            const updated = getHighlights().filter(
                item => Number(item.id) !== Number(highlight.id)
            );

            localStorage.setItem(
                "connecthub_highlights",
                JSON.stringify(updated)
            );

            renderHighlights();
            showMessage("Highlight deleted successfully! 🗑");
        });

        container.appendChild(card);
    });
}


// Add text or photo story
async function addStory() {
    if (!currentUser) {
        return showMessage("Please login first!");
    }

    const input = document.getElementById("storyInput");
    const imageInput = document.getElementById("storyImage");

    const content = input.value.trim();
    const file = imageInput.files[0];

    if (!content && !file) {
        return showMessage("Write something or select a photo!");
    }

    if (file && !file.type.startsWith("image/")) {
        return showMessage("Please select a valid image.");
    }

    if (file && file.size > 1024 * 1024) {
        return showMessage("Please select an image smaller than 1 MB.");
    }

    try {
        let imageData = "";

        if (file) {
            imageData = await new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(
                    new Error("Image could not be loaded")
                );

                reader.readAsDataURL(file);
            });
        }

        const stories = getStories();

        const newStory = {
            id: Date.now(),
            userId: currentUser.id,
            name: currentUser.name,
            content,
            image: imageData,
            createdAt: Date.now(),
            expiresAt: Date.now() + 24 * 60 * 60 * 1000
        };

        stories.unshift(newStory);

        try {
            localStorage.setItem(
                "connecthub_stories",
                JSON.stringify(stories)
            );
        } catch {
            return showMessage(
                "Browser storage is full. Please remove some old stories."
            );
        }

        input.value = "";
        imageInput.value = "";

        recordActivity("You shared a new story 🌸");

        renderStories();

        showMessage("Your beautiful story has been shared! 🌷");

    } catch (error) {
        showMessage(error.message);
    }
}

// Render one circle per account
function renderStories() {
    const container = document.getElementById("storiesContainer");

    if (!container) return;

    const stories = getStories();

    container.innerHTML = "";

    // Your Story circle
    const addCard = document.createElement("div");
    addCard.className = "story-card";

    addCard.innerHTML = `
        <div class="story-avatar">+</div>
        <p>Your Story</p>
    `;

    addCard.onclick = () => {
        document.getElementById("storyInput").focus();
    };

    container.appendChild(addCard);

    // Group stories by account
    const groupedStories = {};

    stories.forEach(story => {
        const id = String(story.userId);

        if (!groupedStories[id]) {
            groupedStories[id] = [];
        }

        groupedStories[id].push(story);
    });

    Object.values(groupedStories).forEach(accountStories => {
        const latestStory = accountStories[0];

        const card = document.createElement("div");
        card.className = "story-card";

        card.innerHTML = `
            <div class="story-avatar story-ring">
                ${latestStory.image
                    ? `<img src="${latestStory.image}" alt="Story">`
                    : "✿"}
            </div>

            <p>${escapeHTML(latestStory.name)}</p>

            <small>
                ${accountStories.length}
                ${accountStories.length === 1 ? "story" : "stories"}
            </small>
        `;

        card.onclick = () => openAccountStories(accountStories);

        container.appendChild(card);
    });
}

// Open stories of one account
function openAccountStories(stories) {
    storyQueue = [...stories].sort(
        (a, b) => a.createdAt - b.createdAt
    );

    storyIndex = 0;

    displayCurrentStory();
}

// Display current story

function displayCurrentStory() {
    const viewer = document.getElementById("storyViewer");
    const contentBox = document.getElementById("storyViewerContent");

    if (!viewer || !contentBox || storyQueue.length === 0) return;

    const story = storyQueue[storyIndex];

    // Record story view
recordStoryView(story);

const savedStory = getStories().find(
    item => Number(item.id) === Number(story.id)
);

const storyViews = savedStory && Array.isArray(savedStory.views)
    ? savedStory.views
    : [];

    const remainingHours = Math.max(
        0,
        Math.ceil((story.expiresAt - Date.now()) / (60 * 60 * 1000))
    );

    contentBox.innerHTML = `
        <div class="story-viewer-header">

            <div class="story-viewer-avatar">✿</div>

            <div>
                <strong>${escapeHTML(story.name)}</strong>
                <small>${remainingHours} hours remaining</small>
            </div>

            ${Number(story.userId) === Number(currentUser.id)
                ? `<button onclick="deleteCurrentStory()" class="delete-story-btn">
                    🗑 Delete
                   </button>`
                : ""}
        </div>

        <div class="story-progress">
            ${storyQueue.map((item, index) => `
                <div class="progress-track">
                    <div class="progress-fill"
                        style="width:${index <= storyIndex ? "100%" : "0%"}">
                    </div>
                </div>
            `).join("")}
        </div>

        <div class="story-display">
            ${story.image
                ? `<img src="${story.image}" alt="Shared story">`
                : ""}

            ${story.content
                ? `<p>${escapeHTML(story.content)}</p>`
                : ""}
        </div>
    
<div class="story-reactions">
    <p>React to this story 💕</p>

    ${["❤️", "😂", "😍", "🔥", "👏"].map(emoji => `
        <button
            class="reaction-btn"
            onclick="reactToStory(${story.id}, '${emoji}')">
            ${emoji}
        </button>
    `).join("")}
</div>

<div class="story-reaction-count">
    ${Array.isArray(story.reactions) && story.reactions.length
        ? story.reactions.map(reaction =>
            `<span>${reaction.emoji} ${escapeHTML(reaction.name)}</span>`
          ).join(" ")
        : "<small>No reactions yet</small>"
    }
</div>
   

${Number(story.userId) === Number(currentUser.id) ? `
    <button
        class="save-highlight-btn"
        onclick="saveCurrentStoryToHighlight()">
        ✨ Add to Highlights
    </button>
` : ""}

     
<small class="story-counter">
    Story ${storyIndex + 1} of ${storyQueue.length}
</small>

${Number(story.userId) === Number(currentUser.id) ? `
    <div class="story-view-count">
        👀 ${storyViews.length} views

        <div class="story-viewer-list">
            ${storyViews.length > 0
                ? storyViews.map(view => `
                    <span>👤 ${escapeHTML(view.name)}</span>
                `).join("")
                : "<small>No views yet</small>"
            }
        </div>
    </div>
` : ""}

    `;


    viewer.hidden = false;
}


// Delete current story
function deleteCurrentStory() {
    if (!storyQueue.length) return;

    const story = storyQueue[storyIndex];

    if (Number(story.userId) !== Number(currentUser.id)) {
        return showMessage("You can delete only your own stories.");
    }

    if (!confirm("Are you sure you want to delete this story?")) {
        return;
    }

    let stories = getStories();

    stories = stories.filter(
        item => Number(item.id) !== Number(story.id)
    );

    localStorage.setItem("connecthub_stories", JSON.stringify(stories));

    recordActivity("You deleted a story 🗑");

    closeStory();
    renderStories();

    showMessage("Story deleted successfully!");
}


// Previous story
function previousStory() {
    if (storyIndex > 0) {
        storyIndex--;
        displayCurrentStory();
    }
}


// Next story
function nextStory() {
    if (storyIndex < storyQueue.length - 1) {
        storyIndex++;
        displayCurrentStory();
    } else {
        closeStory();
    }
}


// Close story viewer
function closeStory() {
    const viewer = document.getElementById("storyViewer");

    if (viewer) {
        viewer.hidden = true;
    }

    storyQueue = [];
    storyIndex = 0;
}


// Close story viewer with Escape key
document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeStory();
    }
});


// Display selected photo name
document.addEventListener("DOMContentLoaded", () => {
    const photoInput = document.getElementById("storyImage");
    const photoName = document.getElementById("selectedPhotoName");

    if (photoInput && photoName) {
        photoInput.addEventListener("change", () => {
            photoName.textContent = photoInput.files.length
                ? "📸 " + photoInput.files[0].name
                : "No photo selected yet";
        });
    }
});


// INITIAL APPLICATION SETUP
window.addEventListener("DOMContentLoaded", () => {
    updateNavigation();

    if (token && currentUser && currentUser.id) {
        showSection("home");
    } else {
        showSection("auth");
    }
});
