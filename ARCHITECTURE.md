# Technische Architektur

Das Spiel bleibt ein Browserprojekt ohne Build-Schritt oder externe Laufzeitbibliotheken. Die Module registrieren ihre öffentliche API unter `window.SchorschGame` und werden in einer festen Reihenfolge aus `index.html` geladen. Dadurch funktioniert weiterhin sowohl ein lokaler Webserver als auch das direkte Öffnen der HTML-Datei.

## Modulübersicht

| Datei | Verantwortung |
| --- | --- |
| `src/game-data.js` | Levelmetadaten, Reiseaufträge, Musikdefinitionen, Gegenstände, Talente und Geheimlevel-Layouts |
| `src/physics.js` | Kollisionen, regionale Kräfte, Bewegungstuning, Landungsfeedback und deterministische Mathematikhelfer |
| `src/rendering.js` | kompletter Canvas-Renderer für Welt, Figuren, Gegenstände, Effekte und Outfit-Vorschauen |
| `src/audio.js` | AudioContext, regionale Musik, Instrumentstimmen, Soundeffekte und Abschlussjingles |
| `src/ui.js` | zentrale DOM-Registry und allgemeine Formatierung |
| `src/ui-actions.js` | HUD, Missionsanzeige, Inventar, Talentbaum, Shop, Levelkarte und UI-Aktionen |
| `src/debug.js` | FPS-Messung, Hitboxdarstellung, Zustandsanzeige und Checkpoint-Sprünge |
| `game.js` | Spielzustand, Levelaufbau, Missionsablauf, Eingaben, Kollisionen und Hauptschleife |
| `tests/smoke.js` | automatisierte, abhängigkeitfreie Browser-Smoke-Tests |

## Laufzeitfluss

1. `index.html` lädt Daten und Modul-Factories.
2. `game.js` erzeugt den zentralen Spielzustand und verbindet die Module über kleine Runtime-Objekte.
3. Die Hauptschleife aktualisiert Physik und Spielregeln.
4. Der Renderer zeichnet die aktuelle Welt; das Debugmodul zeichnet optional darüber.
5. UI- und Audio-Module reagieren über ihre klar abgegrenzten öffentlichen Methoden.

## Erweiterungsregeln

- Neue Leveldaten und Reiseaufträge gehören nach `src/game-data.js`.
- Neue Bewegungskräfte oder Kollisionshelfer gehören nach `src/physics.js` und sollten durch einen Smoke-Test abgesichert werden.
- Canvas-Zeichenfunktionen bleiben vollständig in `src/rendering.js`.
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
