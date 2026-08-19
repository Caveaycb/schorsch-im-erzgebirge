# Technische Architektur

Das Spiel bleibt ein Browserprojekt ohne Build-Schritt oder externe Laufzeitbibliotheken. Die Module registrieren ihre öffentliche API unter `window.SchorschGame` und werden in einer festen Reihenfolge aus `index.html` geladen. Dadurch funktioniert weiterhin sowohl ein lokaler Webserver als auch das direkte Öffnen der HTML-Datei.

## Modulübersicht

| Datei | Verantwortung |
| --- | --- |
| `src/game-data.js` | Levelmetadaten, Reiseaufträge, Musikdefinitionen, Gegenstände, Talente und Geheimlevel-Layouts |
| `src/stickers.js` | Katalog der 100 Sticker, Energiekategorien, Seltenheiten, Normalisierung und duplikatfreie Belohnungsreihenfolge |
| `src/physics.js` | Kollisionen, regionale Kräfte, Bewegungstuning, Landungsfeedback und deterministische Mathematikhelfer |
| `src/progression.js` | Medaillenkriterien, Gesamtfortschritt und Kapitelbelohnungen |
| `src/save-system.js` | versioniertes Speicherschema, Migration sowie Import und Export |
| `src/rendering.js` | Canvas-Renderer für Kulissen, Welt, Gegenstände, Effekte und Renderleistung |
| `src/render-player.js` | Figuren-, Bewegungs-, Tauch- und Itemdarstellung sowie Vorschauen |
| `src/audio.js` | AudioContext, regionale Musik, Instrumentstimmen, Soundeffekte und Abschlussjingles |
| `src/ui.js` | zentrale DOM-Registry und allgemeine Formatierung |
| `src/ui-actions.js` | HUD, Missionsanzeige, Inventar, Stickeralbum, Talentbaum, Shop, Levelkarte und UI-Aktionen |
| `src/debug.js` | FPS-Messung, Hitboxdarstellung, Zustandsanzeige und Checkpoint-Sprünge |
| `game.js` | Spielzustand, Levelaufbau, Missionsablauf, Eingaben, Kollisionen und Hauptschleife |
| `tests/smoke.js` | automatisierte, abhängigkeitfreie Browser-Smoke-Tests |
| `tests/e2e.js` | isolierte Durchlauftests für alle Level, Medaillen, Kapitelbelohnungen und Bosse |

## Laufzeitfluss

1. `index.html` lädt Daten und Modul-Factories.
2. `game.js` erzeugt den zentralen Spielzustand und verbindet die Module über kleine Runtime-Objekte.
3. Die Hauptschleife aktualisiert Physik und Spielregeln.
4. Der Renderer zeichnet die aktuelle Welt; das Debugmodul zeichnet optional darüber.
5. UI- und Audio-Module reagieren über ihre klar abgegrenzten öffentlichen Methoden.

## Erweiterungsregeln

- Neue Leveldaten und Reiseaufträge gehören nach `src/game-data.js`.
- Neue Stickermotive werden zentral in `src/stickers.js` katalogisiert und als optimierte PNG-Datei unter `assets/stickers/` abgelegt.
- Neue Bewegungskräfte oder Kollisionshelfer gehören nach `src/physics.js` und sollten durch einen Smoke-Test abgesichert werden.
- Welt- und Kulissenfunktionen bleiben in `src/rendering.js`; Figuren-, Bewegungs- und Itemdarstellung gehört nach `src/render-player.js`.
- Neue Meisterschaftskriterien und Kapitelbelohnungen gehören nach `src/progression.js`; Änderungen am Speicherformat benötigen eine Migration in `src/save-system.js`.
- Neue Klänge oder Musikstimmen werden ausschließlich in `src/audio.js` ergänzt.
- DOM-Abfragen gehören in `src/ui.js`; komplexe Ansichten und Interaktionen in `src/ui-actions.js`.
- `game.js` soll nur koordinieren oder Regeln enthalten, die mehrere Systeme verbinden.

## Debugging

`F3` schaltet das Overlay ein. Es zeigt FPS, Level, Position, Geschwindigkeit, Bewegungszustand und Bodenkontakt. Zusätzlich erscheinen Hitboxen für Figur, Plattformen, Gefahren, Sammelobjekte, Missionsziele und Ausgang. Mit `F4` wird zyklisch zwischen Levelstart und Rastplätzen gewechselt.

## Smoke-Tests

Nach dem Start eines lokalen Servers:

```text
http://127.0.0.1:8765/tests/smoke.html
```

Die Seite führt alle Prüfungen automatisch aus und setzt `data-smoke-status="passed"` oder `"failed"` am HTML-Element. Dadurch kann die Suite auch von Browserautomatisierung oder einer späteren CI-Pipeline ausgewertet werden.

Die vollständige Kampagnenprüfung läuft unter `tests/e2e.html`. Sie startet das Spiel mit einem isolierten Speichersystem, durchläuft alle zwölf Level bis zur Auswertung, kontrolliert alle 36 Medaillen und Kapitelprämien und versetzt jeden Endgegner in seinen vollständigen Besiegt-Zustand. Das Ergebnis steht als `data-e2e-status="passed"` oder `"failed"` am HTML-Element.
