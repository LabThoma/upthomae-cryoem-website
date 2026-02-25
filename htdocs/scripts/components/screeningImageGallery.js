/**
 * Screening Image Gallery Component
 *
 * Displays low and high magnification screening images side-by-side
 * with independent navigation and lightbox viewing.
 */

/**
 * Create screening image gallery HTML
 * @param {string} sessionDate - Session date in YYYYMMDD format
 * @param {string} gridIdentifier - Grid identifier (e.g., AB123g1)
 * @returns {string} HTML string for the gallery
 */
export function createScreeningGalleryHTML(sessionDate, gridIdentifier) {
  return `
    <div class="screening-gallery" data-session-date="${sessionDate}" data-grid-identifier="${gridIdentifier}">
      <div class="screening-gallery-container">
        <!-- Low Magnification -->
        <div class="screening-gallery-column" data-mag="low">
          <h4>Low Magnification</h4>
          <div class="screening-image-viewer">
            <button class="gallery-nav gallery-nav-prev" aria-label="Previous image">
              <i class="fas fa-chevron-left"></i>
            </button>
            <div class="screening-image-container">
              <div class="screening-image-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
              </div>
            </div>
            <button class="gallery-nav gallery-nav-next" aria-label="Next image">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="screening-image-counter">
            <span class="current-index">0</span> / <span class="total-count">0</span>
          </div>
        </div>

        <!-- High Magnification -->
        <div class="screening-gallery-column" data-mag="high">
          <h4>High Magnification</h4>
          <div class="screening-image-viewer">
            <button class="gallery-nav gallery-nav-prev" aria-label="Previous image">
              <i class="fas fa-chevron-left"></i>
            </button>
            <div class="screening-image-container">
              <div class="screening-image-placeholder">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading...</p>
              </div>
            </div>
            <button class="gallery-nav gallery-nav-next" aria-label="Next image">
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
          <div class="screening-image-counter">
            <span class="current-index">0</span> / <span class="total-count">0</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize the screening gallery with data
 * @param {HTMLElement} galleryElement - The gallery container element
 */
export async function initScreeningGallery(galleryElement) {
  const sessionDate = galleryElement.dataset.sessionDate;
  const gridIdentifier = galleryElement.dataset.gridIdentifier;

  if (!sessionDate || !gridIdentifier) {
    showNoImagesMessage(galleryElement);
    return;
  }

  try {
    // Fetch image list from API
    const response = await fetch(
      `/api/screening-images/${sessionDate}/${gridIdentifier}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status}`);
    }

    const data = await response.json();

    // Store image data on the element
    galleryElement.imageData = {
      low: data.low || [],
      high: data.high || [],
      sessionDate: sessionDate,
      gridIdentifier: gridIdentifier,
      currentIndex: { low: 0, high: 0 },
    };

    // Check if both are empty
    if (
      galleryElement.imageData.low.length === 0 &&
      galleryElement.imageData.high.length === 0
    ) {
      showNoImagesMessage(galleryElement);
      return;
    }

    // Initialize both columns
    initGalleryColumn(galleryElement, "low");
    initGalleryColumn(galleryElement, "high");

    // Setup event listeners
    setupGalleryEventListeners(galleryElement);
  } catch (error) {
    console.error("Error loading screening images:", error);
    showNoImagesMessage(galleryElement, "Error loading images");
  }
}

/**
 * Initialize a single gallery column (low or high mag)
 * @param {HTMLElement} galleryElement - The gallery container
 * @param {string} mag - Magnification type ('low' or 'high')
 */
function initGalleryColumn(galleryElement, mag) {
  const column = galleryElement.querySelector(
    `.screening-gallery-column[data-mag="${mag}"]`,
  );
  const images = galleryElement.imageData[mag];
  const title = column.querySelector("h4");
  const viewer = column.querySelector(".screening-image-viewer");
  const counter = column.querySelector(".screening-image-counter");

  if (images.length === 0) {
    // Hide the title, viewer and counter, show simple text vertically centered
    title.style.display = "none";
    viewer.style.display = "none";
    counter.style.display = "none";
    const magLabel = mag === "low" ? "low" : "high";
    column.insertAdjacentHTML(
      "beforeend",
      `
      <div class="screening-no-images-wrapper">
        <p class="screening-no-images-text">No ${magLabel} magnification images uploaded</p>
      </div>
    `,
    );
    return;
  }

  const container = column.querySelector(".screening-image-container");
  const currentIndexEl = column.querySelector(".current-index");
  const totalCountEl = column.querySelector(".total-count");

  totalCountEl.textContent = images.length;

  // Display first image
  displayImage(galleryElement, mag, 0);
  updateNavigationButtons(galleryElement, mag);
}

/**
 * Display an image at the specified index
 * @param {HTMLElement} galleryElement - The gallery container
 * @param {string} mag - Magnification type
 * @param {number} index - Image index
 */
function displayImage(galleryElement, mag, index) {
  const { sessionDate, gridIdentifier } = galleryElement.imageData;
  const images = galleryElement.imageData[mag];
  const column = galleryElement.querySelector(
    `.screening-gallery-column[data-mag="${mag}"]`,
  );
  const container = column.querySelector(".screening-image-container");
  const currentIndexEl = column.querySelector(".current-index");

  if (index < 0 || index >= images.length) return;

  galleryElement.imageData.currentIndex[mag] = index;
  currentIndexEl.textContent = index + 1;

  const filename = images[index];
  const imageUrl = `/api/screening-images/${sessionDate}/${gridIdentifier}/${mag}/${filename}`;

  container.innerHTML = `
    <img 
      src="${imageUrl}" 
      alt="${mag} magnification image ${index + 1}"
      class="screening-image"
      data-filename="${filename}"
      loading="lazy"
    />
  `;

  // Add click handler for lightbox
  const img = container.querySelector("img");
  img.addEventListener("click", () =>
    openLightbox(imageUrl, filename, galleryElement, mag),
  );
}

/**
 * Update navigation button states
 * @param {HTMLElement} galleryElement - The gallery container
 * @param {string} mag - Magnification type
 */
function updateNavigationButtons(galleryElement, mag) {
  const images = galleryElement.imageData[mag];
  const currentIndex = galleryElement.imageData.currentIndex[mag];
  const column = galleryElement.querySelector(
    `.screening-gallery-column[data-mag="${mag}"]`,
  );
  const prevBtn = column.querySelector(".gallery-nav-prev");
  const nextBtn = column.querySelector(".gallery-nav-next");

  prevBtn.disabled = currentIndex <= 0;
  nextBtn.disabled = currentIndex >= images.length - 1;
}

/**
 * Navigate to previous/next image
 * @param {HTMLElement} galleryElement - The gallery container
 * @param {string} mag - Magnification type
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateImage(galleryElement, mag, direction) {
  const images = galleryElement.imageData[mag];
  const currentIndex = galleryElement.imageData.currentIndex[mag];
  const newIndex = currentIndex + direction;

  if (newIndex >= 0 && newIndex < images.length) {
    displayImage(galleryElement, mag, newIndex);
    updateNavigationButtons(galleryElement, mag);
  }
}

/**
 * Setup event listeners for gallery navigation
 * @param {HTMLElement} galleryElement - The gallery container
 */
function setupGalleryEventListeners(galleryElement) {
  // Navigation buttons
  ["low", "high"].forEach((mag) => {
    const column = galleryElement.querySelector(
      `.screening-gallery-column[data-mag="${mag}"]`,
    );
    const prevBtn = column.querySelector(".gallery-nav-prev");
    const nextBtn = column.querySelector(".gallery-nav-next");

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateImage(galleryElement, mag, -1);
    });

    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigateImage(galleryElement, mag, 1);
    });
  });
}

/**
 * Show "no images available" message
 * @param {HTMLElement} galleryElement - The gallery container
 * @param {string} message - Optional custom message
 */
function showNoImagesMessage(galleryElement, message = "No screening images") {
  galleryElement.innerHTML = `<p class="screening-no-images-text">${message}</p>`;
}

/**
 * Open lightbox to display image in larger view
 * @param {string} imageUrl - URL of the image
 * @param {string} filename - Filename for display
 * @param {HTMLElement} galleryElement - The gallery container element
 * @param {string} mag - Magnification type ('low' or 'high')
 */
function openLightbox(imageUrl, filename, galleryElement, mag) {
  // Create lightbox if it doesn't exist
  let lightbox = document.getElementById("screeningLightbox");

  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "screeningLightbox";
    lightbox.className = "screening-lightbox";
    lightbox.innerHTML = `
      <div class="screening-lightbox-content">
        <button class="screening-lightbox-close" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
        <div class="screening-lightbox-nav-container">
          <button class="screening-lightbox-nav screening-lightbox-prev" aria-label="Previous image">
            <i class="fas fa-chevron-left"></i>
          </button>
          <img src="" alt="" class="screening-lightbox-image" />
          <button class="screening-lightbox-nav screening-lightbox-next" aria-label="Next image">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <div class="screening-lightbox-caption"></div>
        <div class="screening-lightbox-counter"></div>
        <a href="" target="_blank" class="screening-lightbox-open-tab" title="Open in new tab">
          <i class="fas fa-external-link-alt"></i> Open in new tab
        </a>
      </div>
    `;
    document.body.appendChild(lightbox);

    // Close handlers
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    lightbox
      .querySelector(".screening-lightbox-close")
      .addEventListener("click", closeLightbox);

    // Navigation handlers
    lightbox
      .querySelector(".screening-lightbox-prev")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        navigateLightbox(-1);
      });

    lightbox
      .querySelector(".screening-lightbox-next")
      .addEventListener("click", (e) => {
        e.stopPropagation();
        navigateLightbox(1);
      });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("active")) return;

      if (e.key === "Escape") {
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        navigateLightbox(-1);
      } else if (e.key === "ArrowRight") {
        navigateLightbox(1);
      }
    });
  }

  // Store current lightbox state
  lightbox.galleryElement = galleryElement;
  lightbox.mag = mag;

  // Update lightbox content
  updateLightboxContent(lightbox);

  // Show lightbox
  lightbox.classList.add("active");
  document.body.classList.add("lightbox-open");
}

/**
 * Update lightbox content based on current state
 * @param {HTMLElement} lightbox - The lightbox element
 */
function updateLightboxContent(lightbox) {
  const galleryElement = lightbox.galleryElement;
  const mag = lightbox.mag;
  const { sessionDate, gridIdentifier, currentIndex } =
    galleryElement.imageData;
  const images = galleryElement.imageData[mag];
  const index = currentIndex[mag];

  const filename = images[index];
  const imageUrl = `/api/screening-images/${sessionDate}/${gridIdentifier}/${mag}/${filename}`;

  const img = lightbox.querySelector(".screening-lightbox-image");
  const caption = lightbox.querySelector(".screening-lightbox-caption");
  const counter = lightbox.querySelector(".screening-lightbox-counter");
  const openTabLink = lightbox.querySelector(".screening-lightbox-open-tab");
  const prevBtn = lightbox.querySelector(".screening-lightbox-prev");
  const nextBtn = lightbox.querySelector(".screening-lightbox-next");

  img.src = imageUrl;
  img.alt = filename;
  caption.textContent = filename;
  counter.textContent = `${index + 1} / ${images.length}`;
  openTabLink.href = imageUrl;

  // Update navigation button states
  prevBtn.disabled = index <= 0;
  nextBtn.disabled = index >= images.length - 1;
}

/**
 * Navigate to previous/next image in lightbox
 * @param {number} direction - -1 for previous, 1 for next
 */
function navigateLightbox(direction) {
  const lightbox = document.getElementById("screeningLightbox");
  if (!lightbox || !lightbox.galleryElement) return;

  const galleryElement = lightbox.galleryElement;
  const mag = lightbox.mag;

  // Use the existing navigateImage function to update the gallery state
  navigateImage(galleryElement, mag, direction);

  // Update lightbox display
  updateLightboxContent(lightbox);
}

/**
 * Close the lightbox
 */
function closeLightbox() {
  const lightbox = document.getElementById("screeningLightbox");
  if (lightbox) {
    lightbox.classList.remove("active");
    document.body.classList.remove("lightbox-open");
  }
}
