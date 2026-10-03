/**
 * Optimized Developer Dashboard & Admin Logic
 */

// Preset Sample Posts Data
const samplePosts = [
  {
    id: 1,
    author: "Oliver Cat",
    handle: "@oliver_cat",
    avatar: "cat.jpg",
    text: "Building modern full-stack web applications with Node.js and glassmorphism styling.",
    channel: "updates",
    server: "General",
    likes: 34,
    type: "text",
    bookmarked: true
  },
  {
    id: 2,
    author: "supersimple.dev",
    handle: "@SuperSimpleDev",
    avatar: "cat2.jpg",
    text: "NEW VIDEO TUTORIAL: Master Web Development & CSS Grid Layouts in 30 Minutes!",
    channel: "new-videos",
    server: "Dev-Hub",
    likes: 112,
    type: "video",
    bookmarked: false
  },
  {
    id: 3,
    author: "Cyber Tech",
    handle: "@cyber_tech",
    avatar: "dog.jpg",
    text: "Network speed testing complete. High performance and zero latency detected.",
    channel: "updates",
    server: "General",
    likes: 18,
    type: "text",
    bookmarked: true
  },
  {
    id: 4,
    author: "Dev Tutorial",
    handle: "@dev_tube",
    avatar: "cat.jpg",
    text: "Video Guide: How to build clean REST APIs with Express.js.",
    channel: "new-videos",
    server: "Gaming",
    likes: 64,
    type: "video",
    bookmarked: true
  }
];

// Application State
let state = {
  posts: JSON.parse(localStorage.getItem("cp_posts")) || samplePosts,
  suggestedUsers: JSON.parse(localStorage.getItem("cp_users")) || [
    { id: 101, name: "Oliver Cat", handle: "@oliver_cat", avatar: "cat.jpg", following: true },
    { id: 102, name: "Mimi Dev", handle: "@mimi_code", avatar: "cat2.jpg", following: false },
    { id: 103, name: "Rex Tech", handle: "@rex_tech", avatar: "dog.jpg", following: false }
  ],
  cartCount: parseInt(localStorage.getItem("cp_cart")) || 0,
  activeFilter: "all",
  activeChannel: "all",
  activeServer: "General",
  searchQuery: "",
  neonBoost: localStorage.getItem("cp_neon") !== "false",
  timerSeconds: 45
};

// --- Fast Preloader Dismiss Strategy ---
function hidePreloader() {
  const preloader = document.getElementById("preloader");
  if (preloader) {
    preloader.classList.add("hidden");
  }
}

function initApp() {
  initUI();
  initEventListeners();
  startTimers();
  renderFeed();
  renderUsers();
  
  // Guaranteed quick fade-out
  setTimeout(hidePreloader, 200);
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(initApp, 50);
} else {
  document.addEventListener("DOMContentLoaded", initApp);
}

// UI Setup
function initUI() {
  updateBadges();
  const cartEl = document.getElementById("cart-count");
  if (cartEl) cartEl.textContent = state.cartCount;

  if (state.neonBoost) {
    document.body.classList.add("neon-boost");
  } else {
    document.body.classList.remove("neon-boost");
  }

  const neonToggle = document.getElementById("toggle-neon");
  if (neonToggle) neonToggle.checked = state.neonBoost;

  const serverEl = document.getElementById("active-server-name");
  if (serverEl) serverEl.textContent = state.activeServer;
}

function saveState() {
  localStorage.setItem("cp_posts", JSON.stringify(state.posts));
  localStorage.setItem("cp_users", JSON.stringify(state.suggestedUsers));
  localStorage.setItem("cp_cart", state.cartCount);
  localStorage.setItem("cp_neon", state.neonBoost);
}

function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (modal) {
    if (show) modal.classList.add("active");
    else modal.classList.remove("active");
  }
}

