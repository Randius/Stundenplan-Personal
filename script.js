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
        settingsToggle.textContent = '⚙️ Einstellungen ausblenden';
    } else {
        settingsContent.classList.add('hidden');
        settingsToggle.textContent = '⚙️ Einstellungen einblenden';
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
function showSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('missingEmployeeSuggestions');
    suggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionsContainer.classList.remove('show');
        return;
    }
    
    suggestions.forEach(employee => {
        const div = document.createElement('div');
        div.textContent = employee;
        div.onclick = () => {
            addMissingEmployee(employee);
            suggestionsContainer.classList.remove('show');
            document.getElementById('missingEmployeeInput').value = '';
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
        updateTableVisibility();
    }
}

// Funktion zum Entfernen eines fehlenden Mitarbeiters
function removeMissingEmployee(employeeName) {
    missingEmployees.delete(employeeName);
    updateMissingEmployeesList();
    updateTableVisibility();
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
            <span class="remove-missing" onclick="removeMissingEmployee('${employee}')">×</span>
        `;
        missingList.appendChild(div);
    });
}

// Funktion zum Aktualisieren der Tabellensichtbarkeit
function updateTableVisibility() {
    if (!currentData) return;
    
    // Alle Mitarbeiter-Labels durchgehen und fehlende ausblenden
    document.querySelectorAll('.employee-item').forEach(item => {
        const employeeName = item.dataset.employee;
        if (missingEmployees.has(employeeName)) {
            item.style.display = 'none';
        } else {
            item.style.display = 'list-item';
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
    document.querySelectorAll('td[data-class][data-time] .employee-item').forEach(item => {
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
            const originalClass = originalAssignments[employee]?.[timeSlot];
            
            if (originalClass && currentClass !== originalClass) {
                effectiveMoves.push({
                    employee: employee,
                    fromClass: originalClass,
                    toClass: currentClass,
                    timeSlot: timeSlot
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
                <span class="move-time">${move.timeSlot === 'Vormittag' ? 'Vorm.' : 'Nachm.'}</span>
                <span>${move.employee}: ${move.fromClass} → ${move.toClass}</span>
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
            
            // Speichere die ursprüngliche Zuordnung
            if (!originalAssignments[employeeName]) {
                originalAssignments[employeeName] = {};
            }
            originalAssignments[employeeName][timeSlot] = className;
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
    
    // Setze effektive Verschiebungen zurück und aktualisiere
    effectiveMoves = [];
    setTimeout(updateEffectiveMoves, 100);
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
        const timeSlotDe = timeSlot === 'Vormittag' ? 'Vormittag' : 
                           timeSlot === 'Nachmittag' ? 'Nachmittag' : 
                           timeSlot;
        const cellClass = timeSlot === 'Vormittag' ? 'morning-cell' : 'afternoon-cell';
        const timeDe = timeSlot === 'Vormittag' ? 'Vormittag' : 'Nachmittag';
        
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
}

// Funktion zum Bestimmen der Farbklasse basierend auf dem Index
function getColorClass(index) {
    return `color-${index % 25}`;
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
            showSuggestions(suggestions);
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
