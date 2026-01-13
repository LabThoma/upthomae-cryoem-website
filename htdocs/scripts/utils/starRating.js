// Star Rating Utility Functions
// This file contains reusable star rating functionality

/**
 * Renders a read-only star rating display
 * @param {number|string} value - The rating value (0-5)
 * @param {string} emptySymbol - Symbol for empty stars (default: ☆)
 * @param {string} filledSymbol - Symbol for filled stars (default: ★)
 * @returns {string} HTML string for the star display
 */
export function renderStarRating(value, emptySymbol = "☆", filledSymbol = "★") {
  // Handle null, undefined, or empty values
  if (value === null || value === undefined || value === "") {
    return `<div class="star-display empty-rating">—</div>`;
  }

  const numValue = parseInt(value) || 0;
  let starsHtml = "";

  for (let i = 1; i <= 5; i++) {
    if (i <= numValue) {
      starsHtml += `<span class="star filled">${filledSymbol}</span>`;
    } else {
      starsHtml += `<span class="star empty">${emptySymbol}</span>`;
    }
  }

  return `<div class="star-display">${starsHtml}</div>`;
}

/**
 * Renders an interactive star rating input
 * @param {string} fieldName - The field name for the hidden input
 * @param {string} identifier - Unique identifier (like slot number)
 * @param {number} initialValue - Initial rating value
 * @returns {string} HTML string for the interactive star rating
 */
export function renderInteractiveStarRating(
  fieldName,
  identifier,
  initialValue = 0
) {
  let starsHtml = "";
  for (let i = 1; i <= 5; i++) {
    starsHtml += `<span class="star" data-value="${i}">★</span>`;
  }

  return `
    <div class="star-rating" data-field="${fieldName}" data-slot="${identifier}">
      ${starsHtml}
      <input type="hidden" name="${fieldName}[]" value="${initialValue}">
    </div>
  `;
}

/**
 * Sets up interactive star rating functionality for elements on the page
 */
export function setupStarRatings() {
  const starRatings = document.querySelectorAll(".star-rating");

  starRatings.forEach((rating) => {
    const stars = rating.querySelectorAll(".star");
    const hiddenInput = rating.querySelector('input[type="hidden"]');

    // Initialize visual state based on current value
    const initialValue = parseInt(hiddenInput.value) || 0;
    if (initialValue > 0) {
      highlightStars(rating, initialValue);
    }

    stars.forEach((star) => {
      // Add hover effect
      star.addEventListener("mouseenter", () => {
        const value = parseInt(star.dataset.value);
        highlightStars(rating, value);
      });

      // Click to set rating
      star.addEventListener("click", () => {
        const value = parseInt(star.dataset.value);
        setStarRating(rating, value);
        hiddenInput.value = value;
      });
    });

    // Reset on mouse leave
    rating.addEventListener("mouseleave", () => {
      const currentValue = parseInt(hiddenInput.value);
      highlightStars(rating, currentValue);
    });
  });
}

/**
 * Highlights stars up to the given value
 * @param {Element} ratingContainer - The star rating container element
 * @param {number} value - The value to highlight up to
 */
function highlightStars(ratingContainer, value) {
  const stars = ratingContainer.querySelectorAll(".star");
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add("active");
      star.classList.remove("inactive");
    } else {
      star.classList.remove("active");
      star.classList.add("inactive");
    }
  });
}

/**
 * Updates the visual state of all star ratings on the page based on their current values
 * Useful for updating display after programmatically setting values
 */
export function updateAllStarRatingsVisuals() {
  const starRatings = document.querySelectorAll(".star-rating");
  starRatings.forEach((rating) => {
    const hiddenInput = rating.querySelector('input[type="hidden"]');
    const currentValue = parseInt(hiddenInput?.value) || 0;
    if (currentValue > 0) {
      highlightStars(rating, currentValue);
    }
  });
}

/**
 * Sets the star rating value
 * @param {Element} ratingContainer - The star rating container element
 * @param {number} value - The value to set
 */
function setStarRating(ratingContainer, value) {
  const hiddenInput = ratingContainer.querySelector('input[type="hidden"]');
  hiddenInput.value = value;
  highlightStars(ratingContainer, value);
}