function showToast(msg) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// Render Feed
function renderFeed() {
  const container = document.getElementById("posts-feed-container");
  if (!container) return;
  container.innerHTML = "";

  let filtered = state.posts.filter(p => p.server === state.activeServer || !p.server);

  if (state.activeChannel !== "all") {
    filtered = filtered.filter(p => p.channel === state.activeChannel);
  }

  if (state.activeFilter === "video") {
    filtered = filtered.filter(p => p.type === "video");
  } else if (state.activeFilter === "bookmarked") {
    filtered = filtered.filter(p => p.bookmarked === true);
  }

  if (state.searchQuery.trim() !== "") {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.text.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 20px; color: var(--text-muted); background: var(--panel-bg); border-radius: 10px; border: 1px solid var(--panel-border); font-size: 13px;">
        No posts found under "${state.activeFilter}".
      </div>`;
    updateBadges();
    return;
  }

  filtered.forEach(post => {
    const postEl = document.createElement("article");
    postEl.className = "tweet-card";
    postEl.innerHTML = `
      <button class="delete-post-btn" onclick="deletePost(${post.id})" title="Delete">&times;</button>
      <img class="tweet-avatar" src="${post.avatar}" alt="Avatar" onerror="this.src='https://placehold.co/44x44/1f2937/00d4ff?text=User'">
      <div class="tweet-body">
        <div class="tweet-header">
          <div>
            <span class="author-name">${post.author}</span>
            <span class="author-handle">${post.handle}</span>
          </div>
        </div>
        <p class="tweet-text">${post.text}</p>
        <div class="post-actions-row">
          <button class="action-btn ${post.likes > 0 ? 'active' : ''}" onclick="likePost(${post.id})">❤️ ${post.likes} Likes</button>
          <button class="action-btn ${post.bookmarked ? 'active' : ''}" onclick="toggleBookmark(${post.id})">🔖 ${post.bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
          <span>#${post.channel}</span>
        </div>
      </div>
    `;
    container.appendChild(postEl);
  });

  updateBadges();
}

function updateBadges() {
  const currentPosts = state.posts.filter(p => p.server === state.activeServer || !p.server);
  
  const total = document.getElementById("total-posts-badge");
  const video = document.getElementById("video-posts-badge");
  const bookmarked = document.getElementById("bookmarked-count");

  if (total) total.textContent = currentPosts.length;
  if (video) video.textContent = currentPosts.filter(p => p.type === "video").length;
  if (bookmarked) bookmarked.textContent = currentPosts.filter(p => p.bookmarked).length;
}

// Global Window Actions
window.likePost = function(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (post) {
    post.likes++;
    saveState();
    renderFeed();
  }
};

window.toggleBookmark = function(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (post) {
    post.bookmarked = !post.bookmarked;
    saveState();
    renderFeed();
    showToast(post.bookmarked ? "Bookmarked!" : "Bookmark removed");
  }
};

window.deletePost = function(postId) {
  state.posts = state.posts.filter(p => p.id !== postId);
  saveState();
  renderFeed();
  showToast("Post deleted");
};

function renderUsers() {
  const container = document.getElementById("suggested-users-container");
  if (!container) return;
  container.innerHTML = "";

  state.suggestedUsers.forEach(user => {
    const row = document.createElement("div");
    row.className = "user-row";
    row.innerHTML = `
      <img class="user-row-avatar" src="${user.avatar}" alt="User" onerror="this.src='https://placehold.co/38x38/1f2937/00d4ff?text=Dev'">
      <div class="user-info">
        <div class="user-display-name">${user.name}</div>
        <div class="user-handle">${user.handle}</div>
      </div>
      <button class="btn btn-follow ${user.following ? 'following' : ''}" onclick="toggleFollow(${user.id})">
        ${user.following ? 'Following' : 'Follow'}
      </button>
    `;
    container.appendChild(row);
  });
}

window.toggleFollow = function(userId) {
  const user = state.suggestedUsers.find(u => u.id === userId);
  if (user) {
    user.following = !user.following;
    saveState();
    renderUsers();
    showToast(user.following ? `Following ${user.name}` : `Unfollowed ${user.name}`);
  }
};

// Event Binding
function initEventListeners() {
  // Modal Buttons
  const bindModal = (btnId, modalId, open) => {
    const el = document.getElementById(btnId);
    if (el) el.onclick = () => toggleModal(modalId, open);
  };

  bindModal("open-post-modal", "post-modal-overlay", true);
  bindModal("close-post-modal", "post-modal-overlay", false);
  bindModal("cancel-post-btn", "post-modal-overlay", false);

  bindModal("open-admin-modal", "admin-modal-overlay", true);
  bindModal("close-admin-modal", "admin-modal-overlay", false);
  bindModal("save-admin-btn", "admin-modal-overlay", false);

  bindModal("open-messages-modal", "messages-modal-overlay", true);
  bindModal("close-messages-modal", "messages-modal-overlay", false);

  // Modal Backdrop Click
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  // Post Submission
  const form = document.getElementById("create-post-form");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const text = document.getElementById("post-text-input").value;
      const channel = document.getElementById("post-channel-select").value;
      const type = document.getElementById("post-type-select").value;

      state.posts.unshift({
        id: Date.now(),
        author: "Oliver Cat",
        handle: "@oliver_cat",
        avatar: "cat.jpg",
        text,
        channel,
        server: state.activeServer,
        likes: 0,
        type,
        bookmarked: false
      });

      saveState();
      renderFeed();
      toggleModal("post-modal-overlay", false);
      document.getElementById("post-text-input").value = "";
      showToast("Post created!");
    };
  }

  // Filter Pills
  document.querySelectorAll(".pill-item").forEach(pill => {
    pill.onclick = () => {
      document.querySelectorAll(".pill-item").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      state.activeFilter = pill.dataset.filter;
      renderFeed();
    };
  });

  // Server Switcher
  document.querySelectorAll(".sidebar-primary .icon-avatar-wrapper").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".sidebar-primary .icon-avatar-wrapper").forEach(s => s.classList.remove("active"));
      btn.classList.add("active");
      state.activeServer = btn.dataset.server;
      const serverEl = document.getElementById("active-server-name");
      if (serverEl) serverEl.textContent = state.activeServer;
      renderFeed();
      showToast(`Switched to ${state.activeServer}`);
    };
  });

  // Channels Selection
  document.querySelectorAll(".channel-item").forEach(ch => {
    ch.onclick = () => {
      document.querySelectorAll(".channel-item").forEach(c => c.classList.remove("active"));
      ch.classList.add("active");
      state.activeChannel = ch.dataset.channel;
      renderFeed();
    };
  });

  // Search Input
  const searchInput = document.getElementById("global-search");
  if (searchInput) {
    searchInput.oninput = (e) => {
      state.searchQuery = e.target.value;
      renderFeed();
    };
  }

  // Add to Cart
  const cartBtn = document.getElementById("add-cart-btn");
  if (cartBtn) {
    cartBtn.onclick = () => {
      state.cartCount++;
      document.getElementById("cart-count").textContent = state.cartCount;
      saveState();
      showToast("Added to cart");
    };
  }

  // Close Widget
  const closeWidget = document.getElementById("close-widget-btn");
  if (closeWidget) {
    closeWidget.onclick = () => {
      const widget = document.getElementById("floating-widget");
      if (widget) widget.style.display = "none";
    };
  }

  // Admin Controls
  const neonToggle = document.getElementById("toggle-neon");
  if (neonToggle) {
    neonToggle.onchange = (e) => {
      state.neonBoost = e.target.checked;
      if (state.neonBoost) document.body.classList.add("neon-boost");
      else document.body.classList.remove("neon-boost");
      saveState();
    };
  }

  const resetBtn = document.getElementById("reset-storage-btn");
  if (resetBtn) {
    resetBtn.onclick = () => {
      localStorage.clear();
      state.posts = [...samplePosts];
      state.cartCount = 0;
      saveState();
      initUI();
      renderFeed();
      renderUsers();
      showToast("Storage Reset!");
    };
  }

  const seedBtn = document.getElementById("seed-data-btn");
  if (seedBtn) {
    seedBtn.onclick = () => {
      state.posts.unshift({
        id: Date.now(),
        author: "Dev Admin",
        handle: "@admin",
        avatar: "dog.jpg",
        text: "Sample video update injected via Admin Panel.",
        channel: "new-videos",
        server: state.activeServer,
        likes: 5,
        type: "video",
        bookmarked: true
      });
      saveState();
      renderFeed();
      showToast("Sample video post injected!");
    };
  }

  // Email Delete
  document.querySelectorAll(".delete-email-btn").forEach(btn => {
    btn.onclick = (e) => {
      const item = e.target.closest(".email-item");
      if (item) {
        item.remove();
        const count = document.getElementById("inbox-count");
        if (count) count.textContent = document.querySelectorAll(".email-item").length;
        showToast("Email deleted");
      }
    };
  });
}

// Background Hardware Timers
function startTimers() {
  setInterval(() => {
    const ping = Math.floor(Math.random() * 10) + 18;
    const pingEl = document.getElementById("ping-value");
    if (pingEl) pingEl.textContent = `${ping}ms`;
  }, 3000);

  setInterval(() => {
    const ram = Math.floor(Math.random() * 15) + 50;
    const ramFill = document.getElementById("ram-fill");
    const ramVal = document.getElementById("ram-value");
    if (ramFill) ramFill.style.width = `${ram}%`;
    if (ramVal) ramVal.textContent = `${ram}%`;
  }, 4000);

  setInterval(() => {
    state.timerSeconds++;
    const mins = String(Math.floor(state.timerSeconds / 60)).padStart(2, '0');
    const secs = String(state.timerSeconds % 60).padStart(2, '0');
    const timerEl = document.getElementById("widget-timer");
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}