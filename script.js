// Globale Variablen
let currentData = null;
let draggedItem = null;
let originalCell = null;
let missingEmployees = new Set();
let originalAssignments = {}; // Ursprüngliche Klassenzuordnungen: { employee: { timeSlot: className } }
let effectiveMoves = []; // Liste der effektiven Verschiebungen: { employee, fromClass, toClass, timeSlot }
let sortedClasses = []; // Global verfügbare Liste der sortierten Klassen
let classColorMap = {}; // Global verfügbare Map für Klassenname zu Farbindex

// Funktion zum Ein- und Ausklappen der Einstellungen
function toggleSettings() {
    const settingsContent = document.getElementById('settingsContent');
    const settingsToggle = document.getElementById('settingsToggle');
    
    if (settingsContent.classList.contains('hidden')) {
        settingsContent.classList.remove('hidden');
        settingsToggle.textContent = '\u2699\ufe0f Einstellungen ausblenden';
    } else {
        settingsContent.classList.add('hidden');
        settingsToggle.textContent = '\u2699\ufe0f Einstellungen einblenden';
    }
}

// Funktion zum Filtern der Mitarbeiter für Autocomplete
function filterEmployees(input) {
    if (!currentData || !currentData.employees) return [];
    
    const query = input.toLowerCase();
    return currentData.employees.filter(employee => 
        employee.toLowerCase().includes(query) && !missingEmployees.has(employee)
    );
}

// Funktion zum Anzeigen der Autocomplete-Vorschläge
function showSuggestions(suggestions, containerId, inputId, onSelectCallback) {
    const suggestionsContainer = document.getElementById(containerId);
    const inputElement = document.getElementById(inputId);
    suggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    suggestions.forEach(employee => {
        const div = document.createElement('div');
        div.textContent = employee;
        div.onclick = () => {
            onSelectCallback(employee);
            suggestionsContainer.classList.remove('show');
            inputElement.value = employee;
        };
        suggestionsContainer.appendChild(div);
    });
    
    suggestionsContainer.classList.add('show');
}

// Funktion zum Hinzufügen eines fehlenden Mitarbeiters
function addMissingEmployee(employeeName) {
    if (!missingEmployees.has(employeeName)) {
        missingEmployees.add(employeeName);
        updateMissingEmployeesList();
        updateMissingMarkings();
    }
}

// Funktion zum Entfernen eines fehlenden Mitarbeiters
function removeMissingEmployee(employeeName) {
    missingEmployees.delete(employeeName);
    updateMissingEmployeesList();
    updateMissingMarkings();
}

// Funktion zum Aktualisieren der Liste der fehlenden Mitarbeiter
function updateMissingEmployeesList() {
    const missingList = document.getElementById('missingEmployeesList');
    missingList.innerHTML = '';
    
    missingEmployees.forEach(employee => {
        const div = document.createElement('div');
        div.className = 'missing-employee';
        div.innerHTML = `
            ${employee}
            <span class="remove-missing" onclick="removeMissingEmployee('${employee}')">\u00d7</span>
        `;
        missingList.appendChild(div);
    });
}

// Funktion zum Aktualisieren der Fehlend-Markierungen in der Tabelle
function updateMissingMarkings() {
    if (!currentData) return;
    
    // Alle Mitarbeiter-Items durchgehen
    document.querySelectorAll('.employee-item').forEach(item => {
        const employeeName = item.dataset.employee;
        if (missingEmployees.has(employeeName)) {
            item.classList.add('missing');
        } else {
            item.classList.remove('missing');
        }
    });
}

