# Stundenplan-Personal

Eine einfache Website zur Verwaltung von Personal-Stundenplänen mit Drag & Drop-Funktionalität.

## Version 0.1.0 - Grundfunktionen

### Implementierte Funktionen:

1. **CSV-Import**
   - Laden von Stundenplänen aus CSV-Dateien
   - Automatisches Parsen der Mitarbeiter und Klassenzuordnungen
   - Unterstützung für Windows- und Unix-Zeilenenden

2. **Tabellenansicht**
   - Horizontale Darstellung der Klassen als Spalten
   - Farbcodierte Header-Zellen für jede Klasse (25 unterscheidbare Farben)
   - Mitarbeiter werden mit farbigen Labels (border-left) ihrer Klasse zugeordnet
   - Tabelle nutzt die gesamte Bildschirmbreite mit horizontalem Scrollen

3. **Drag & Drop**
   - Mitarbeiter können per Drag & Drop zwischen Klassen verschoben werden
   - Nur Verschiebungen innerhalb desselben Zeitslots (Vormittag/Nachmittag) möglich
   - Visuelles Feedback während des Drag-Vorgangs

4. **Einstellungen-Sektion** (einklappbar)
   - **Datei-Upload**: CSV-Dateien hochladen
   - **Fehlend-Meldung**: Mitarbeiter als fehlend markieren (Autocomplete-Suche)
     - Fehlende Mitarbeiter verschwinden aus der Tabelle
     - Liste der fehlenden Mitarbeiter mit Entfernen-Button (×)
   - **Verschiebungen**: Anzeige aller effektiven Vertretungen
     - Zeigt nur Verschiebungen an, die sich von der ursprünglichen CSV unterscheiden
     - Format: `Vorm./Nachm. | Mitarbeiter: ursprüngliche_Klasse → neue_Klasse`
     - Farbcodierung basierend auf der Zielklasse

5. **Responsive Design**
   - Settings-Sektion mit 3 Spalten (Upload, Fehlend-Meldung, Verschiebungen)
   - Tabelle scrollt horizontal bei vielen Klassen
   - Mitarbeiter-Labels beginnen oben in der Zelle

## GitHub Pages

Diese Website wird auf [GitHub Pages](https://pages.github.com/) veröffentlicht:
https://randius.github.io/Stundenplan-Personal/

## Lokale Vorschau

Öffne einfach die `index.html` in deinem Browser oder nutze einen lokalen Server:

```bash
# Mit Python (falls installiert)
python3 -m http.server 8000
# Dann öffnen: http://localhost:8000
```

## Dateistruktur

```
.
├── index.html          # Haupt-HTML-Struktur
├── styles.css          # Alle CSS-Stile
├── script.js           # JavaScript-Logik
├── Stundenplan_Montag.csv  # Beispieldatei
└── README.md           # Diese Dokumentation
```

## CSV-Format

Die CSV-Datei sollte folgende Struktur haben:
- **Erste Zeile**: Mitarbeiternamen (durch Semikolon getrennt)
- **Folgende Zeilen**: Zeitslot;Klasse1;Klasse2;Klasse3;...

Beispiel:
```csv
;Max M.;Ulrike S.;Vincent W.;Max G.
Vormittag;1a;1b;1c;1d
Nachmittag;1a;1b;1c;1d
```

## Nächste Schritte (geplant)

- [ ] Export-Funktionalität (CSV/JSON)
- [ ] Speichern/Laden von Zuständen (LocalStorage)
- [ ] Mehrere Tage verwalten
- [ ] Benutzerdefinierte Farben für Klassen
- [ ] Filterfunktionen für die Tabelle
