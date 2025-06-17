// This file contains the JavaScript code for the application, handling user interactions, form validation, and data management.

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date to today
    document.getElementById('sessionDate').value = new Date().toISOString().split('T')[0];

    // Mock user data (replace with database calls later)
    const userData = {
        'Alice Johnson': {
            initials: 'AJ',
            presets: {
                blotTime: 3.0,
                blotForce: 5,
                waitTime: 0.0,
                drainTime: 1.0,
                humidity: 95,
                temperature: 4,
                glowDischarge: true,
                glowCurrent: 15.0,
                glowTime: 60
            },
            nextBoxName: 'AJ_Box_001'
        },
        'Bob Smith': {
            initials: 'BS',
            presets: {
                blotTime: 2.5,
                blotForce: 4,
                waitTime: 0.5,
                drainTime: 1.5,
                humidity: 98,
                temperature: 4,
                glowDischarge: false,
                glowCurrent: '',
                glowTime: ''
            },
            nextBoxName: 'BS_Box_012'
        },
        'Carol Davis': {
            initials: 'CD',
            presets: {
                blotTime: 3.5,
                blotForce: 6,
                waitTime: 0.0,
                drainTime: 1.0,
                humidity: 92,
                temperature: 6,
                glowDischarge: true,
                glowCurrent: 20.0,
                glowTime: 45
            },
            nextBoxName: 'CD_Box_007'
        }
    };

    // Mock grid database - Master Grid List
    let gridDatabase = [];
    let nextGridId = 1;
    
    // User-specific grid data (simulates individual user sheets)
    let userGridData = {
        'AJ': [],
        'BS': [],
        'CD': []
    };

    // Glow discharge toggle
    document.getElementById('glowDischarge').addEventListener('change', function() {
        const settings = document.getElementById('glowDischargeSettings');
        settings.style.display = this.checked ? 'grid' : 'none';
    });

    function showAlert(message, type = 'success') {
        const container = document.getElementById('alertContainer');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        container.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    function validateForm() {
        const errors = [];

        if (!document.getElementById('gridBoxName').value.trim()) {
            errors.push('Please enter a grid box name before saving');
        }

        if (!document.getElementById('gridBatch').value.trim()) {
            errors.push('Please enter grid batch number of the grids you used before saving');
        }

        const glowDischarge = document.getElementById('glowDischarge').checked;
        const glowCurrent = document.getElementById('glowCurrent').value;
        const glowTime = document.getElementById('glowTime').value;

        if ((glowCurrent || glowTime) && !glowDischarge) {
            errors.push('You forgot to tick the Glow discharge box.');
        }

        if (glowDischarge && (!glowCurrent || !glowTime)) {
            errors.push('You forgot to enter the glow discharge values.');
        }

        const checkedGrids = document.querySelectorAll('.grid-checkbox:checked');
        if (checkedGrids.length === 0) {
            errors.push('You can only save once you added at least one grid. Maybe you forgot to click the tick box?');
        }

        const gridRows = document.querySelectorAll('tr[data-grid]');
        gridRows.forEach((row, index) => {
            const checkbox = row.querySelector('.grid-checkbox');
            const inputs = row.querySelectorAll('input:not(.grid-checkbox)');
            const hasData = Array.from(inputs).some(input => input.value.trim() !== '');
            
            if (hasData && !checkbox.checked) {
                errors.push(`Please tick the tick box for grid ${index + 1} before saving.`);
            }
        });

        return errors;
    }

    function loadPresets() {
        const userName = document.getElementById('userName').value;
        if (!userName) {
            showAlert('Please select a user first', 'error');
            return;
        }

        const user = userData[userName];
        if (!user) {
            showAlert('User data not found', 'error');
            return;
        }

        const presets = user.presets;
        document.getElementById('blotTime').value = presets.blotTime;
        document.getElementById('blotForce').value = presets.blotForce;
        document.getElementById('waitTime').value = presets.waitTime;
        document.getElementById('drainTime').value = presets.drainTime;
        document.getElementById('humidity').value = presets.humidity;
        document.getElementById('temperature').value = presets.temperature;
        document.getElementById('glowDischarge').checked = presets.glowDischarge;
        document.getElementById('glowCurrent').value = presets.glowCurrent;
        document.getElementById('glowTime').value = presets.glowTime;

        document.getElementById('glowDischargeSettings').style.display = 
            presets.glowDischarge ? 'grid' : 'none';

        document.getElementById('gridBoxName').value = user.nextBoxName;

        showAlert('Presets loaded successfully!');
    }

    function saveUpdate() {
        const errors = validateForm();
        if (errors.length > 0) {
            errors.forEach(error => showAlert(error, 'error'));
            return;
        }

        const userName = document.getElementById('userName').value;
        const userInitials = userData[userName]?.initials;
        const checkedGrids = document.querySelectorAll('.grid-checkbox:checked');
        let savedCount = 0;

        if (!userGridData[userInitials]) {
            userGridData[userInitials] = [];
        }

        checkedGrids.forEach(checkbox => {
            const row = checkbox.closest('tr');
            const gridData = {
                id: null,
                userName: userName,
                userInitials: userInitials,
                date: document.getElementById('sessionDate').value,
                boxName: document.getElementById('gridBoxName').value,
                batchNumber: document.getElementById('gridBatch').value,
                slot: row.querySelector('.grid-slot').value,
                sample: row.querySelector('.grid-sample').value,
                concentration: row.querySelector('.grid-conc').value,
                volume: row.querySelector('.grid-volume').value,
                incubation: row.querySelector('.grid-incubation').value,
                comments: row.querySelector('.grid-comments').value,
                settings: {
                    blotTime: document.getElementById('blotTime').value,
                    blotForce: document.getElementById('blotForce').value,
                    waitTime: document.getElementById('waitTime').value,
                    drainTime: document.getElementById('drainTime').value,
                    humidity: document.getElementById('humidity').value,
                    temperature: document.getElementById('temperature').value,
                    glowDischarge: document.getElementById('glowDischarge').checked,
                    glowCurrent: document.getElementById('glowCurrent').value,
                    glowTime: document.getElementById('glowTime').value
                },
                timestamp: new Date().toISOString()
            };

            userGridData[userInitials].push(gridData);
            savedCount++;
        });

        showAlert(`Successfully saved ${savedCount} grid(s) to user sheet!`);
        console.log('User Grid Data:', userGridData);
    }

    function saveToGridList() {
        const userName = document.getElementById('userName').value;
        if (!userName) {
            showAlert('Please select a user first', 'error');
            return;
        }

        const userInitials = userData[userName]?.initials;
        if (!userGridData[userInitials] || userGridData[userInitials].length === 0) {
            showAlert('No user grid data to save. Please save grids first using "Save & Update"', 'error');
            return;
        }

        let savedCount = 0;
        let updatedCount = 0;

        userGridData[userInitials].forEach(gridData => {
            if (rowHasData(gridData)) {
                let found = false;

                if (gridData.id && gridData.id !== null) {
                    const existingIndex = gridDatabase.findIndex(g => g.id === gridData.id);
                    if (existingIndex !== -1) {
                        gridDatabase[existingIndex] = { ...gridData };
                        found = true;
                        updatedCount++;
                    }
                }

                if (!found) {
                    gridData.id = getNextGridId();
                    gridDatabase.push({ ...gridData });
                    savedCount++;
                }
            }
        });

        showAlert(`Master Grid List updated! ${savedCount} new grids added, ${updatedCount} existing grids updated.`);
        console.log('Master Grid Database:', gridDatabase);
    }

    function rowHasData(gridData) {
        return gridData.sample || gridData.concentration || gridData.volume || 
               gridData.incubation || gridData.comments || gridData.slot;
    }

    function getNextGridId() {
        if (gridDatabase.length === 0) {
            return 1;
        }
        return Math.max(...gridDatabase.map(g => g.id)) + 1;
    }

    function viewGridDatabase() {
        const databaseView = document.getElementById('databaseView');
        const tableBody = document.getElementById('databaseTableBody');
        
        if (databaseView.style.display === 'none') {
            databaseView.style.display = 'block';
            updateDatabaseTable();
            document.querySelector('button[onclick="viewGridDatabase()"]').textContent = 'Hide Grid Database';
        } else {
            databaseView.style.display = 'none';
            document.querySelector('button[onclick="viewGridDatabase()"]').textContent = 'View Grid Database';
        }
    }

    function updateDatabaseTable() {
        const tableBody = document.getElementById('databaseTableBody');
        tableBody.innerHTML = '';

        if (gridDatabase.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 12;
            cell.textContent = 'No grids in database yet';
            cell.style.textAlign = 'center';
            cell.style.fontStyle = 'italic';
            cell.style.color = '#666';
            return;
        }

        gridDatabase.forEach(grid => {
            const row = tableBody.insertRow();
            
            row.insertCell(0).textContent = grid.id;
            row.insertCell(1).textContent = grid.userInitials;
            row.insertCell(2).textContent = grid.date;
            row.insertCell(3).textContent = grid.boxName;
            row.insertCell(4).textContent = grid.batchNumber;
            row.insertCell(5).textContent = grid.slot;
            row.insertCell(6).textContent = grid.sample;
            row.insertCell(7).textContent = grid.concentration;
            row.insertCell(8).textContent = grid.volume;
            row.insertCell(9).textContent = grid.incubation;
            row.insertCell(10).textContent = grid.comments;
            
            const actionsCell = row.insertCell(11);
            actionsCell.innerHTML = `
                <button onclick="editGrid(${grid.id})" style="background: #4facfe; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin: 2px;">Edit</button>
                <button onclick="deleteGrid(${grid.id})" style="background: #ff6b6b; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin: 2px;">Delete</button>
            `;
        });
    }

    function editGrid(gridId) {
        const grid = gridDatabase.find(g => g.id === gridId);
        if (!grid) return;

        document.getElementById('userName').value = grid.userName;
        document.getElementById('sessionDate').value = grid.date;
        document.getElementById('gridBoxName').value = grid.boxName;

        if (grid.settings) {
            document.getElementById('blotTime').value = grid.settings.blotTime;
            document.getElementById('blotForce').value = grid.settings.blotForce;
            document.getElementById('waitTime').value = grid.settings.waitTime;
            document.getElementById('drainTime').value = grid.settings.drainTime;
            document.getElementById('humidity').value = grid.settings.humidity;
            document.getElementById('temperature').value = grid.settings.temperature;
            document.getElementById('glowDischarge').checked = grid.settings.glowDischarge;
            document.getElementById('glowCurrent').value = grid.settings.glowCurrent;
            document.getElementById('glowTime').value = grid.settings.glowTime;
            
            document.getElementById('glowDischargeSettings').style.display = 
                grid.settings.glowDischarge ? 'grid' : 'none';
        }

        const gridRows = document.querySelectorAll('tr[data-grid]');
        for (let row of gridRows) {
            const checkbox = row.querySelector('.grid-checkbox');
            if (!checkbox.checked) {
                checkbox.checked = true;
                row.querySelector('.grid-slot').value = grid.slot;
                row.querySelector('.grid-sample').value = grid.sample;
                row.querySelector('.grid-conc').value = grid.concentration;
                row.querySelector('.grid-volume').value = grid.volume;
                row.querySelector('.grid-incubation').value = grid.incubation;
                row.querySelector('.grid-comments').value = grid.comments;
                break;
            }
        }

        showAlert(`Grid ${gridId} loaded for editing`);
        
        document.getElementById('databaseView').style.display = 'none';
        document.querySelector('button[onclick="viewGridDatabase()"]').textContent = 'View Grid Database';
        window.scrollTo(0, 0);
    }

    function deleteGrid(gridId) {
        if (confirm(`Are you sure you want to delete grid ${gridId}?`)) {
            const index = gridDatabase.findIndex(g => g.id === gridId);
            if (index !== -1) {
                gridDatabase.splice(index, 1);
                updateDatabaseTable();
                showAlert(`Grid ${gridId} deleted successfully`);
            }
        }
    }

    function nextBox() {
        const userName = document.getElementById('userName').value;
        if (!userName) {
            showAlert('Please select a user first', 'error');
            return;
        }

        document.querySelectorAll('tr[data-grid] input').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        document.getElementById('gridBoxName').value = '';

        const user = userData[userName];
        if (user) {
            document.getElementById('gridBoxName').value = user.nextBoxName;
        }

        showAlert('Prepared for next box!');
    }

    function clearForm() {
        if (confirm('Are you sure you want to clear all form data?')) {
            document.querySelectorAll('input, select').forEach(input => {
                if (input.type === 'checkbox') {
                    input.checked = false;
                } else if (input.type === 'date') {
                    input.value = new Date().toISOString().split('T')[0];
                } else {
                    input.value = '';
                }
            });

            document.getElementById('glowDischargeSettings').style.display = 'none';
            showAlert('Form cleared!');
        }
    }
});