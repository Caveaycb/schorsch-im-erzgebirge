# Schorsch im Erzgebirge

Ein kinderfreundlicher Jump-and-Run-Prototyp für den Browser. Die erste Fassung nutzt die mitgelieferte SVG-Figur „Schorsch“ und verbindet klassische Plattformspiel-Mechaniken mit einer stilisierten sächsisch-erzgebirgischen Welt.

## Spielen

Im Projektordner einen kleinen lokalen Server starten:

```bash
python3 -m http.server 8765
```

Danach `http://127.0.0.1:8765/` im Browser öffnen.

## Steuerung

- `A` / `D` oder Pfeiltasten: laufen
- `W`, Pfeil nach oben oder Leertaste: springen
- im Bonuslevel `W`/Pfeil hoch zum Auftauchen und `S`/Pfeil runter zum Abtauchen
- `P` oder Escape: Pause
- Auf Touch-Geräten erscheinen Bildschirmtasten.

## Enthalten

- zehn freischaltbare Levelregionen plus das elfte Bonus-Hauptlevel „Der geflutete Stollen“
- zehn unterschiedliche Geheimlevel: Federwerkstatt, Lichterkeller, Kristallaufzüge, Wassergrotte, Zugdepot, Dacharchiv, Laternenlabyrinth, Granitschacht, Uhrwerk und Gipfelhöhle
- eigene Geheimlevel-Mechaniken wie Förderbänder, Lichtbrücken, Strömung, Aufwind, rutschiger Boden und fahrende Zugwagen
- handgebautes Einstiegslevel „Waldweg bei Seiffen“ mit Werkstattpassage, Höhenweg und Geheimnis
- längere Hauptlevel mit einem klaren Wechsel aus schnellen Sammelstrecken, Kletter-/Sprungpassagen und Zielspurts
- mindestens zwei aktivierbare Rastplätze pro Level; jeder Rastplatz setzt den Rücksetzpunkt vor dem nächsten Abschnitt
- Laufen, variable Sprunghöhe, Coyote Time und Jump Buffer
- animierte Bewegungszustände für Leerlauf, Anlauf, Absprung, Scheitelpunkt, Fall und Landung
- separate Rennanimationen für beide Arme, weiße Handschuhe, Beine und den richtungsabhängig nachlaufenden Rucksack
- eigener tauchender Schorsch im Bonuslevel mit freier Unterwasserbewegung, Schwimmrhythmus, Auftrieb, Strömung, Blasen und Wasserlinien
- bewegliche Plattformen, Sprungfedern, harmlose Rußwichtel und langsam flatternde Lichterwichtel
- fünf Startleben, sammelbare Wanderherzen in Haupt- und Geheimleveln sowie maximal 999 Leben
- Abstürze und Treffer durch Rußwichtel kosten ein Leben; nach dem letzten Leben startet das aktuelle Hauptlevel vollständig neu
- Bergfunken, Checkpoints, Zielportale und Levelzeit
- fünf regionale Reiseandenken pro Hauptlevel, darunter Holzsterne, Grubenlampen, Fahrkarten, Schlüssel und Gipfelwimpel
- dauerhaftes Andenken-Inventar mit eigener Anzeige im Spielkopf und Levelauswertung
- dauerhaftes Bergfunken-Konto (jeder Kristall wird pro Level nur einmal gutgeschrieben)
- Outfit-Laden mit 14 Teilen aus Jacken/Umhängen, Mützen, Schuhen und Wanderzubehör
- pro Ausrüstungskategorie kann genau ein Teil gleichzeitig getragen werden
- bis zu 400 passgenau zusammengesetzte Schorsch-Varianten statt frei schwebender Symbol-Overlays
- gekaufte Ausrüstung bleibt gespeichert; Ladenansicht und Spielfigur verwenden exakt dieselbe Variante
- körpernah neu gezeichnete Jacken mit eigenen Ärmeln, Kragen, Bündchen, Säumen und typabhängigen Details
- individuell angepasste Mützen, Schuhe, Wanderstock, Laterne, Schal und Umhang mit festen Kopf-, Fuß-, Hand- und Rückenankern
- dauerhaftes Reise-Menü für freigeschaltete Level, Talentpfad, Rucksackinventar und Outfit-Laden – auch während eines laufenden Levels
- Rucksackinventar für regionale Fundstücke, Geheimweg-Schätze und besondere Höhenfunde
- hohe Plattformrouten belohnen mit seltenen Aussichtssternen, Bergkamm-Abzeichen und zusätzlichen Wanderherzen
- sieben lernbare Talente, davon maximal vier gleichzeitig aktiv; neue Hilfen sind Bergsprinter und das einmalige Wanderseil
- regionale Spielwelten: Fachwerk, Stollen, Zschopau, Bimmelbahn, Schieferdächer, Schwibbogen, Greifensteine und Gipfel
- elf eigenständige, detailreiche 3D-Comic-Kulissen – einschließlich eines gefluteten Erzgebirgsstollens mit Lorenbahn, Holzbalken und Kristalllicht
- unterschwellige regionale Energiedetails wie Mühlenkraft, dezente Strominfrastruktur, E-Mobilität und dachintegrierte Photovoltaik
- neu gezeichnete Moos-Felsplattformen, Holzbrücken, Schieferdächer, Zugwagen und facettierte Bergfunken
- dezente Tiefenstaffelung mit Panorama-Parallaxe, Lichtstaub und Vordergrundvignette
- optionale Spezialmechaniken wie Kristalllicht, Wasserströmung, Zugplattformen, Kletterstufen und Gipfelwind
- verzweigte Höhenrouten mit zusätzlichen Plattformen, versteckten Stollentüren und Schatzkammern
- aktiver Talentbaum mit freiwilligen Hilfen (Sprung, Gleiten, Kristallmagnet, Wanderherz und Spurensucher)
- elf eigenständige volkstümliche Hauptlevel-Arrangements mit Zither, Hackbrett, Flöte, Akkordeon, Glockenspiel und einer ruhigen Wasserweise
- zehn zusätzliche geheimnisvolle Musikvarianten für die unterschiedlichen Geheimlevel
- überarbeitete Schritt-, Sprung- und Landetöne
- Schorsch im verbindlichen Originaldesign mit frei wählbarem Namen
- lokaler Spielfortschritt per `localStorage`
- Vorschau auf einen späteren Talentpfad
- responsive Tastatur- und Touch-Steuerung

Die Dateien kommen ohne externe Bibliotheken oder Build-Schritt aus. Der Einstiegspunkt ist `index.html`, Spielphysik und Rendering liegen in `game.js`.
