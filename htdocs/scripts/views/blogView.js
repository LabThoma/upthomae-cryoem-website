// Blog view functionality

import { formatTimestamp } from "../utils/dateUtils.js";

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

    displayBlogPosts(posts);
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

  if (posts.length === 0) {
    postsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No blog posts yet</h3>
                <p>Be the first to contribute to our CryoEM blog!</p>
                <button onclick="showContributeForm()" class="btn btn-primary">Write First Post</button>
            </div>
        `;
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

  postsContainer.innerHTML = `
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

// Placeholder functions for functionality we'll implement later
function showContributeForm() {
  console.log("Show contribute form - to be implemented");
  alert("New post form coming soon!");
}

function loadFullPost(slug) {
  console.log("Load full post:", slug, "- to be implemented");
  alert(`Loading post: ${slug} - coming soon!`);
}

function showEditForm(slug) {
  console.log("Show edit form for:", slug, "- to be implemented");
  alert(`Edit post: ${slug} - coming soon!`);
}

function deletePost(slug) {
  console.log("Delete post:", slug, "- to be implemented");
  alert(`Delete post: ${slug} - coming soon!`);
}

// Make loadBlogPosts available globally for retry button
window.loadBlogPosts = loadBlogPosts;
