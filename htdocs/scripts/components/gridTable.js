// This file manages the grid table functionality, including setting up the grid table and handling grid-related events.
// It exports functions like setupGridTable and clearGridTable.

// Fetch all available grid batches for the override dropdown
async function fetchAllGridBatches() {
  try {
    // Get all grid types first
    const typesResponse = await fetch("/api/grid-types/summary");
    if (!typesResponse.ok) {
      throw new Error("Failed to fetch grid types");
    }
    const gridTypes = await typesResponse.json();

    // Fetch batches for each grid type and combine them
    const allBatches = [];

    for (const gridType of gridTypes) {
      try {
        const batchesResponse = await fetch(
          `/api/grid-types/batches?type=${encodeURIComponent(
            gridType.grid_type_name
          )}`
        );
        if (batchesResponse.ok) {
          const batches = await batchesResponse.json();
          allBatches.push(...batches);
        }
      } catch (error) {
        console.warn(
          `Failed to fetch batches for ${gridType.grid_type_name}:`,
          error
        );
      }
    }

    // Remove duplicates and sort by q_number
    const uniqueBatches = allBatches.filter(
      (batch, index, self) =>
        index === self.findIndex((b) => b.q_number === batch.q_number)
    );

    return uniqueBatches.sort((a, b) =>
      (a.q_number || "").localeCompare(b.q_number || "")
    );
  } catch (error) {
    console.error("Error fetching all grid batches:", error);
    return [];
  }
}

// Create a grid batch override dropdown
function createGridBatchOverrideDropdown(batches) {
  const select = document.createElement("select");
  select.className = "grid-batch-override";

  // Add default empty option to match other dropdowns
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Override";
  select.appendChild(defaultOption);

  // Add all available batches
  batches.forEach((batch) => {
    if (batch.q_number) {
      const option = document.createElement("option");
      option.value = batch.q_number;
      option.textContent = `${batch.q_number} (${
        batch.remaining_grids || 0
      } left)`;
      select.appendChild(option);
    }
  });

  // Add custom option
  const customOption = document.createElement("option");
  customOption.value = "__custom__";
  customOption.textContent = "+ Enter Custom";
  select.appendChild(customOption);

  return select;
}

// Create a custom input field for grid batch override
function createGridBatchOverrideInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "grid-batch-override-custom";
  input.placeholder = "Enter Q Number";
  input.style.display = "none";
  return input;
}

export async function setupGridTable() {
  const tbody = document.querySelector(".grid-table tbody");
  if (!tbody) return;

  // Clear any existing rows
  tbody.innerHTML = "";

  // Fetch all grid batches for the override dropdowns
  const allBatches = await fetchAllGridBatches();

  // Generate 4 identical rows with different slot numbers
  for (let i = 1; i <= 4; i++) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-grid", i);
    tr.setAttribute("data-slot", i);

    // Create the basic row structure
    tr.innerHTML = `
      <td>${i}</td>
      <td><input type="checkbox" class="grid-checkbox" /></td>
      <td><input type="text" class="grid-comments" placeholder="Notes" /></td>
      <td><input type="number" class="grid-volume" step="0.1" placeholder="Override" /></td>
      <td><input type="number" class="grid-blot-time" placeholder="Override" /></td>
      <td><input type="number" class="grid-blot-force" placeholder="Override" /></td>
      <td class="grid-batch-cell"></td>
      <td><input type="text" class="grid-additives" step="0.1" placeholder="Override" /></td>
    `;

    // Create and add the grid batch override dropdown and custom input
    const gridBatchCell = tr.querySelector(".grid-batch-cell");

    const gridBatchDropdown = createGridBatchOverrideDropdown(allBatches);
    const gridBatchCustomInput = createGridBatchOverrideInput();

    // Event listener for dropdown changes
    gridBatchDropdown.addEventListener("change", () => {
      if (gridBatchDropdown.value === "__custom__") {
        gridBatchDropdown.style.display = "none";
        gridBatchCustomInput.style.display = "inline-block";
        gridBatchCustomInput.focus();
      } else if (gridBatchDropdown.value === "") {
        // No selection (placeholder) - remove selected state to use default styling
        gridBatchDropdown.classList.remove("selected-state");
      } else {
        // Valid selection - use normal text styling
        gridBatchDropdown.classList.add("selected-state");
      }
    });

    gridBatchCell.appendChild(gridBatchDropdown);
    gridBatchCell.appendChild(gridBatchCustomInput);

    tbody.appendChild(tr);
  }
}

export function clearGridTable() {
  const tbody = document.querySelector(".grid-table tbody");
  if (tbody) {
    tbody.innerHTML = "";
  }
}
