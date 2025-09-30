// Blog view functionality

import { formatTimestamp } from "../utils/dateUtils.js";
import { populateDropdown } from "../utils/autocomplete.js";

// Global variables for blog functionality
let allBlogPosts = [];
let filteredPosts = [];

export function setupBlogView() {
  console.log("Setting up blog view");

  // Get the blog container
  const blogContainer = document.getElementById("blogView");
  if (!blogContainer) {
    console.error("Blog container not found");
    return;
  }

  // Clear any existing content
  blogContainer.innerHTML = "";

  // Create the blog interface structure
  const blogHTML = `
        <div class="form-section">
            <div class="blog-header">
                <h2 class="section-title">CryoEM Blog</h2>
                <button id="newPostBtn" class="btn btn-primary">
                    <i class="icon">✏️</i> New Post
                </button>
            </div>
            
            <!-- Search and Filter Controls -->
            <div class="blog-controls">
                <div class="search-container">
                    <input type="text" id="blogSearchInput" placeholder="Search blog posts..." class="search-input">
                    <button id="clearSearchBtn" class="btn btn-small" style="display: none;">Clear</button>
                </div>
                <div class="filter-container">
                    <label for="categoryFilter">Category:</label>
                    <select id="categoryFilter" class="filter-select">
                        <option value="">All Categories</option>
                    </select>
                </div>
                <div class="filter-container">
                    <label for="authorFilter">Author:</label>
                    <select id="authorFilter" class="filter-select">
                        <option value="">All Authors</option>
                    </select>
                </div>
            </div>
            
            <div id="blogContent">
                <div id="blogPostsList" class="blog-posts-container">
                    <div class="loading">Loading blog posts...</div>
                </div>
                
                <div id="singlePostView" class="single-post-view" style="display: none;">
                    <!-- Single post content will be loaded here -->
                </div>
            </div>
        </div>
    `;

  blogContainer.innerHTML = blogHTML;

  // Set up event listeners
  setupBlogEventListeners();

  // Load blog posts
  loadBlogPosts();
}

function setupBlogEventListeners() {
  // New Post button
  const newPostBtn = document.getElementById("newPostBtn");
  if (newPostBtn) {
    newPostBtn.addEventListener("click", showContributeForm);
  }

  // Search functionality
  const searchInput = document.getElementById("blogSearchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    });
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", clearSearch);
  }

  // Category filter
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) {
    categoryFilter.addEventListener("change", handleCategoryFilter);
  }

  // Author filter
  const authorFilter = document.getElementById("authorFilter");
  if (authorFilter) {
    authorFilter.addEventListener("change", handleAuthorFilter);
  }
}

async function loadBlogPosts() {
  try {
    console.log("Loading blog posts...");

    const response = await fetch("/api/blog");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const posts = await response.json();
    console.log("Loaded posts:", posts);

    // Store all posts for filtering/searching
    allBlogPosts = posts;
    filteredPosts = [...posts];

    // Populate filters with actual data from posts
    populateCategoryFilter(posts);
    populateAuthorFilter(posts);

    displayBlogPosts(filteredPosts);
  } catch (error) {
    console.error("Error loading blog posts:", error);

    const postsContainer = document.getElementById("blogPostsList");
    if (postsContainer) {
      postsContainer.innerHTML = `
                <div class="error-message">
                    <p>Unable to load blog posts. Please try again later.</p>
                    <button onclick="loadBlogPosts()" class="btn btn-secondary">Retry</button>
                </div>
            `;
    }
  }
}