// Funktion zum Aktualisieren der effektiven Verschiebungen
function updateEffectiveMoves() {
    if (!currentData || !originalAssignments || !sortedClasses || sortedClasses.length === 0) {
        return;
    }
    
    // Aktuelle Zuordnungen aus der Tabelle lesen
    const currentAssignments = {};
    document.querySelectorAll('td[data-class][data-time] .employee-item:not(.missing)').forEach(item => {
        const employee = item.dataset.employee;
        const className = item.parentElement.parentElement.dataset.class;
        const timeSlot = item.parentElement.parentElement.dataset.time;
        
        if (!currentAssignments[employee]) {
            currentAssignments[employee] = {};
        }
        currentAssignments[employee][timeSlot] = className;
    });
    
    // Effektive Verschiebungen berechnen
    effectiveMoves = [];
    for (const employee in currentAssignments) {
        for (const timeSlot in currentAssignments[employee]) {
            const currentClass = currentAssignments[employee][timeSlot];
            const originalAssignment = originalAssignments[employee]?.[timeSlot];
            
            if (originalAssignment && currentClass !== originalAssignment.className) {
                effectiveMoves.push({
                    employee: employee,
                    fromClass: originalAssignment.className,
                    toClass: currentClass,
                    timeSlot: originalAssignment.originalTimeSlot // Verwende den ursprünglichen Zeitslot
                });
            }
        }
    }
    
    updateMovesList();
}

// Funktion zum Aktualisieren der Verschiebungen-Liste
function updateMovesList() {
    const movesList = document.getElementById('movesList');
    if (!movesList) return;
    
    movesList.innerHTML = '';
    
    // Sortiere nach Zeit und dann nach Mitarbeiter
    const sortedMoves = [...effectiveMoves].sort((a, b) => {
        if (a.timeSlot !== b.timeSlot) {
            return a.timeSlot.localeCompare(b.timeSlot);
        }
        return a.employee.localeCompare(b.employee);
    });
    
    sortedMoves.forEach(move => {
        const div = document.createElement('div');
        div.className = 'move-entry';
        
        // Farbindex für die Zielklasse bestimmen
        let classIndex = 0;
        if (sortedClasses && sortedClasses.length > 0) {
            classIndex = sortedClasses.indexOf(move.toClass);
            if (classIndex === -1) classIndex = 0;
        }
        const color = getColorForIndex(classIndex % 25);
        
        div.innerHTML = `
            <div class="move-color" style="background-color: ${color}"></div>
            <div class="move-info">
                <span class="move-time">${move.timeSlot === 'Vormittag' ? 'Vorm.' : move.timeSlot === 'Nachmittag' ? 'Nachm.' : move.timeSlot}</span>
                <span>${move.employee}: ${move.fromClass} \u2192 ${move.toClass}</span>
            </div>
        `;
        movesList.appendChild(div);
    });
}

// Funktion zum Abrufen der Farbe für einen Index
function getColorForIndex(index) {
    const colors = [
        '#FF5722', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
        '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
        '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
        '#FF5722', '#F44336', '#E53935', '#D32F2F', '#B71C1C',
        '#795548', '#607D8B', '#546E7A', '#455A64', '#37474F'
    ];
    return colors[index % colors.length];
}

// Funktion zum Verarbeiten der hochgeladenen Datei
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    fileInfo.textContent = `Geladene Datei: ${file.name}`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        parseCSV(content);
    };
    reader.readAsText(file, 'UTF-8');
}

