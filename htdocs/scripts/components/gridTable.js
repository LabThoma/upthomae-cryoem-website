// This file manages the grid table functionality, including setting up the grid table and handling grid-related events.
// It exports functions like setupGridTable and clearGridTable.

export function setupGridTable() {
  const tbody = document.querySelector(".grid-table tbody");
  if (!tbody) return;

  // Clear any existing rows
  tbody.innerHTML = "";

  // Generate 4 identical rows with different slot numbers
  for (let i = 1; i <= 4; i++) {
    const tr = document.createElement("tr");
    tr.setAttribute("data-grid", i);
    tr.setAttribute("data-slot", i);

    tr.innerHTML = `
      <td>${i}</td>
      <td><input type="checkbox" class="grid-checkbox" /></td>
      <td><input type="text" class="grid-comments" placeholder="Notes" /></td>
      <td><input type="number" class="grid-volume" step="0.1" placeholder="Override" /></td>
      <td><input type="number" class="grid-blot-time" placeholder="Override" /></td>
      <td><input type="number" class="grid-blot-force" placeholder="Override" /></td>
      <td><input type="text" class="grid-batch-override" placeholder="Override" /></td>
      <td><input type="text" class="grid-additives" step="0.1" placeholder="Override" /></td>
    `;

    tbody.appendChild(tr);
  }
}

export function clearGridTable() {
  const tbody = document.querySelector(".grid-table tbody");
  if (tbody) {
    tbody.innerHTML = "";
  }
}