function displayBlogPosts(posts) {
  const postsContainer = document.getElementById("blogPostsList");
  if (!postsContainer) return;

  // Add posts count
  const searchInput = document.getElementById("blogSearchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const authorFilter = document.getElementById("authorFilter");
  const isFiltered = (searchInput && searchInput.value.trim()) || 
                     (categoryFilter && categoryFilter.value) ||
                     (authorFilter && authorFilter.value);
  
  if (posts.length === 0) {
    const emptyMessage = isFiltered 
      ? `
        <div class="empty-state">
          <h3>No posts found</h3>
          <p>No blog posts match your current search or filter criteria.</p>
          <button onclick="clearAllFilters();" class="btn btn-secondary">Clear Filters</button>
        </div>
      `
      : `
        <div class="empty-state">
          <h3>No blog posts yet</h3>
          <p>Be the first to contribute to our CryoEM blog!</p>
          <button onclick="showContributeForm()" class="btn btn-primary">Write First Post</button>
        </div>
      `;
    
    postsContainer.innerHTML = emptyMessage;
    return;
  }

  const postsHTML = posts
    .map(
      (post) => `
        <article class="blog-post-preview" data-slug="${post.slug}">
            <div class="post-header">
                <h3 class="post-title">
                    <a href="#" onclick="loadFullPost('${
                      post.slug
                    }'); return false;">
                        ${escapeHtml(post.title)}
                    </a>
                </h3>
                <div class="post-meta">
                    <span class="post-category category-${post.category.toLowerCase()}">${
        post.category
      }</span>
                    <span class="post-author">by ${escapeHtml(
                      post.author
                    )}</span>
                    <span class="post-date">${formatTimestamp(
                      post.created_at
                    )}</span>
                    ${
                      post.last_modified_by &&
                      post.last_modified_by !== post.author
                        ? `<span class="post-modified">• edited by ${escapeHtml(
                            post.last_modified_by
                          )}</span>`
                        : ""
                    }
                </div>
            </div>
            <div class="post-excerpt">
                ${post.excerpt}
            </div>
            <div class="post-actions">
                <button onclick="loadFullPost('${
                  post.slug
                }')" class="btn btn-secondary btn-small">Read More</button>
                <button onclick="showEditForm('${
                  post.slug
                }')" class="btn btn-outline btn-small">Edit</button>
                <button onclick="deletePost('${
                  post.slug
                }')" class="btn btn-danger btn-small">Delete</button>
            </div>
        </article>
    `
    )
    .join("");

  // Create posts count display
  const totalPosts = allBlogPosts.length;
  const displayedPosts = posts.length;
  const countsText = isFiltered 
    ? `Showing ${displayedPosts} of ${totalPosts} posts`
    : `${totalPosts} post${totalPosts === 1 ? '' : 's'}`;

  postsContainer.innerHTML = `
        <div class="posts-count">${countsText}</div>
        <div class="blog-posts-grid">
            ${postsHTML}
        </div>
    `;
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Single Post View Functions
async function loadFullPost(slug) {
  try {
    const response = await fetch(`/api/blog/${slug}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const post = await response.json();
    displaySinglePost(post);
  } catch (error) {
    console.error("Error loading full post:", error);
    
    const blogContent = document.getElementById("blogContent");
    if (blogContent) {
      blogContent.innerHTML = `
        <div class="error-message">
          <p>Unable to load the blog post. Please try again later.</p>
          <button onclick="showBlogList()" class="btn btn-secondary">Back to Blog</button>
        </div>
      `;
    }
  }
}

function displaySinglePost(post) {
  const blogContent = document.getElementById("blogContent");
  if (!blogContent) return;
  
  const postHtml = `
    <div class="single-post-view">
      <div class="single-post-header">
        <button onclick="showBlogList()" class="btn btn-outline btn-small back-button">
          ← Back to Blog
        </button>
      </div>
      
      <article class="single-post">
        <header class="single-post-meta">
          <h1 class="single-post-title">${escapeHtml(post.title)}</h1>
          <div class="single-post-details">
            <span class="post-category category-${post.category.toLowerCase()}">${post.category}</span>
            <span class="post-author">by ${escapeHtml(post.author)}</span>
            <span class="post-date">${formatTimestamp(post.created_at)}</span>
            ${
              post.last_modified_by && post.last_modified_by !== post.author
                ? `<span class="post-modified">• edited by ${escapeHtml(post.last_modified_by)} on ${formatTimestamp(post.updated_at)}</span>`
                : ""
            }
          </div>
        </header>
        
        <div class="single-post-content">
          ${post.content}
        </div>
        
        <div class="single-post-actions">
          <button onclick="showEditForm('${post.slug}')" class="btn btn-primary">Edit Post</button>
          <button onclick="deletePost('${post.slug}')" class="btn btn-danger">Delete Post</button>
        </div>
      </article>
    </div>
  `;
  
  blogContent.innerHTML = postHtml;
}

function showBlogList() {
  const blogContent = document.getElementById("blogContent");
  if (!blogContent) return;
  
  // Restore the original blog list view
  blogContent.innerHTML = `
    <div class="blog-controls">
      <div class="blog-search">
        <input type="text" id="blogSearchInput" placeholder="Search blog posts..." class="search-input">
        <button id="clearSearchBtn" class="clear-search-btn" style="display: none;">×</button>
      </div>
      <div class="blog-filters">
        <select id="categoryFilter" class="filter-select">
          <option value="">All Categories</option>
        </select>
        <select id="authorFilter" class="filter-select">
          <option value="">All Authors</option>
        </select>
      </div>
      <button onclick="showContributeForm()" class="btn btn-primary">+ New Post</button>
    </div>
    <div id="blogPostsList"></div>
  `;
  
  // Re-initialize the blog view
  setupBlogView();
}

// Placeholder functions for upcoming features
function showContributeForm() {
  alert("Contribute new post - coming soon!");
}

function showEditForm(slug) {
  alert(`Edit post: ${slug} - coming soon!`);
}

function deletePost(slug) {
  alert(`Delete post: ${slug} - coming soon!`);
}

// Filter population functions
function populateCategoryFilter(posts) {
  // Extract unique categories from posts
  const categories = [...new Set(posts.map(post => post.category))].sort();
  
  // Use the autocomplete utility to populate the dropdown
  populateDropdown("categoryFilter", categories, "All Categories");
}

function populateAuthorFilter(posts) {
  // Extract unique authors from posts
  const authors = [...new Set(posts.map(post => post.author))].sort();
  
  // Use the autocomplete utility to populate the dropdown
  populateDropdown("authorFilter", authors, "All Authors");
}

// Search and Filter Functions
function handleSearch() {
  const searchInput = document.getElementById("blogSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  const searchTerm = searchInput.value.toLowerCase().trim();
  
  if (searchTerm === "") {
    clearBtn.style.display = "none";
    applyFilters();
    return;
  }
  
  clearBtn.style.display = "inline-block";
  
  // Filter posts by search term (title, content, author)
  const searchResults = allBlogPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm) ||
    post.excerpt.toLowerCase().includes(searchTerm) ||
    post.author.toLowerCase().includes(searchTerm) ||
    post.category.toLowerCase().includes(searchTerm)
  );
  
  // Apply category filter to search results
  const categoryFilter = document.getElementById("categoryFilter");
  const selectedCategory = categoryFilter.value;
  
  filteredPosts = selectedCategory 
    ? searchResults.filter(post => post.category === selectedCategory)
    : searchResults;
  
  displayBlogPosts(filteredPosts);
}

function clearSearch() {
  const searchInput = document.getElementById("blogSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  
  searchInput.value = "";
  clearBtn.style.display = "none";
  
  applyFilters();
}

function clearAllFilters() {
  const searchInput = document.getElementById("blogSearchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const authorFilter = document.getElementById("authorFilter");
  const clearBtn = document.getElementById("clearSearchBtn");
  
  if (searchInput) searchInput.value = "";
  if (categoryFilter) categoryFilter.value = "";
  if (authorFilter) authorFilter.value = "";
  if (clearBtn) clearBtn.style.display = "none";
  
  applyFilters();
}

function handleCategoryFilter() {
  applyFilters();
}

function handleAuthorFilter() {
  applyFilters();
}

function applyFilters() {
  const categoryFilter = document.getElementById("categoryFilter");
  const authorFilter = document.getElementById("authorFilter");
  const searchInput = document.getElementById("blogSearchInput");
  
  const selectedCategory = categoryFilter ? categoryFilter.value : "";
  const selectedAuthor = authorFilter ? authorFilter.value : "";
  const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  // Start with all posts
  let filtered = [...allBlogPosts];
  
  // Apply search filter
  if (searchTerm) {
    filtered = filtered.filter(post => 
      post.title.toLowerCase().includes(searchTerm) ||
      post.excerpt.toLowerCase().includes(searchTerm) ||
      post.author.toLowerCase().includes(searchTerm) ||
      post.category.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply category filter
  if (selectedCategory) {
    filtered = filtered.filter(post => post.category === selectedCategory);
  }
  
  // Apply author filter
  if (selectedAuthor) {
    filtered = filtered.filter(post => post.author === selectedAuthor);
  }
  
  filteredPosts = filtered;
  displayBlogPosts(filteredPosts);
}

// Make functions available globally for retry button and inline handlers
window.loadBlogPosts = loadBlogPosts;
window.clearAllFilters = clearAllFilters;
window.loadFullPost = loadFullPost;
window.showBlogList = showBlogList;
window.showEditForm = showEditForm;
window.showContributeForm = showContributeForm;
window.deletePost = deletePost;