// Funktion zum Parsen der CSV-Datei
function parseCSV(content) {
    // Setze globale Variablen zurück
    originalAssignments = {};
    effectiveMoves = [];
    missingEmployees.clear();
    
    // Entferne BOM (Byte Order Mark) falls vorhanden
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }

    // Normalisiere Zeilenenden (Windows \r\n -> \n)
    content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length < 2) {
        alert('Ungültiges CSV-Format. Es werden mindestens 2 Zeilen erwartet (Header + Daten).');
        return;
    }

    // Parse Header (Mitarbeiternamen) - erste Zeile
    // Entferne leere erste Spalte falls vorhanden (wie in der Beispieldatei)
    const headerParts = lines[0].split(';').map(item => item.trim());
    const employees = headerParts.slice(headerParts[0] === '' ? 1 : 0).filter(item => item);
    
    // Parse Datenzeilen (ab Zeile 1)
    const timeSlots = [];
    const classAssignments = {};
    
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(';').map(item => item.trim());
        if (parts.length === 0) continue;
        
        // Erste Spalte ist die Tageszeit (kann leer sein, dann nimm die zweite)
        const timeSlot = parts[0] || parts[1];
        // Rest sind die Klassenzuordnungen für jeden Mitarbeiter
        // Falls erste Spalte leer war, starte bei Index 2, sonst bei 1
        const classes = parts.slice(parts[0] === '' ? 2 : 1);
        
        if (!timeSlot) continue;
        
        timeSlots.push(timeSlot);
        classAssignments[timeSlot] = {};
        
        // Jeder Mitarbeiter bekommt eine Klasse zugewiesen
        for (let j = 0; j < Math.min(classes.length, employees.length); j++) {
            const className = classes[j];
            const employeeName = employees[j];
            
            if (!className || !employeeName) continue;
            
            if (!classAssignments[timeSlot][className]) {
                classAssignments[timeSlot][className] = [];
            }
            
            classAssignments[timeSlot][className].push(employeeName);
            
            // Speichere die ursprüngliche Zuordnung (normalisiere den timeSlot zu lowercase, aber speichere auch den ursprünglichen)
            if (!originalAssignments[employeeName]) {
                originalAssignments[employeeName] = {};
            }
            originalAssignments[employeeName][timeSlot.toLowerCase()] = {
                className: className,
                originalTimeSlot: timeSlot // Speichere den ursprünglichen Zeitslot (z.B. "Vormittag")
            };
        }
    }

    // Speichere die Daten und generiere die Tabelle
    currentData = {
        employees: employees,
        timeSlots: timeSlots,
        assignments: classAssignments
    };

    fileInfo.textContent = `Geladene Datei: ${employees.length} Mitarbeiter, ${timeSlots.length} Zeitslots`;
    generateTable();
    setupDragAndDrop();
    
    // Aktualisiere die Listen
    updateMissingEmployeesList();
    
    // Fülle die Dropdowns für die direkte Verschiebung
    fillTargetClassDropdown();
    
    // Aktualisiere die Verschiebungen-Liste (wird in generateTable aufgerufen)
    setTimeout(updateEffectiveMoves, 100);
}

// Funktion zum Füllen des Zielklasse-Dropdowns
function fillTargetClassDropdown() {
    const targetClassSelect = document.getElementById('targetClassSelect');
    if (!targetClassSelect || !sortedClasses || sortedClasses.length === 0) return;
    
    targetClassSelect.innerHTML = '<option value="">Klasse auswählen</option>';
    sortedClasses.forEach(className => {
        const option = document.createElement('option');
        option.value = className;
        option.textContent = className;
        targetClassSelect.appendChild(option);
    });
}

// Funktion zum Generieren der Tabelle
function generateTable() {
    if (!currentData) return;

    const header = document.getElementById('tableHeader');
    const body = document.getElementById('tableBody');

    // Header generieren
    // Sammle alle einzigartigen Klassen
    const allClasses = new Set();
    for (const timeSlot of currentData.timeSlots) {
        for (const className of Object.keys(currentData.assignments[timeSlot])) {
            allClasses.add(className);
        }
    }

    // Sortiere Klassen (1a, 1b, 1c, 1d, etc.)
    sortedClasses = Array.from(allClasses).sort((a, b) => {
        // Einfache Sortierung nach Klassennamen
        return a.localeCompare(b, undefined, { numeric: true });
    });

    // Erstelle eine Map für Klassenname zu Farbindex
    classColorMap = {};
    for (let i = 0; i < sortedClasses.length; i++) {
        classColorMap[sortedClasses[i]] = i % 25;
    }

    // Header-Zellen für Klassen in einer einzigen Zeile
    let headerRow = '<tr>';
    for (let i = 0; i < sortedClasses.length; i++) {
        const className = sortedClasses[i];
        const colorIndex = classColorMap[className];
        headerRow += `<th class="header-cell color-${colorIndex}">${className}</th>`;
    }
    headerRow += '</tr>';
    header.innerHTML = headerRow;

    // Tabelle Körper generieren
    body.innerHTML = '';

    // Für jede Tageszeit eine Zeile
    for (const timeSlot of currentData.timeSlots) {
        const cellClass = timeSlot === 'Vormittag' ? 'morning-cell' : 'afternoon-cell';
        
        let row = `<tr>`;
        
        for (const className of sortedClasses) {
            const employeesInClass = currentData.assignments[timeSlot] && currentData.assignments[timeSlot][className] ? 
                                    currentData.assignments[timeSlot][className] : [];
            
            const cellId = `${timeSlot.toLowerCase()}-${className}`;
            const colorIndex = classColorMap[className];
            
            row += `<td class="${cellClass}" data-class="${className}" data-time="${timeSlot.toLowerCase()}">`;
            row += `<ul class="employee-list" id="${cellId}">`;
            
            for (const employee of employeesInClass) {
                row += `<li class="employee-item color-${colorIndex}" draggable="true" data-employee="${employee}" data-original-class="${className}">${employee}</li>`;
            }
            
            row += '</ul></td>';
        }
        
        row += '</tr>';
        body.innerHTML += row;
    }
    
    // Nach dem Generieren der Tabelle die Fehlend-Markierungen aktualisieren
    updateMissingMarkings();
}

