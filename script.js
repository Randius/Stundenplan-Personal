// Globale Variablen
let currentData = null;
let draggedItem = null;
let originalCell = null;

// Drag & Drop Upload für CSV-Datei
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');

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
    const sortedClasses = Array.from(allClasses).sort((a, b) => {
        // Einfache Sortierung nach Klassennamen
        return a.localeCompare(b, undefined, { numeric: true });
    });

    // Header-Zellen für Klassen in einer einzigen Zeile
    let headerRow = '<tr>';
    for (const className of sortedClasses) {
        const classColor = getClassColor(className);
        headerRow += `<th class="header-cell ${classColor}">${className}</th>`;
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
            const classColor = getClassColor(className);
            
            row += `<td class="${cellClass}" data-class="${className}" data-time="${timeSlot.toLowerCase()}">`;
            row += `<ul class="employee-list" id="${cellId}">`;
            
            for (const employee of employeesInClass) {
                row += `<li class="employee-item ${classColor}" draggable="true" data-employee="${employee}" data-original-class="${className}">${employee}</li>`;
            }
            
            row += '</ul></td>';
        }
        
        row += '</tr>';
        body.innerHTML += row;
    }
}

// Funktion zum Bestimmen der Klassenfarbe
function getClassColor(className) {
    const colors = {
        '1a': 'class-1a',
        '1b': 'class-1b',
        '1c': 'class-1c',
        '1d': 'class-1d',
        '2a': 'class-2a',
        '2b': 'class-2b',
        '2c': 'class-2c',
        '2d': 'class-2d',
        '3a': 'class-3a',
        '3b': 'class-3b',
        '3c': 'class-3c',
        '3d': 'class-3d'
    };
    return colors[className.toLowerCase()] || 'class-1a';
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
            }
        });
    });
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
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
