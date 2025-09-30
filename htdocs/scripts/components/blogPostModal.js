// Blog Post Modal Component
// This file handles the blog post creation and editing modal functionality

import { showAlert, showModalAlert } from "./alertSystem.js";
import {
  populateDropdownFromAPI,
  handleAddNewOption,
  populateDropdown,
} from "../utils/autocomplete.js";

// Store current post data for editing
let currentPostData = null;
let isEditMode = false;
let tinyMCEEditor = null;

/**
 * Show the blog post modal for creating a new post
 */
export function showNewPostModal() {
  isEditMode = false;
  currentPostData = null;

  const modalContent = document.getElementById("blogPostModalContent");
  modalContent.innerHTML = createPostModalHTML();

  // Show the modal
  const modal = document.getElementById("blogPostModal");
  modal.style.display = "block";

  // Initialize form
  initializePostForm();

  // Set focus to title input
  setTimeout(() => {
    const titleInput = document.getElementById("modalPostTitle");
    if (titleInput) titleInput.focus();
  }, 100);
}

/**
 * Show the blog post modal for editing an existing post
 * @param {string} slug - The slug of the post to edit
 */
export async function showEditPostModal(slug) {
  try {
    // Fetch the existing post data
    const response = await fetch(`/api/blog/${slug}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const post = await response.json();

    isEditMode = true;
    currentPostData = post;

    const modalContent = document.getElementById("blogPostModalContent");
    modalContent.innerHTML = createPostModalHTML(post);

    // Show the modal
    const modal = document.getElementById("blogPostModal");
    modal.style.display = "block";

    // Initialize form with existing data
    initializePostForm(post);
  } catch (error) {
    console.error("Error loading post for editing:", error);
    showAlert("Unable to load post for editing. Please try again.", "error");
  }
}

/**
 * Create the HTML content for the blog post modal
 * @param {Object} post - Optional existing post data for editing
 * @returns {string} The HTML content
 */
function createPostModalHTML(post = null) {
  const title = isEditMode ? "Edit Blog Post" : "Create New Blog Post";
  const submitText = isEditMode ? "Update Post" : "Publish Post";

  return `
    <h2 class="modal-title">${title}</h2>
    
    <form id="blogPostForm" class="modal-form">
      ${
        isEditMode
          ? `<input type="hidden" id="modalPostSlug" value="${post.slug}">`
          : ""
      }
      
      <div class="form-group">
        <label for="modalPostTitle">Title *</label>
        <input 
          type="text" 
          id="modalPostTitle" 
          name="title" 
          required 
          class="form-input" 
          placeholder="Enter post title..."
          value="${post ? escapeHtml(post.title) : ""}"
        >
        <div class="field-error" id="modalTitleError"></div>
      </div>
      
      <div class="form-group">
        <label for="modalPostAuthor">Author *</label>
        <select id="modalPostAuthor" name="author" required class="form-select">
          <option value="">Loading authors...</option>
        </select>
        <div class="field-error" id="modalAuthorError"></div>
      </div>
      
      <div class="form-group">
        <label for="modalPostCategory">Category *</label>
        <select id="modalPostCategory" name="category" required class="form-select">
          <option value="">Loading categories...</option>
        </select>
        <div class="field-error" id="modalCategoryError"></div>
      </div>
      
      <div class="form-group">
        <label for="modalPostContent">Content *</label>
        <textarea 
          id="modalPostContent" 
          name="content"
          class="tinymce-editor" 
          style="width: 100%; height: 400px;"
        >${post ? post.content : ""}</textarea>
        <div class="field-error" id="modalContentError"></div>
      </div>
      
      <div class="modal-actions">
        <button type="button" onclick="submitBlogPost()" class="btn btn-primary">${submitText}</button>
        <button type="button" onclick="saveBlogPostDraft()" class="btn btn-secondary">Save Draft</button>
        <button type="button" onclick="closeBlogPostModal()" class="btn btn-outline">Cancel</button>
      </div>
    </form>
  `;
}

/**
 * Initialize the post form
 * @param {Object} post - Optional existing post data
 */
async function initializePostForm(post = null) {
  // Populate dropdowns with API data
  await Promise.all([
    populateCategoryDropdown(post?.category),
    populateAuthorDropdown(post?.author),
  ]);

  // Set up "Add new" functionality
  setupAddNewHandlers();

  // Initialize TinyMCE editor with content if editing
  const initialContent = post?.content || "";
  setTimeout(() => {
    initializeTinyMCE(initialContent);
  }, 100);

  // Load draft data if creating new post and draft exists
  if (!isEditMode) {
    setTimeout(() => {
      loadDraftData();
    }, 300); // Wait a bit longer for TinyMCE to be ready
  }
}

/**
 * Populate category dropdown from API
 * @param {string} selectedValue - Value to select after population
 */
async function populateCategoryDropdown(selectedValue = null) {
  try {
    await populateDropdownFromAPI(
      "modalPostCategory",
      "/api/blog/categories",
      "Select a category...",
      null,
      (error) => {
        console.error("Failed to load categories:", error);
        // Fallback to default categories
        const defaultCategories = [
          "News",
          "Research",
          "Protocols",
          "Equipment",
          "Methods",
          "Updates",
        ];
        populateDropdown(
          "modalPostCategory",
          defaultCategories,
          "Select a category...",
          null,
          null,
          true
        );
      },
      true // Enable "Add new" option
    );

    // Set selected value if provided
    if (selectedValue) {
      const select = document.getElementById("modalPostCategory");
      if (select) select.value = selectedValue;
    }
  } catch (error) {
    console.error("Error populating category dropdown:", error);
  }
}

/**
 * Populate author dropdown from API
 * @param {string} selectedValue - Value to select after population
 */
async function populateAuthorDropdown(selectedValue = null) {
  try {
    await populateDropdownFromAPI(
      "modalPostAuthor",
      "/api/blog/authors",
      "Select author or add new...",
      null,
      (error) => {
        console.error("Failed to load authors:", error);
      },
      true // Enable "Add new" option
    );

    // Set selected value if provided
    if (selectedValue) {
      const select = document.getElementById("modalPostAuthor");
      if (select) select.value = selectedValue;
    }
  } catch (error) {
    console.error("Error populating author dropdown:", error);
  }
}

/**
 * Setup "Add new" functionality for dropdowns
 */
function setupAddNewHandlers() {
  const categorySelect = document.getElementById("modalPostCategory");
  const authorSelect = document.getElementById("modalPostAuthor");

  if (categorySelect) {
    categorySelect.addEventListener("change", function () {
      handleAddNewOption(this, "Enter new category...");
    });
  }

  if (authorSelect) {
    authorSelect.addEventListener("change", function () {
      handleAddNewOption(this, "Enter your name...");
    });
  }
}

/**
 * Initialize TinyMCE editor for blog content
 * @param {string} initialContent - Optional initial content for the editor
 */
function initializeTinyMCE(initialContent = "") {
  // Remove existing editor instance if it exists
  if (tinyMCEEditor) {
    tinymce.remove("#modalPostContent");
    tinyMCEEditor = null;
  }

  // Initialize TinyMCE
  tinymce.init({
    selector: "#modalPostContent",
    apiKey: window.TINYMCE_CONFIG ? window.TINYMCE_CONFIG.apiKey : "",
    height: 400,
    menubar: false,
    plugins: [
      "advlist",
      "autolink",
      "lists",
      "link",
      "charmap",
      "anchor",
      "searchreplace",
      "visualblocks",
      "code",
      "insertdatetime",
      "table",
      "preview",
      "help",
      "wordcount",
    ],
    toolbar:
      "undo redo | blocks | " +
      "bold italic backcolor | alignleft aligncenter " +
      "alignright alignjustify | bullist numlist outdent indent | " +
      "removeformat | link | help",
    content_style:
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; margin: 10px; }',
    placeholder: "Write your blog post content here...",
    setup: function (editor) {
      editor.on("init", function () {
        tinyMCEEditor = editor;
        // Set initial content if provided
        if (initialContent) {
          editor.setContent(initialContent);
        }
      });
    },
    branding: false,
    resize: false,
  });
}

/**
 * Validate the blog post form
 * @returns {boolean} True if form is valid
 */
function validateBlogPostForm() {
  let isValid = true;

  // Clear previous errors
  document
    .querySelectorAll(".field-error")
    .forEach((el) => (el.textContent = ""));

  // Validate title
  const title = document.getElementById("modalPostTitle").value.trim();
  if (!title) {
    document.getElementById("modalTitleError").textContent =
      "Title is required";
    isValid = false;
  } else if (title.length < 5) {
    document.getElementById("modalTitleError").textContent =
      "Title must be at least 5 characters long";
    isValid = false;
  }

  // Validate author (could be select or input)
  const authorElement = document.getElementById("modalPostAuthor");
  const author = authorElement ? authorElement.value.trim() : "";
  if (!author) {
    document.getElementById("modalAuthorError").textContent =
      "Author name is required";
    isValid = false;
  }

  // Validate category (could be select or input)
  const categoryElement = document.getElementById("modalPostCategory");
  const category = categoryElement ? categoryElement.value.trim() : "";
  if (!category) {
    document.getElementById("modalCategoryError").textContent =
      "Please select or enter a category";
    isValid = false;
  }

  // Validate content (TinyMCE)
  let content = "";
  if (tinyMCEEditor) {
    content = tinyMCEEditor.getContent().trim();
  }

  if (
    !content ||
    content === "<p></p>" ||
    content === "<p><br></p>" ||
    content.replace(/<[^>]*>/g, "").trim().length < 10
  ) {
    document.getElementById("modalContentError").textContent =
      "Content must be at least 10 characters long";
    isValid = false;
  }

  return isValid;
}

/**
 * Gather form data into an object
 * @returns {Object} The form data
 */
function gatherFormData() {
  let content = "";
  if (tinyMCEEditor) {
    content = tinyMCEEditor.getContent();
  }

  return {
    title: document.getElementById("modalPostTitle")?.value.trim() || "",
    author: document.getElementById("modalPostAuthor")?.value.trim() || "",
    category: document.getElementById("modalPostCategory")?.value.trim() || "",
    content: content,
  };
}

/**
 * Submit the blog post (create or update)
 */
export async function submitBlogPost() {
  if (!validateBlogPostForm()) {
    return;
  }

  const formData = gatherFormData();

  try {
    let response;

    if (isEditMode) {
      const slug = document.getElementById("modalPostSlug").value;
      response = await fetch(`/api/blog/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
    } else {
      response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Show success message
    const successMessage = isEditMode
      ? "Blog post updated successfully!"
      : "Blog post published successfully!";
    showAlert(successMessage, "success");

    // Close modal
    closeBlogPostModal();

    // Refresh blog view and navigate to the post
    if (window.loadFullPost && result.slug) {
      window.loadFullPost(result.slug);
    } else if (window.loadBlogPosts) {
      window.loadBlogPosts();
    }
  } catch (error) {
    console.error("Error saving post:", error);
    showModalAlert("Failed to save blog post. Please try again.", "error");
  }
}

/**
 * Save blog post as draft
 */
export function saveBlogPostDraft() {
  const formData = {
    ...gatherFormData(),
    timestamp: new Date().toISOString(),
  };

  try {
    localStorage.setItem("blogPostDraft", JSON.stringify(formData));
    showModalAlert("Draft saved!", "success", true);
  } catch (error) {
    console.error("Error saving draft:", error);
    showModalAlert("Failed to save draft", "error");
  }
}

/**
 * Load draft data if available
 */
function loadDraftData() {
  try {
    const draftString = localStorage.getItem("blogPostDraft");
    if (draftString) {
      const draftData = JSON.parse(draftString);
      if (confirm("A draft was found. Would you like to restore it?")) {
        const titleEl = document.getElementById("modalPostTitle");
        const authorEl = document.getElementById("modalPostAuthor");
        const categoryEl = document.getElementById("modalPostCategory");

        if (titleEl) titleEl.value = draftData.title || "";
        if (authorEl) authorEl.value = draftData.author || "";
        if (categoryEl) categoryEl.value = draftData.category || "";

        // Load content into TinyMCE when it's ready
        if (draftData.content) {
          const waitForTinyMCE = setInterval(() => {
            if (tinyMCEEditor) {
              tinyMCEEditor.setContent(draftData.content);
              clearInterval(waitForTinyMCE);
            }
          }, 100);
        }
      }
    }
  } catch (error) {
    console.error("Error loading draft:", error);
  }
}

/**
 * Setup blog post modal event listeners
 */
export function setupBlogPostModal() {
  const modal = document.getElementById("blogPostModal");
  const closeBtn = modal?.querySelector(".close-modal");

  if (closeBtn) {
    closeBtn.addEventListener("click", closeBlogPostModal);
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeBlogPostModal();
    });
  }
}

/**
 * Close the blog post modal
 */
export function closeBlogPostModal() {
  // Clean up TinyMCE editor
  if (tinyMCEEditor) {
    tinymce.remove("#modalPostContent");
    tinyMCEEditor = null;
  }

  const modal = document.getElementById("blogPostModal");
  modal.style.display = "none";

  // Reset form state
  isEditMode = false;
  currentPostData = null;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.submitBlogPost = submitBlogPost;
window.saveBlogPostDraft = saveBlogPostDraft;
window.closeBlogPostModal = closeBlogPostModal;