// Funktion zum Bestimmen der Farbklasse basierend auf dem Index
function getColorClass(index) {
    return `color-${index % 25}`;
}

// Funktion zum Verschieben eines Mitarbeiters in eine andere Klasse
function moveEmployeeToClass(employeeName, targetClass, timeSlot) {
    if (!currentData || !employeeName || !targetClass || !timeSlot) return;
    
    // Normalisiere den timeSlot (z. B. "Vormittag" -> "vormittag")
    const normalizedTimeSlot = timeSlot.toLowerCase();
    
    // Finde die aktuelle Zelle des Mitarbeiters
    let currentCell = null;
    let currentList = null;
    let currentEmployeeItem = null;
    
    document.querySelectorAll('td[data-class][data-time] .employee-item').forEach(item => {
        if (item.dataset.employee === employeeName && item.parentElement.parentElement.dataset.time === normalizedTimeSlot) {
            currentEmployeeItem = item;
            currentList = item.parentElement;
            currentCell = item.parentElement.parentElement;
        }
    });
    
    if (!currentEmployeeItem || !currentList || !currentCell) {
        alert(`Mitarbeiter "${employeeName}" nicht gefunden im Zeitslot "${timeSlot}".`);
        return;
    }
    
    // Finde die Zielzelle
    const targetCellSelector = `td[data-class="${targetClass}"][data-time="${normalizedTimeSlot}"]`;
    const targetCell = document.querySelector(targetCellSelector);
    const targetList = targetCell ? targetCell.querySelector('.employee-list') : null;
    
    if (!targetCell || !targetList) {
        alert(`Zielklasse "${targetClass}" nicht gefunden im Zeitslot "${timeSlot}".`);
        return;
    }
    
    // Entferne den Mitarbeiter aus der aktuellen Zelle
    currentEmployeeItem.remove();
    
    // Behalte die bestehende Farbklasse des Mitarbeiters bei (von der ursprünglichen Klasse)
    const currentColorClass = Array.from(currentEmployeeItem.classList).find(cls => cls.startsWith('color-')) || 'color-0';
    currentEmployeeItem.className = `employee-item ${currentColorClass}`;
    currentEmployeeItem.dataset.originalClass = targetClass;
    targetList.appendChild(currentEmployeeItem);
    
    // Aktualisiere die Fehlend-Markierungen und Verschiebungen
    setTimeout(updateMissingMarkings, 50);
    setTimeout(updateEffectiveMoves, 100);
    
    // Setze die Eingabefelder zurück
    document.getElementById('moveEmployeeInput').value = '';
    document.getElementById('targetClassSelect').value = '';
    document.getElementById('timeSlotSelect').value = '';
}

// Drag & Drop Funktionalität für Mitarbeiter
function setupDragAndDrop() {
    const employeeItems = document.querySelectorAll('.employee-item');
    const cells = document.querySelectorAll('td[data-class][data-time]');

    // Drag Start
    employeeItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            originalCell = this.parentElement.parentElement;
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', this.dataset.employee);
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
            originalCell = null;
            // Entferne drop-target Klasse von allen Zellen
            cells.forEach(cell => cell.classList.remove('drop-target'));
            // Aktualisiere die Fehlend-Markierungen nach dem Drag
            setTimeout(updateMissingMarkings, 50);
        });
    });

    // Drag Over
    cells.forEach(cell => {
        cell.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            // Prüfe, ob die Drop-Zelle zur gleichen Tageszeit gehört wie die Ursprungszelle
            if (originalCell && originalCell.dataset.time === this.dataset.time) {
                this.classList.add('drop-target');
            }
        });

        cell.addEventListener('dragleave', function() {
            this.classList.remove('drop-target');
        });

        cell.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drop-target');
            
            // Prüfe, ob die Drop-Zelle zur gleichen Tageszeit gehört wie die Ursprungszelle
            if (!originalCell || originalCell.dataset.time !== this.dataset.time) {
                return;
            }

            if (draggedItem) {
                // Entferne den Mitarbeiter aus der ursprünglichen Zelle
                draggedItem.remove();
                
                // Füge den Mitarbeiter zur neuen Zelle hinzu
                const newList = this.querySelector('.employee-list');
                if (newList) {
                    newList.appendChild(draggedItem);
                    // Nach dem Verschieben die Sortierung aktualisieren
                    setTimeout(updateMissingMarkings, 50);
                }
                
                // Aktualisiere die Liste der effektiven Verschiebungen
                setTimeout(updateEffectiveMoves, 100);
            }
        });
    });
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    // Drag & Drop Upload für CSV-Datei
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    
    // Autocomplete für fehlende Mitarbeiter
    const missingEmployeeInput = document.getElementById('missingEmployeeInput');
    let autocompleteTimeout;
    
    missingEmployeeInput.addEventListener('input', function() {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            const suggestions = filterEmployees(this.value);
            showSuggestions(suggestions, 'missingEmployeeSuggestions', 'missingEmployeeInput', addMissingEmployee);
        }, 200);
    });
    
    missingEmployeeInput.addEventListener('blur', function() {
        setTimeout(() => {
            document.getElementById('missingEmployeeSuggestions').classList.remove('show');
        }, 200);
    });
    
    missingEmployeeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const suggestions = filterEmployees(this.value);
            if (suggestions.length > 0) {
                addMissingEmployee(suggestions[0]);
                this.value = '';
                document.getElementById('missingEmployeeSuggestions').classList.remove('show');
            }
        }
    });

    // Autocomplete für direkte Verschiebung
    const moveEmployeeInput = document.getElementById('moveEmployeeInput');
    moveEmployeeInput.addEventListener('input', function() {
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            const suggestions = filterEmployees(this.value);
            showSuggestions(suggestions, 'moveEmployeeSuggestions', 'moveEmployeeInput', (employee) => {
                moveEmployeeInput.value = employee;
            });
        }, 200);
    });
    
    moveEmployeeInput.addEventListener('blur', function() {
        setTimeout(() => {
            document.getElementById('moveEmployeeSuggestions').classList.remove('show');
        }, 200);
    });

    // Button für direkte Verschiebung
    const moveEmployeeButton = document.getElementById('moveEmployeeButton');
    moveEmployeeButton.addEventListener('click', function() {
        const employeeInput = document.getElementById('moveEmployeeInput');
        const targetClassSelect = document.getElementById('targetClassSelect');
        const timeSlotSelect = document.getElementById('timeSlotSelect');
        
        const employeeName = employeeInput.value.trim();
        const targetClass = targetClassSelect.value;
        const timeSlot = timeSlotSelect.value;
        
        if (!employeeName || !targetClass || !timeSlot) {
            alert('Bitte wählen Sie einen Mitarbeiter, eine Zielklasse und einen Zeitslot aus.');
            return;
        }
        
        // Überprüfe, ob der Mitarbeiter existiert
        if (!currentData.employees.includes(employeeName)) {
            alert(`Mitarbeiter "${employeeName}" nicht gefunden.`);
            return;
        }
        
        moveEmployeeToClass(employeeName, targetClass, timeSlot);
    });

    // Drag Over Event für Upload-Bereich
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && (files[0].type === 'text/csv' || files[0].name.endsWith('.csv'))) {
            handleFileUpload({ target: { files: files } });
        }
    });

    // Klick auf Upload-Bereich öffnet Dateiauswahl
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });

    // Lade die Beispieldatei automatisch beim Start
    fetch('Stundenplan_Montag.csv')
        .then(response => response.text())
        .then(content => {
            parseCSV(content);
        })
        .catch(error => {
            console.log('Beispieldatei konnte nicht geladen werden:', error);
            // Zeige eine Nachricht an
            fileInfo.textContent = 'Laden Sie eine CSV-Datei hoch, um zu beginnen';
        });
});
