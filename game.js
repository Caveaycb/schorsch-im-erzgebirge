(() => {
  "use strict";

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const stage = document.querySelector("#stage");
  const ui = {
    loading: document.querySelector("#loadingScreen"),
    start: document.querySelector("#startPanel"),
    map: document.querySelector("#mapPanel"),
    pause: document.querySelector("#pausePanel"),
    skills: document.querySelector("#skillsPanel"),
    outfits: document.querySelector("#outfitPanel"),
    finish: document.querySelector("#finishPanel"),
    levelGrid: document.querySelector("#levelGrid"),
    sparkCount: document.querySelector("#sparkCount"),
    itemCount: document.querySelector("#itemCount"),
    heartCount: document.querySelector("#heartCount"),
    levelName: document.querySelector("#levelName"),
    finishSparkCount: document.querySelector("#finishSparkCount"),
    finishItemCount: document.querySelector("#finishItemCount"),
    finishTime: document.querySelector("#finishTime"),
    finishText: document.querySelector("#finishText"),
    nextLevel: document.querySelector("#nextLevelButton"),
    toast: document.querySelector("#toast"),
    playerName: document.querySelector("#playerName"),
    characterPreview: document.querySelector("#characterPreview"),
    outfitGrid: document.querySelector("#outfitGrid"),
    outfitPreviewCanvas: document.querySelector("#outfitPreviewCanvas"),
    shopWallet: document.querySelector("#shopWallet"),
    previewLoadout: document.querySelector("#previewLoadout"),
    skillTree: document.querySelector("#skillTree"),
    skillSlots: document.querySelector("#skillSlots"),
    skillsWallet: document.querySelector("#skillsWallet"),
    inventory: document.querySelector("#inventoryPanel"),
    inventoryGrid: document.querySelector("#inventoryGrid"),
    inventoryCount: document.querySelector("#inventoryCount"),
    sound: document.querySelector("#soundButton"),
    startButton: document.querySelector("#startButton"),
  };

  const W = 1280;
  const H = 720;
  const TAU = Math.PI * 2;
  const START_LIVES = 5;
  const MAX_LIVES = 999;
  const MAX_ACTIVE_TALENTS = 4;

  const LEVELS = [
    { name: "Waldweg bei Seiffen", short: "Seiffen", subtitle: "Zwischen Fichten und Werkstätten", accent: "#3f8a65", sky: ["#8ed3cf", "#d9efe1"], ground: "#537b4a", mood: "forest", backdrop: "level-01" },
    { name: "Dorf der Lichter", short: "Lichterdorf", subtitle: "Fachwerk, Fenster und Figuren", accent: "#d9993b", sky: ["#88c7c7", "#f8dfaa"], ground: "#687744", mood: "village", backdrop: "level-02" },
    { name: "Silberner Stollen", short: "Silberstollen", subtitle: "Kristalle unter alten Balken", accent: "#5b83a2", sky: ["#66859a", "#b9d0ca"], ground: "#4f665c", mood: "mine", backdrop: "level-03" },
    { name: "An der Zschopau", short: "Zschopautal", subtitle: "Über Wasser und Mühlräder", accent: "#2c8c9c", sky: ["#76c8d0", "#d8efe6"], ground: "#4d7b55", mood: "river", backdrop: "level-04" },
    { name: "Bimmelbahn-Bogen", short: "Bimmelbahn", subtitle: "Mit Volldampf über die Höhen", accent: "#ae4c4d", sky: ["#98ced2", "#f5e2b4"], ground: "#5f784c", mood: "rail", backdrop: "level-05" },
    { name: "Annaberger Dächer", short: "Annaberg", subtitle: "Hoch über Gassen und Giebeln", accent: "#b6604e", sky: ["#7fb9c8", "#f6d2a5"], ground: "#596d50", mood: "rooftops", backdrop: "level-06" },
    { name: "Schwibbogen-Nacht", short: "Lichterbogen", subtitle: "Ein Weg im warmen Kerzenschein", accent: "#d6a53d", sky: ["#213958", "#855f75"], ground: "#384c4c", mood: "night", backdrop: "level-07" },
    { name: "Die Greifensteine", short: "Greifensteine", subtitle: "Kühne Sprünge durch Granit", accent: "#8c6d55", sky: ["#81b7bd", "#e5ddd0"], ground: "#646c50", mood: "rocks", backdrop: "level-08" },
    { name: "Über Wolkenstein", short: "Wolkenstein", subtitle: "Burgenblick und Wolkensprünge", accent: "#7c659c", sky: ["#88bddd", "#f0e8d2"], ground: "#59725a", mood: "castle", backdrop: "level-09" },
    { name: "Gipfel am Fichtelberg", short: "Fichtelberg", subtitle: "Das große Finale über den Wolken", accent: "#c15455", sky: ["#69abc9", "#f8e8c5"], ground: "#4d725c", mood: "summit", backdrop: "level-10" },
    { name: "Der geflutete Stollen", short: "Tauchstollen", subtitle: "Bonus: durch versunkene Schächte", accent: "#47c8d2", sky: ["#0d4658", "#2f8991"], ground: "#365c5e", mood: "underwater", backdrop: "level-11", underwater: true, bonus: true },
    { name: "Die Sonnenbahn", short: "Sonnenbahn", subtitle: "Bonus: Lade die leise Bergbahn", accent: "#e7a842", sky: ["#81c9e1", "#fff0b0"], ground: "#587747", mood: "solar", backdrop: "level-12", bonus: true },
  ];

  const OUTFIT_CATEGORIES = {
    jacket: "Jacken & Umhänge",
    head: "Mützen & Kopfbedeckungen",
    shoes: "Schuhe",
    accessory: "Wanderzubehör",
  };

  const OUTFITS = [
    { id: "cape", category: "jacket", style: "cape", name: "Bergmanns-Umhang", price: 8, mark: "⌁", color: "#9f4054", description: "Ein beeriger Umhang, der im Bergwind flattert." },
    { id: "forestJacket", category: "jacket", style: "jacket", name: "Fichten-Jacke", price: 11, mark: "▤", color: "#39705a", description: "Eine grüne Wanderjacke mit goldenen Knöpfen." },
    { id: "minerJacket", category: "jacket", style: "jacket", name: "Steiger-Jacke", price: 14, mark: "◆", color: "#334f67", description: "Dunkelblau mit hellem Bergmannskragen." },
    { id: "winterJacket", category: "jacket", style: "jacket", name: "Fichtelberg-Anorak", price: 18, mark: "▥", color: "#b84d57", description: "Eine warme rote Jacke für windige Gipfel." },

    { id: "hat", category: "head", style: "cap", name: "Gipfel-Mütze", price: 10, mark: "⌒", color: "#3f6954", description: "Grün mit einem sonnengelben Band." },
    { id: "redBeanie", category: "head", style: "beanie", name: "Bimmelbahn-Beanie", price: 12, mark: "●", color: "#b94b55", description: "Eine rote Strickmütze mit Bommel." },
    { id: "minerCap", category: "head", style: "miner", name: "Gruben-Kappe", price: 15, mark: "◉", color: "#38556b", description: "Eine Kappe mit freundlich leuchtender Stirnlampe." },
    { id: "winterHat", category: "head", style: "winter", name: "Schneeflocken-Mütze", price: 17, mark: "✦", color: "#4b7990", description: "Blau, weich und mit hellen Ohrenklappen." },

    { id: "hikingBoots", category: "shoes", style: "boots", name: "Wanderstiefel", price: 9, mark: "▰", color: "#755039", description: "Feste braune Schuhe für Fels und Holzstege." },
    { id: "redSneakers", category: "shoes", style: "sneakers", name: "Flitzer-Schuhe", price: 13, mark: "≫", color: "#c24f55", description: "Rote Turnschuhe mit hellen Sohlen." },
    { id: "snowBoots", category: "shoes", style: "snow", name: "Gipfelstiefel", price: 16, mark: "▣", color: "#55778a", description: "Blaue Winterstiefel mit weißem Rand." },

    { id: "cane", category: "accessory", style: "cane", name: "Erzgebirgs-Gehstock", price: 12, mark: "♩", color: "#9b6b3d", description: "Ein geschnitzter Begleiter für große Wandertouren." },
    { id: "lanternGear", category: "accessory", style: "lantern", name: "Kleine Grubenlaterne", price: 14, mark: "☼", color: "#d99534", description: "Leuchtet warm an Schorschs Seite." },
    { id: "scarf", category: "accessory", style: "scarf", name: "Lichterbogen-Schal", price: 11, mark: "≈", color: "#c45260", description: "Ein weicher Schal, der beim Rennen nach hinten weht." },
  ];

  const TALENTS = [
    { id: "highJump", name: "Federleicht", price: 12, mark: "↟", description: "Schorsch springt ein kleines Stück höher." },
    { id: "glide", name: "Wolkenritt", price: 14, mark: "☁", description: "Sprungtaste beim Fallen halten, um sanft zu gleiten." },
    { id: "magnet", name: "Kristallblick", price: 10, mark: "◇", description: "Bergfunken in der Nähe finden von allein zu Schorsch." },
    { id: "extraHeart", name: "Wanderherz", price: 12, mark: "♥", description: "Das erste gefundene Wanderherz jedes Levels zählt doppelt." },
    { id: "secretPaths", name: "Spurensucher", price: 8, mark: "✦", description: "Geheime Wege werden mit kleinen Sternen markiert." },
    { id: "trailRunner", name: "Bergsprinter", price: 13, mark: "➜", description: "Schorsch läuft etwas schneller und beschleunigt flotter." },
    { id: "safetyNet", name: "Wanderseil", price: 16, mark: "⌁", description: "Fängt einmal pro Level einen Sturz ab – ohne ein Leben zu kosten." },
  ];

  const LEVEL_MUSIC = [
    { name: "Seiffener Werkstatttanz", tempo: 108, meter: 8, root: 62, mode: "major", lead: "zither", rhythm: "polka", progression: [0, 5, 7, 0], melody: [0, 4, 7, 4, 2, 0, -3, null, 0, 2, 4, 7, 4, 2, 0, null] },
    { name: "Lichterdorfer Walzer", tempo: 96, meter: 6, root: 67, mode: "major", lead: "accordion", rhythm: "waltz", progression: [0, 5, 7, 0], melody: [0, 2, 4, 7, 4, 2, 0, null, 4, 7, 9, 7, 5, 4, 2, null, 0, 2] },
    { name: "Stollenweise", tempo: 84, meter: 8, root: 62, mode: "minor", lead: "clarinet", rhythm: "march", progression: [0, 3, 5, 0], melody: [0, 3, 5, 7, 5, 3, 0, null, -2, 0, 3, 5, 3, 0, -2, null] },
    { name: "Zschopauer Wasserlied", tempo: 104, meter: 8, root: 60, mode: "major", lead: "flute", rhythm: "flow", progression: [0, 5, 2, 7], melody: [0, 2, 4, 7, 9, 7, 4, 2, 0, 4, 5, 9, 7, 5, 4, null] },
    { name: "Bimmelbahn-Polka", tempo: 122, meter: 8, root: 67, mode: "major", lead: "accordion", rhythm: "polka", progression: [0, 7, 5, 0], melody: [0, 4, 7, null, 7, 9, 7, 4, 2, 5, 9, null, 7, 4, 2, null] },
    { name: "Annaberger Dachwalzer", tempo: 92, meter: 6, root: 69, mode: "minor", lead: "strings", rhythm: "waltz", progression: [0, 5, 3, 7], melody: [0, 3, 7, 8, 7, 3, 0, null, -2, 0, 3, 5, 3, 0, -2, null, 0, 3] },
    { name: "Lichterbogen-Nocturne", tempo: 78, meter: 6, root: 64, mode: "minor", lead: "bell", rhythm: "waltz", progression: [0, 3, 7, 5], melody: [0, 3, 7, 10, 7, 3, 2, null, 5, 7, 10, 12, 10, 7, 5, null, 3, 2] },
    { name: "Greifenstein-Marsch", tempo: 112, meter: 8, root: 65, mode: "major", lead: "dulcimer", rhythm: "march", progression: [0, 5, 7, 0], melody: [0, 0, 5, 4, 2, 4, 7, null, 7, 5, 4, 2, 0, 2, 0, null] },
    { name: "Wolkensteiner Menuett", tempo: 100, meter: 6, root: 62, mode: "major", lead: "flute", rhythm: "minuet", progression: [0, 7, 5, 0], melody: [0, 4, 7, 9, 7, 4, 2, 5, 9, 11, 9, 5, 4, 2, 0, 2, 4, null] },
    { name: "Fichtelberger Gipfelreigen", tempo: 116, meter: 8, root: 67, mode: "major", lead: "horn", rhythm: "march", progression: [0, 5, 2, 7], melody: [0, 4, 7, 12, 11, 9, 7, null, 5, 9, 12, 14, 12, 9, 7, null] },
    { name: "Tauchstollen-Wasserweise", tempo: 82, meter: 8, root: 60, mode: "dorian", lead: "flute", rhythm: "flow", progression: [0, 3, 7, 5], melody: [0, 2, 3, 7, 9, 7, 5, 3, 0, -2, 0, 3, 5, 7, 3, null] },
    { name: "Sonnenbahn-Polka", tempo: 118, meter: 8, root: 65, mode: "major", lead: "accordion", rhythm: "polka", progression: [0, 5, 7, 0], melody: [0, 4, 7, 9, 7, 4, 2, null, 5, 9, 12, 9, 7, 4, 2, null] },
  ];

  const SECRET_MOTIFS = [
    [0, 3, 7, 5, 3, 0, -2, null, 0, 5, 7, 10, 7, 5, 3, null],
    [0, 2, 6, 9, 6, 2, 0, null, 3, 6, 8, 6, 3, 2, 0, null],
    [0, 3, 5, 8, 7, 5, 3, null, -2, 0, 5, 7, 5, 3, 0, null],
    [0, 2, 5, 7, 9, 7, 5, 2, 0, -2, 0, 5, 7, 5, 2, null],
    [0, 3, 7, null, 5, 8, 7, 3, 0, 5, 10, null, 8, 7, 5, null],
    [0, 3, 5, 10, 8, 5, 3, 0, -2, 3, 7, 8, 7, 3, 0, null],
    [0, 2, 5, 8, 11, 8, 5, null, 3, 5, 8, 10, 8, 5, 2, null],
    [0, 5, 3, 7, 5, 10, 7, null, 0, 3, 8, 7, 5, 3, 0, null],
    [0, 3, 7, 11, 7, 5, 3, null, 2, 5, 8, 10, 8, 5, 3, null],
    [0, 2, 7, 9, 12, 9, 7, null, 5, 7, 10, 14, 12, 10, 7, null],
  ];
  const SECRET_MUSIC_NAMES = [
    "Federwerkstatt-Galopp", "Lichterkeller-Flüstern", "Kristallaufzug-Kanon", "Grotten-Tropfenlied", "Zugdepot-Schleichpolka",
    "Dacharchiv-Nachtwalzer", "Laternenlabyrinth-Reigen", "Granitschacht-Echo", "Uhrwerk-Menuett", "Gipfelhöhlen-Finale",
  ];

  const SECRET_MUSIC = SECRET_MOTIFS.map((melody, index) => ({
    name: SECRET_MUSIC_NAMES[index],
    tempo: 86 + index * 2,
    meter: index % 3 === 1 ? 6 : 8,
    root: 57 + (index % 5),
    mode: index % 4 === 3 ? "dorian" : "minor",
    lead: ["bell", "clarinet", "zither", "flute"][index % 4],
    rhythm: "secret",
    progression: [0, 3, 5, 7],
    melody,
    secret: true,
  }));

  const REGIONAL_ITEMS = {
    forest: { name: "Seiffener Holzstern", type: "star", color: "#e2a446" },
    village: { name: "Lichterfigur", type: "figure", color: "#e9b94e" },
    mine: { name: "Kleine Grubenlampe", type: "lantern", color: "#f0a83c" },
    river: { name: "Zschopau-Mühlentaler", type: "coin", color: "#56a7b5" },
    rail: { name: "Bimmelbahn-Fahrkarte", type: "ticket", color: "#b9514d" },
    rooftops: { name: "Annaberger Schieferherz", type: "heart", color: "#667b87" },
    night: { name: "Schwibbogen-Kerze", type: "candle", color: "#f0bd53" },
    rocks: { name: "Greifenstein-Abzeichen", type: "badge", color: "#8d755a" },
    castle: { name: "Wolkensteiner Schlüssel", type: "key", color: "#d4a445" },
    summit: { name: "Fichtelberg-Wimpel", type: "flag", color: "#c55659" },
    underwater: { name: "Versunkene Grubenmarke", type: "coin", color: "#63dbe2" },
  };

  const SECRET_ROOM_LAYOUTS = [
    {
      name: "Federwerkstatt", mood: "forest", backdrop: "mine", special: "spring-workshop",
      mechanic: "Federketten und laufende Werkbänke", worldWidth: 2250, groundType: "mine", ledgeType: "wood",
      grounds: [[0,620,350],[470,600,300],[890,635,315],[1330,590,300],[1765,620,485]],
      ledges: [[235,500,140,"wood",null,{conveyor:80}],[430,405,130,"wood"],[635,310,145,"wood",{axis:"y",range:42,speed:.75}],[850,455,150,"mine"],[1080,355,145,"wood"],[1295,265,140,"wood",{axis:"x",range:45,speed:.65}],[1540,430,150,"mine"],[1740,330,145,"wood"],[1980,455,160,"wood",null,{conveyor:-70}]],
      springs: [[285,602],[705,582],[1120,617],[1510,572]], hazards: [[1010,600,55,.8],[1880,586,65,.9]],
    },
    {
      name: "Lichterkeller", mood: "night", backdrop: "night", special: "light-bridges",
      mechanic: "Sanft pulsierende Lichtbrücken", worldWidth: 2420, groundType: "earth", ledgeType: "roof",
      grounds: [[0,620,410],[560,635,270],[990,605,320],[1470,630,290],[1910,610,510]],
      ledges: [[260,505,135,"roof"],[455,410,130,"roof",null,{toggle:{period:3.6,phase:0}}],[675,330,140,"roof",null,{toggle:{period:3.6,phase:1.8}}],[885,450,140,"stone"],[1110,355,145,"roof",null,{toggle:{period:4.2,phase:.8}}],[1340,270,135,"roof"],[1585,430,150,"roof",null,{toggle:{period:4.2,phase:2.9}}],[1810,340,140,"stone"],[2070,465,170,"roof"]],
      springs: [[330,602],[1200,587]], hazards: [[705,602,48,.72],[1600,596,55,.83]],
    },
    {
      name: "Kristallaufzüge", mood: "mine", backdrop: "mine", special: "crystal-lifts",
      mechanic: "Hohe Schächte und Kristallaufzüge", worldWidth: 2550, groundType: "mine", ledgeType: "mine",
      grounds: [[0,620,360],[520,640,300],[980,625,290],[1440,640,320],[1940,615,610]],
      ledges: [[240,500,135,"mine",{axis:"y",range:65,speed:.55}],[450,385,130,"mine"],[650,270,135,"wood",{axis:"y",range:82,speed:.48}],[875,410,145,"mine"],[1085,285,135,"mine",{axis:"y",range:72,speed:.6}],[1320,195,140,"wood"],[1545,360,145,"mine",{axis:"x",range:70,speed:.55}],[1775,255,145,"mine",{axis:"y",range:75,speed:.52}],[2070,430,175,"wood"]],
      springs: [[285,602],[1510,622]], hazards: [[670,606,55,.8],[2170,581,80,.9]],
    },
    {
      name: "Zschopau-Grotte", mood: "river", backdrop: "mine", special: "water-grotto",
      mechanic: "Wasserströmungen und schwimmende Stege", worldWidth: 2380, groundType: "earth", ledgeType: "wood",
      grounds: [[0,620,390],[535,635,310],[1010,615,270],[1435,640,300],[1890,610,490]],
      ledges: [[250,505,155,"wood",{axis:"y",range:20,speed:1.1}],[475,420,145,"wood",{axis:"y",range:28,speed:.95}],[700,335,150,"wood",{axis:"x",range:55,speed:.55}],[915,455,140,"stone"],[1120,360,145,"wood",{axis:"y",range:25,speed:1.05}],[1340,270,145,"wood"],[1580,425,150,"wood",{axis:"x",range:60,speed:.58}],[1800,330,145,"stone"],[2040,465,170,"wood"]],
      springs: [[305,602],[1195,597]], hazards: [[690,601,55,.7],[1590,606,60,.82]], currents: [[535,310,115],[1435,300,-105]],
    },
    {
      name: "Verlassenes Zugdepot", mood: "rail", backdrop: "day", special: "train-depot",
      mechanic: "Rangierende Bimmelbahn-Wagen", worldWidth: 2720, groundType: "earth", ledgeType: "train",
      grounds: [[0,620,360],[620,630,260],[1110,610,310],[1660,635,270],[2170,610,550]],
      ledges: [[290,500,210,"train",{axis:"x",range:85,speed:.42}],[550,395,145,"wood"],[780,300,205,"train",{axis:"x",range:110,speed:.38}],[1040,440,145,"wood"],[1280,340,210,"train",{axis:"x",range:100,speed:.46}],[1550,250,145,"wood"],[1800,420,210,"train",{axis:"x",range:95,speed:.4}],[2070,330,150,"wood"],[2350,455,220,"train",{axis:"x",range:70,speed:.45}]],
      springs: [[300,602],[1295,592]], hazards: [[735,596,42,.82],[2290,576,75,.9]],
    },
    {
      name: "Annaberger Dacharchiv", mood: "rooftops", backdrop: "night", special: "roof-wind",
      mechanic: "Schmale Schieferdächer und Schornsteinwind", worldWidth: 2350, groundType: "earth", ledgeType: "roof",
      grounds: [[0,620,390],[530,610,280],[950,625,300],[1390,605,280],[1820,620,530]],
      ledges: [[220,500,155,"roof"],[415,405,145,"roof"],[610,315,140,"roof"],[805,225,135,"roof"],[1010,365,150,"roof"],[1220,275,140,"roof"],[1430,185,135,"roof"],[1660,330,150,"roof"],[1950,450,185,"roof"]],
      springs: [[315,602],[1075,607]], hazards: [[695,576,50,.75],[1950,586,70,.88]], wind: [[600,420,80],[1380,390,-70]],
    },
    {
      name: "Laternenlabyrinth", mood: "night", backdrop: "night", special: "lantern-maze",
      mechanic: "Zwei Wege zwischen wechselnden Laternen", worldWidth: 2600, groundType: "earth", ledgeType: "wood",
      grounds: [[0,620,330],[500,640,260],[930,615,280],[1370,640,270],[1810,615,280],[2250,625,350]],
      ledges: [[230,500,135,"wood"],[410,390,130,"wood",null,{toggle:{period:4.8,phase:0}}],[610,280,135,"wood",null,{toggle:{period:4.8,phase:2.4}}],[820,470,140,"stone"],[1040,350,140,"wood",null,{toggle:{period:4,phase:1}}],[1250,245,135,"wood"],[1470,455,140,"wood",null,{toggle:{period:4,phase:3}}],[1690,335,140,"stone"],[1910,235,135,"wood",null,{toggle:{period:5,phase:1.6}}],[2140,430,150,"wood"],[2360,325,145,"wood"]],
      springs: [[275,602],[1515,622]], hazards: [[625,606,45,.8],[1900,581,55,.93]],
    },
    {
      name: "Greifenstein-Schacht", mood: "rocks", backdrop: "mine", special: "granite-climb",
      mechanic: "Eine hohe Zickzack-Kletterpassage", worldWidth: 2200, groundType: "mine", ledgeType: "stone",
      grounds: [[0,620,360],[520,640,260],[940,630,260],[1380,640,260],[1800,615,400]],
      ledges: [[250,520,110,"stone"],[430,440,105,"stone"],[590,355,105,"stone"],[430,270,105,"stone"],[650,190,110,"stone"],[870,300,115,"stone"],[1060,210,110,"stone"],[1260,330,115,"stone"],[1460,240,110,"stone"],[1660,350,120,"stone"],[1900,455,160,"stone"]],
      springs: [[300,602],[1010,612]], hazards: [[650,606,42,.76],[1510,606,48,.88]],
    },
    {
      name: "Wolkensteiner Uhrwerk", mood: "castle", backdrop: "night", special: "clockwork",
      mechanic: "Gegenläufige Zahnräder und Förderbänder", worldWidth: 2500, groundType: "mine", ledgeType: "wood",
      grounds: [[0,620,380],[520,630,300],[980,610,290],[1430,635,300],[1890,610,610]],
      ledges: [[240,500,155,"wood",null,{conveyor:95}],[460,405,140,"wood",{axis:"x",range:65,speed:.8}],[690,310,145,"wood",{axis:"y",range:55,speed:.7}],[910,450,140,"mine"],[1120,350,155,"wood",null,{conveyor:-105}],[1370,255,145,"wood",{axis:"x",range:75,speed:.72}],[1600,420,150,"mine"],[1820,315,145,"wood",{axis:"y",range:60,speed:.68}],[2100,455,180,"wood",null,{conveyor:90}]],
      springs: [[300,602],[1160,592]], hazards: [[680,596,55,.9],[2070,576,75,1]],
    },
    {
      name: "Fichtelberger Gipfelhöhle", mood: "summit", backdrop: "night", special: "ice-wind",
      mechanic: "Rutschige Felsen, Aufwind und ein langer Finalsprung", worldWidth: 2820, groundType: "mine", ledgeType: "stone",
      grounds: [[0,620,410],[600,640,260],[1050,615,270],[1520,640,250],[1980,620,300],[2440,600,380]],
      ledges: [[285,505,145,"stone"],[510,410,135,"stone",{axis:"y",range:45,speed:.55}],[750,315,140,"stone"],[975,220,135,"stone"],[1210,360,145,"stone",{axis:"x",range:70,speed:.5}],[1450,260,140,"stone"],[1700,170,135,"stone"],[1950,320,145,"stone",{axis:"y",range:60,speed:.58}],[2190,225,140,"stone"],[2450,430,180,"stone"]],
      springs: [[345,602],[1115,597],[2060,602]], hazards: [[730,606,55,.85],[2100,586,70,.96]], wind: [[900,500,125],[1650,500,-90],[2250,400,145]],
    },
  ];

  const characterImage = new Image();
  characterImage.src = "assets/characters/schorsch.svg";
  const divingCharacterImage = new Image();
  divingCharacterImage.src = "assets/characters/schorsch-diving.svg";

  const backdropSources = {
    day: "assets/backgrounds/erzgebirge-day-v2.png",
    mine: "assets/backgrounds/silberstollen-v2.png",
    night: "assets/backgrounds/erzgebirge-night-v2.png",
    "level-01": "assets/backgrounds/level-01-seiffen-v4.png",
    "level-02": "assets/backgrounds/level-02-lichterdorf-v4.png",
    "level-03": "assets/backgrounds/level-03-silberstollen-v4.png",
    "level-04": "assets/backgrounds/level-04-zschopautal-v4.png",
    "level-05": "assets/backgrounds/level-05-bimmelbahn-v4.png",
    "level-06": "assets/backgrounds/level-06-annaberg-v4.png",
    "level-07": "assets/backgrounds/level-07-lichterbogen-v4.png",
    "level-08": "assets/backgrounds/level-08-greifensteine-v4.png",
    "level-09": "assets/backgrounds/level-09-wolkenstein-v4.png",
    "level-10": "assets/backgrounds/level-10-fichtelberg-v4.png",
    "level-11": "assets/backgrounds/level-11-tauchstollen-v2.png",
    "level-12": "assets/backgrounds/level-12-sonnenbahn-v1.png",
  };
  const backdropImages = {};

  function getBackdropImage(key) {
    if (!backdropSources[key]) return null;
    if (!backdropImages[key]) {
      const image = new Image();
      image.src = backdropSources[key];
      backdropImages[key] = image;
    }
    return backdropImages[key];
  }

  const pressed = new Set();
  const held = { left: false, right: false, jump: false, down: false };
  let lastTime = performance.now();
  let toastTimer = 0;
  let restartTimer = 0;
  let audioContext = null;

  const storage = loadProgress();
  const storedOwnedTalents = storage.talentLoadoutSaved && Array.isArray(storage.ownedTalents)
    ? storage.ownedTalents
    : storage.talents;
  const storedEquippedTalents = storage.talentLoadoutSaved && Array.isArray(storage.equippedTalents)
    ? storage.equippedTalents
    : storedOwnedTalents.slice(0, MAX_ACTIVE_TALENTS);
  const game = {
    mode: "menu",
    levelIndex: Math.min(storage.currentLevel, LEVELS.length - 1),
    unlocked: Math.max(1, Math.min(storage.unlocked, LEVELS.length)),
    completed: new Set(storage.completed),
    playerName: storage.playerName,
    sound: storage.sound,
    wallet: Math.max(0, Number(storage.wallet) || 0),
    claimedSparks: new Set(Array.isArray(storage.claimedSparks) ? storage.claimedSparks : []),
    ownedOutfits: new Set(Array.isArray(storage.ownedOutfits) ? storage.ownedOutfits : []),
    equippedOutfits: new Set(Array.isArray(storage.equippedOutfits) ? storage.equippedOutfits : []),
    ownedTalents: new Set(storedOwnedTalents),
    talents: new Set(storedEquippedTalents.slice(0, MAX_ACTIVE_TALENTS)),
    foundItems: new Set(Array.isArray(storage.foundItems) ? storage.foundItems : []),
    level: null,
    player: null,
    mainLevel: null,
    mainPlayer: null,
    mainCameraX: 0,
    inSecretRoom: false,
    secretCooldown: 0,
    cameraX: 0,
    cameraY: 0,
    cameraLookX: 0,
    cameraKick: 0,
    hearts: START_LIVES,
    lifeTalentUsed: false,
    safetyNetUsed: false,
    sparks: 0,
    runStartedAt: 0,
    pausedAt: 0,
    particles: [],
    time: 0,
    shake: 0,
    musicBeatAt: 0,
    musicStep: 0,
    startReturnMode: null,
  };
  function loadProgress() {
    const defaults = {
      currentLevel: 0,
      unlocked: 1,
      completed: [],
      playerName: "Schorsch",
      sound: true,
      wallet: 0,
      claimedSparks: [],
      ownedOutfits: [],
      equippedOutfits: [],
      talents: [],
      ownedTalents: [],
      equippedTalents: [],
      talentLoadoutSaved: false,
      foundItems: [],
    };
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem("schorsch-progress") || "{}") };
    } catch {
      return defaults;
    }
  }

  function saveProgress() {
    localStorage.setItem("schorsch-progress", JSON.stringify({
      currentLevel: game.levelIndex,
      unlocked: game.unlocked,
      completed: [...game.completed],
      playerName: game.playerName,
      sound: game.sound,
      wallet: game.wallet,
      claimedSparks: [...game.claimedSparks],
      ownedOutfits: [...game.ownedOutfits],
      equippedOutfits: [...game.equippedOutfits],
      talents: [...game.talents],
      ownedTalents: [...game.ownedTalents],
      equippedTalents: [...game.talents],
      talentLoadoutSaved: true,
      foundItems: [...game.foundItems],
    }));
  }

  function seededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let t = value;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createSeiffenLevel() {
    const meta = LEVELS[0];
    const worldWidth = 7150;
    const ground = (id, x, y, w) => ({
      id, x, y, baseX: x, baseY: y, w, h: H - y + 80, ground: true, type: "earth",
    });
    const ledge = (id, x, y, w, type = "stone", movement = null) => ({
      id, x, y, baseX: x, baseY: y, w, h: 26, ground: false, type,
      moving: Boolean(movement),
      moveRange: movement?.range || 0,
      moveSpeed: movement?.speed || 0,
      moveAxis: movement?.axis || "x",
      phase: movement?.phase || 0,
    });

    const platforms = [
      ground("s-g0", 0, 620, 700),
      ground("s-g1", 815, 610, 500),
      ground("s-g2", 1435, 590, 610),
      ground("s-g3", 2175, 620, 440),
      ground("s-g4", 2735, 600, 740),
      ground("s-g5", 3605, 625, 555),
      ground("s-g6", 4290, 585, 510),
      ground("s-g7", 4930, 615, 1070),
      ground("s-g8", 6120, 600, 1030),

      ledge("s-tutorial-1", 420, 500, 165, "stone"),
      ledge("s-tutorial-2", 625, 410, 165, "wood"),
      ledge("s-gap-1", 716, 520, 92, "wood", { range: 26, speed: .8, axis: "y", phase: .6 }),

      ledge("s-secret-1", 1060, 430, 155, "wood"),
      ledge("s-secret-2", 1240, 330, 175, "stone"),
      ledge("s-secret-3", 1430, 245, 235, "wood"),
      ledge("s-secret-down", 1695, 355, 165, "stone"),
      ledge("s-roof-1", 1530, 475, 205, "roof"),
      ledge("s-roof-2", 1785, 405, 195, "roof"),
      ledge("s-roof-3", 2005, 500, 145, "wood"),

      ledge("s-workshop-1", 2290, 505, 175, "wood"),
      ledge("s-workshop-2", 2490, 410, 170, "roof"),
      ledge("s-workshop-3", 2668, 525, 96, "wood", { range: 36, speed: .75, axis: "x", phase: 1.2 }),

      ledge("s-forest-1", 2875, 475, 185, "stone"),
      ledge("s-forest-2", 3115, 390, 160, "wood", { range: 58, speed: .72, axis: "y", phase: 2.1 }),
      ledge("s-forest-3", 3340, 470, 180, "stone"),
      ledge("s-ravine", 3490, 535, 104, "wood", { range: 48, speed: .85, axis: "x", phase: .3 }),

      ledge("s-village-1", 3720, 490, 180, "roof"),
      ledge("s-village-2", 3970, 395, 170, "roof"),
      ledge("s-village-3", 4185, 490, 145, "wood"),
      ledge("s-final-1", 4410, 450, 170, "stone"),
      ledge("s-final-2", 4625, 355, 175, "wood"),
      ledge("s-final-3", 4835, 490, 125, "wood"),
      ledge("s-final-4", 5170, 470, 225, "roof"),
      ledge("s-final-5", 5485, 385, 190, "wood"),
      ledge("s-final-6", 5710, 495, 170, "stone"),
      ledge("s-final-7", 6050, 455, 170, "wood", { range: 34, speed: .7, axis: "y", phase: .4 }),
      ledge("s-final-8", 6320, 350, 190, "roof"),
      ledge("s-final-9", 6600, 440, 175, "stone"),
      ledge("s-final-10", 6860, 330, 175, "wood"),
    ];

    const crystalPositions = [
      [220, 555], [500, 440], [690, 350], [865, 545], [1055, 545],
      [1100, 370], [1280, 270], [1470, 185], [1545, 185], [1620, 185],
      [1530, 525], [1650, 415], [1870, 345], [2000, 525],
      [2300, 555], [2380, 445], [2570, 350], [2810, 535],
      [2930, 415], [3185, 320], [3410, 410], [3660, 560],
      [3805, 430], [4045, 335], [4315, 520], [4490, 390],
      [4705, 295], [4960, 550], [5250, 410], [5565, 325],
      [5780, 435], [5870, 550], [6135, 540], [6225, 505],
      [6415, 285], [6690, 375], [6950, 265], [7050, 540],
    ];
    const collectibles = crystalPositions.map(([x, y], index) => ({
      id: `seiffen-c-${index}`,
      x,
      y,
      collected: false,
      phase: index * .63,
      secret: index >= 7 && index <= 9,
    }));

    const hazards = [
      { x: 1860, y: 556, baseX: 1860, r: 24, range: 72, speed: .72, phase: .4 },
      { x: 2420, y: 586, baseX: 2420, r: 24, range: 58, speed: .78, phase: 1.8 },
      { x: 3315, y: 566, baseX: 3315, r: 25, range: 78, speed: .84, phase: 2.7 },
      { x: 3910, y: 591, baseX: 3910, r: 25, range: 62, speed: .9, phase: .9 },
      { x: 5280, y: 581, baseX: 5280, r: 26, range: 94, speed: .94, phase: 2.2 },
      { x: 6510, y: 466, baseX: 6510, baseY: 466, r: 21, range: 72, verticalRange: 20, speed: .82, phase: 1.4, kind: "sunBoost" },
    ];

    return {
      ...meta,
      index: 0,
      worldWidth,
      platforms,
      collectibles,
      hazards,
      springs: [
        { x: 1150, y: 592, w: 54, h: 18 },
        { x: 3235, y: 582, w: 54, h: 18 },
        { x: 4560, y: 567, w: 54, h: 18 },
        { x: 6200, y: 582, w: 54, h: 18 },
      ],
      goal: { x: 7000, y: 484, w: 72, h: 116 },
      checkpoints: [
        { x: 1990, y: 504, active: false, label: "Werkstatt-Rast" },
        { x: 4440, y: 499, active: false, label: "Fichten-Rast" },
      ],
      checkpoint: { x: 1990, y: 504, active: false, label: "Werkstatt-Rast" },
      start: { x: 92, y: 522 },
      collected: 0,
      mechanic: "Grundlagen zwischen Holzwerkstätten",
      currents: [],
      windZones: [],
      handcrafted: true,
      secret: { x: 1370, y: 135, w: 340, h: 215, found: false },
      hints: [
        { x: 250, y: 620, text: "A / D: LOSLAUFEN" },
        { x: 465, y: 620, text: "LEERTASTE: SPRINGEN" },
        { x: 1035, y: 610, text: "DIE FEDER FÜHRT NACH OBEN" },
      ],
      decorations: [
        { type: "village-sign", x: 640, y: 620, text: "SEIFFEN" },
        { type: "workshop", x: 1590, y: 590, scale: .82 },
        { type: "wood-table", x: 2290, y: 620, scale: 1 },
        { type: "toy-arch", x: 2775, y: 600, scale: .74 },
        { type: "log-pile", x: 3680, y: 625, scale: 1 },
        { type: "workshop", x: 4415, y: 585, scale: .76 },
        { type: "toy-arch", x: 5070, y: 615, scale: .82 },
        { type: "finish-house", x: 6860, y: 600, scale: .9 },
      ],
    };
  }

  function createBimmelbahnAdventureLevel() {
    const meta = LEVELS[4];
    const worldWidth = 8050;
    const ground = (id, x, y, w) => ({
      id, x, y, baseX: x, baseY: y, w, h: H - y + 80, ground: true, type: "earth",
    });
    const ledge = (id, x, y, w, type = "wood", movement = null, extra = null) => ({
      id, x, y, baseX: x, baseY: y, w, h: 26, ground: false, type,
      moving: Boolean(movement),
      moveRange: movement?.range || 0,
      moveSpeed: movement?.speed || 0,
      moveAxis: movement?.axis || "x",
      phase: movement?.phase || 0,
      ...(extra || {}),
    });

    const platforms = [
      // 1. Anfahrt: sichere Einführung und ein erster beweglicher Wagen.
      ground("rail-g0", 0, 620, 840),
      ground("rail-g1", 975, 605, 1010),
      ground("rail-g2", 2125, 620, 820),
      // 2. Weichenhof: Signalrätsel und ein optionaler Höhenwagen.
      ground("rail-g3", 3085, 595, 980),
      ground("rail-g4", 4205, 620, 760),
      // 3. Talstrecke: schneller, aber weiterhin gut lesbarer Rhythmus.
      ground("rail-g5", 5100, 600, 920),
      ground("rail-g6", 6155, 615, 920),
      // 4. Zieldepot: ein letzter Höhenweg vor dem Tor.
      ground("rail-g7", 7210, 590, 840),

      ledge("rail-start-1", 320, 505, 180, "wood"),
      ledge("rail-start-2", 565, 415, 190, "train", { axis: "x", range: 58, speed: .52, phase: .4 }),
      ledge("rail-gap-car", 856, 510, 104, "train", { axis: "x", range: 32, speed: .76, phase: 1.2 }),

      ledge("rail-dash-1", 1165, 470, 250, "train", { axis: "x", range: 88, speed: .48, phase: .8 }),
      ledge("rail-dash-2", 1510, 370, 180, "wood"),
      ledge("rail-dash-3", 1745, 460, 170, "train", { axis: "y", range: 32, speed: .66, phase: 2.1 }),

      ledge("rail-lookout-1", 2250, 500, 180, "stone"),
      ledge("rail-lookout-2", 2470, 400, 185, "train", { axis: "y", range: 30, speed: .62, phase: .9 }),
      ledge("rail-lookout-3", 2700, 295, 220, "wood"),
      ledge("rail-lookout-down", 2880, 430, 145, "stone"),

      ledge("rail-switch-1", 3270, 465, 190, "wood"),
      ledge("rail-switch-2", 3485, 375, 180, "train", { axis: "x", range: 58, speed: .54, phase: 2.5 }),
      ledge("rail-switch-3", 3950, 455, 165, "wood"),

      ledge("rail-valley-1", 4350, 495, 185, "stone"),
      ledge("rail-valley-2", 4600, 390, 205, "train", { axis: "x", range: 76, speed: .5, phase: .6 }),
      ledge("rail-valley-3", 4860, 500, 150, "wood"),
      ledge("rail-tunnel-1", 5270, 465, 220, "train", { axis: "x", range: 82, speed: .46, phase: 1.7 }),
      ledge("rail-tunnel-2", 5545, 365, 175, "wood"),
      ledge("rail-tunnel-3", 5785, 460, 165, "stone"),

      ledge("rail-final-1", 6315, 475, 190, "wood"),
      ledge("rail-final-2", 6575, 365, 205, "train", { axis: "y", range: 36, speed: .58, phase: 2.7 }),
      ledge("rail-final-3", 6850, 455, 175, "stone"),
      ledge("rail-depot-1", 7360, 445, 185, "wood"),
      ledge("rail-depot-2", 7605, 350, 195, "train", { axis: "x", range: 44, speed: .48, phase: .1 }),
    ];

    const crystalPositions = [
      [205, 555], [430, 440], [660, 350], [880, 548],
      [1120, 545], [1240, 415], [1375, 405], [1585, 320], [1810, 410], [1920, 540],
      [2220, 552], [2340, 430], [2555, 330], [2745, 220], [2835, 220], [2945, 550],
      [3200, 520], [3420, 405], [3590, 315], [3800, 540], [4005, 385],
      [4295, 555], [4450, 430], [4700, 320], [4930, 540], [5200, 535],
      [5390, 395], [5625, 295], [5880, 400], [5980, 535],
      [6250, 545], [6440, 405], [6680, 300], [6940, 395], [7160, 545],
      [7390, 370], [7700, 275],
    ];
    const collectibles = crystalPositions.map(([x, y], index) => ({
      id: `rail-c-${index}`, x, y, collected: false, phase: index * .57,
    }));

    const level = {
      ...meta,
      index: 4,
      worldWidth,
      platforms,
      collectibles,
      hazards: [
        { x: 1810, y: 570, baseX: 1810, r: 24, range: 58, speed: .72, phase: .4 },
        { x: 2775, y: 586, baseX: 2775, r: 24, range: 54, speed: .78, phase: 1.6 },
        { x: 4810, y: 586, baseX: 4810, r: 25, range: 66, speed: .84, phase: 2.3 },
        { x: 6040, y: 570, baseX: 6040, r: 24, range: 60, speed: .8, phase: .8 },
      ],
      springs: [
        { x: 1860, y: 587, w: 54, h: 18 },
        { x: 2890, y: 602, w: 54, h: 18 },
        { x: 4940, y: 602, w: 54, h: 18 },
        { x: 6970, y: 597, w: 54, h: 18 },
      ],
      goal: { x: 7900, y: 474, w: 72, h: 116 },
      checkpoints: [
        { x: 2025, y: 534, active: false, label: "Haltepunkt Waldkante" },
        { x: 5060, y: 514, active: false, label: "Weichenhof" },
      ],
      checkpoint: { x: 2025, y: 534, active: false, label: "Haltepunkt Waldkante" },
      start: { x: 92, y: 522 },
      collected: 0,
      mechanic: "Schnelle Wagen, ein Höhenweg und ein Weichensignal",
      currents: [{ x: 5170, w: 700, push: 185 }],
      windZones: [],
      handcrafted: true,
      railAdventure: true,
      railBoostZones: [{ x: 5170, y: 600, w: 700 }],
      puzzleKind: "railSignal",
      puzzleAnchorIndex: 3,
      secretAnchorId: "rail-lookout-3",
      hints: [
        { x: 430, y: 620, text: "WAGEN MITNEHMEN – DANN HOCHSPRINGEN" },
        { x: 2765, y: 620, text: "HÖHENWEG: SELTENER FUND & GEHEIMGANG" },
        { x: 3605, y: 595, text: "WEICHE: DAS ROTE SIGNAL BERÜHREN" },
        { x: 6460, y: 615, text: "SCHNELLE TALSTRECKE – FEDERN NUTZEN" },
      ],
      decorations: [],
    };

    addPuzzleChallenge(level);
    addNextStageFeatures(level);
    const regional = REGIONAL_ITEMS.rail;
    level.items.push({
      id: "rail-master-ticket", x: 3875, y: 386, name: "Goldene Weichenkarte", type: "ticket", color: "#efc45c", rare: true,
      collected: game.foundItems.has(`${level.index}:rail-master-ticket`),
    });
    level.lifePickups.push({ id: "rail-life-lookout", x: 2810, y: 230, collected: false, phase: 3.8 });
    level.lifePickups.push({ id: "rail-life-depot", x: 7700, y: 286, collected: false, phase: 5.2 });
    level.items.push({
      id: "rail-depot-ticket", x: 7485, y: 398, name: regional.name, type: regional.type, color: regional.color,
      collected: game.foundItems.has(`${level.index}:rail-depot-ticket`),
    });
    removeGoalApproachCollectibles(level);
    return level;
  }

  function createFloodedMineLevel() {
    const index = LEVELS.findIndex((entry) => entry.underwater);
    const meta = LEVELS[index];
    const worldWidth = 6100;
    const platforms = [
      bonusGround("u-ground-0", 0, 646, 720, "mine"),
      bonusGround("u-ground-1", 930, 630, 620, "mine"),
      bonusGround("u-ground-2", 1810, 654, 760, "mine"),
      bonusGround("u-ground-3", 2840, 632, 620, "mine"),
      bonusGround("u-ground-4", 3740, 650, 760, "mine"),
      bonusGround("u-ground-5", 4780, 632, 1320, "mine"),
      bonusLedge("u-shelf-0", 360, 205, 250, "stone"),
      bonusLedge("u-shelf-1", 820, 435, 230, "wood"),
      bonusLedge("u-shelf-2", 1260, 250, 260, "mine"),
      bonusLedge("u-shelf-3", 1690, 405, 210, "wood"),
      bonusLedge("u-shelf-4", 2190, 190, 280, "stone"),
      bonusLedge("u-shelf-5", 2710, 420, 250, "wood"),
      bonusLedge("u-shelf-6", 3240, 235, 240, "mine"),
      bonusLedge("u-shelf-7", 3650, 435, 230, "wood"),
      bonusLedge("u-shelf-8", 4180, 190, 280, "stone"),
      bonusLedge("u-shelf-9", 4680, 390, 230, "wood"),
      bonusLedge("u-shelf-10", 5210, 230, 270, "mine"),
      bonusLedge("u-shelf-11", 5590, 420, 260, "wood"),
    ];
    const crystalSpots = [
      [250, 430], [470, 310], [700, 500], [990, 350], [1190, 500], [1410, 340],
      [1650, 230], [1880, 490], [2110, 350], [2380, 285], [2620, 510], [2870, 330],
      [3110, 485], [3360, 330], [3590, 210], [3830, 505], [4090, 350], [4350, 270],
      [4590, 510], [4870, 320], [5120, 470], [5380, 315], [5620, 520], [5840, 300],
    ];
    const collectibles = crystalSpots.map(([x, y], sparkIndex) => ({
      id: `tauch-c-${sparkIndex}`, x, y, collected: false, phase: sparkIndex * .59,
    }));
    const hazards = [
      [1120, 390, 90, .62], [2050, 505, 110, .7], [3040, 270, 92, .76],
      [4020, 490, 125, .65], [4930, 350, 105, .78], [5540, 245, 85, .82],
    ].map(([x, y, range, speed], hazardIndex) => ({
      x, y, baseX: x, r: 23, range, speed, phase: hazardIndex * 1.13, aquatic: true,
    }));
    const itemMeta = REGIONAL_ITEMS.underwater;
    return {
      ...meta,
      index,
      worldWidth,
      platforms,
      collectibles,
      hazards,
      springs: [],
      goal: { x: 5920, y: 280, w: 82, h: 122 },
      checkpoints: [
        { x: 2090, y: 330, active: false, label: "Versunkene Lore" },
        { x: 4240, y: 330, active: false, label: "Kristallbucht" },
      ],
      checkpoint: { x: 2090, y: 330, active: false, label: "Versunkene Lore" },
      start: { x: 90, y: 340 },
      collected: 0,
      bonusMultiplier: 5,
      mechanic: "Freies Tauchen durch Strömungen und versunkene Schächte",
      currents: [
        { x: 720, y: 115, w: 520, h: 470, push: 72, lift: -22 },
        { x: 2470, y: 120, w: 580, h: 470, push: -66, lift: 20 },
        { x: 4410, y: 120, w: 520, h: 470, push: 86, lift: -16 },
      ],
      windZones: [],
      items: [
        { id: "tauch-a", x: 1490, y: 188, name: itemMeta.name, type: itemMeta.type, color: itemMeta.color, collected: game.foundItems.has(`${index}:tauch-a`) },
        { id: "tauch-b", x: 3490, y: 500, name: "Alte Lorenplakette", type: "badge", color: "#d0a55d", collected: game.foundItems.has(`${index}:tauch-b`) },
        { id: "tauch-c", x: 5350, y: 180, name: "Türkiser Stollenkristall", type: "star", color: "#58e6df", collected: game.foundItems.has(`${index}:tauch-c`) },
      ],
      lifePickups: [
        { id: "tauch-life-0", x: 1050, y: 180, collected: false, phase: .7 },
        { id: "tauch-life-1", x: 2580, y: 525, collected: false, phase: 2.1 },
        { id: "tauch-life-2", x: 3900, y: 205, collected: false, phase: 3.4 },
        { id: "tauch-life-3", x: 5140, y: 500, collected: false, phase: 4.8 },
      ],
      secret: { found: true },
      secretEntrance: null,
      handcrafted: false,
    };
  }

  function createSolarRailBonusLevel() {
    const index = LEVELS.findIndex((entry) => entry.mood === "solar");
    const meta = LEVELS[index];
    const worldWidth = 6600;
    const platforms = [
      bonusGround("solar-ground-0", 0, 620, 790, "earth"),
      bonusGround("solar-ground-1", 970, 605, 760, "earth"),
      bonusGround("solar-ground-2", 1940, 625, 720, "earth"),
      bonusGround("solar-ground-3", 2890, 600, 820, "earth"),
      bonusGround("solar-ground-4", 3940, 620, 750, "earth"),
      bonusGround("solar-ground-5", 4910, 595, 840, "earth"),
      bonusGround("solar-ground-6", 5960, 615, 640, "earth"),
      bonusLedge("solar-roof-0", 330, 470, 230, "wood"),
      bonusLedge("solar-roof-1", 760, 355, 210, "stone"),
      bonusLedge("solar-roof-2", 1240, 430, 240, "wood"),
      bonusLedge("solar-roof-3", 1650, 310, 220, "stone"),
      bonusLedge("solar-roof-4", 2170, 450, 230, "wood"),
      bonusLedge("solar-roof-5", 2580, 330, 230, "stone"),
      bonusLedge("solar-roof-6", 3150, 440, 260, "wood"),
      bonusLedge("solar-roof-7", 3590, 300, 230, "stone"),
      bonusLedge("solar-roof-8", 4180, 445, 245, "wood"),
      bonusLedge("solar-roof-9", 4620, 335, 240, "stone"),
      bonusLedge("solar-roof-10", 5250, 425, 255, "wood"),
      bonusLedge("solar-roof-11", 5700, 300, 230, "stone"),
    ];
    const sparkSpots = [
      [210, 535], [430, 385], [690, 500], [890, 275], [1120, 505], [1370, 350],
      [1580, 510], [1760, 230], [2070, 520], [2280, 365], [2510, 510], [2690, 255],
      [3020, 495], [3270, 355], [3480, 500], [3700, 220], [4050, 510], [4290, 360],
      [4510, 505], [4740, 270], [5070, 485], [5370, 335], [5590, 500], [5830, 225], [6160, 505],
    ];
    const level = {
      ...meta,
      index,
      worldWidth,
      platforms,
      collectibles: sparkSpots.map(([x, y], sparkIndex) => ({ id: `solar-c-${sparkIndex}`, x, y, collected: false, phase: sparkIndex * .57 })),
      hazards: [
        { x: 1060, y: 470, baseX: 1060, baseY: 470, r: 21, range: 76, verticalRange: 18, speed: .68, phase: .4, kind: "sunBoost" },
        { x: 2810, y: 430, baseX: 2810, baseY: 430, r: 21, range: 80, verticalRange: 20, speed: .72, phase: 2.1, kind: "sunBoost" },
        { x: 4700, y: 400, baseX: 4700, baseY: 400, r: 21, range: 84, verticalRange: 18, speed: .76, phase: 4.2, kind: "sunBoost" },
        { x: 3500, y: 565, baseX: 3500, r: 24, range: 72, speed: .78, phase: 1.5 },
      ],
      springs: [
        { x: 690, y: 587, w: 54, h: 18 },
        { x: 2700, y: 582, w: 54, h: 18 },
        { x: 5650, y: 577, w: 54, h: 18 },
      ],
      goal: { x: 6420, y: 499, w: 72, h: 116 },
      checkpoints: [
        { x: 2110, y: 539, active: false, label: "Sonnenwiese" },
        { x: 4610, y: 534, active: false, label: "Ladestation" },
      ],
      checkpoint: { x: 2110, y: 539, active: false, label: "Sonnenwiese" },
      start: { x: 92, y: 522 },
      collected: 0,
      mechanic: "Sonnenfunken laden die leise Bergbahn für die Heimfahrt",
      currents: [],
      windZones: [],
      items: [
        { id: "solar-a", x: 1840, y: 266, name: "Sonnenbahn-Fahrkarte", type: "ticket", color: "#f2c857", collected: game.foundItems.has(`${index}:solar-a`) },
        { id: "solar-b", x: 3870, y: 518, name: "Goldener Ladefunke", type: "star", color: "#ffcb48", collected: game.foundItems.has(`${index}:solar-b`) },
        { id: "solar-c", x: 5890, y: 255, name: "Kleiner Solarkompass", type: "badge", color: "#e6a33c", collected: game.foundItems.has(`${index}:solar-c`) },
      ],
      lifePickups: [
        { id: "solar-life-0", x: 1450, y: 380, collected: false, phase: .9 },
        { id: "solar-life-1", x: 3480, y: 520, collected: false, phase: 2.7 },
        { id: "solar-life-2", x: 5480, y: 380, collected: false, phase: 4.5 },
      ],
      secret: { found: true },
      secretEntrance: null,
      handcrafted: false,
    };
    addPuzzleChallenge(level);
    return level;
  }

  function createLevel(index) {
    if (LEVELS[index]?.underwater) {
      const floodedMine = createFloodedMineLevel();
      removeGoalApproachCollectibles(floodedMine);
      return floodedMine;
    }
    if (LEVELS[index]?.mood === "solar") {
      const solarRail = createSolarRailBonusLevel();
      removeGoalApproachCollectibles(solarRail);
      return solarRail;
    }
    if (index === 0) {
      const seiffen = createSeiffenLevel();
      addPuzzleChallenge(seiffen);
      addNextStageFeatures(seiffen);
      removeGoalApproachCollectibles(seiffen);
      return seiffen;
    }
    const rng = seededRandom(9103 + index * 719);
    const worldWidth = 8600 + index * 280;
    const platforms = [];
    const collectibles = [];
    const hazards = [];
    const springs = [];
    let cursor = 0;
    let platformId = 0;

    while (cursor < worldWidth - 280) {
      const segmentIndex = platforms.filter((item) => item.ground).length;
      const passage = segmentIndex % 4;
      const isSprintPassage = passage === 0 || passage === 3;
      const width = Math.min(
        (isSprintPassage ? 940 + rng() * 240 : 650 + rng() * 220),
        worldWidth - cursor,
      );
      const y = segmentIndex === 0 ? 610 : 570 + rng() * 66;
      const platform = {
        id: `p-${platformId++}`,
        x: cursor,
        y,
        baseX: cursor,
        baseY: y,
        w: width,
        h: H - y + 80,
        ground: true,
        type: index === 2 ? "mine" : index === 5 ? "roof" : "earth",
        sprintPassage: isSprintPassage,
      };
      platforms.push(platform);

      const elevatedCount = isSprintPassage ? 1 : 2 + (rng() > 0.67 ? 1 : 0);
      for (let j = 0; j < elevatedCount; j += 1) {
        const elevatedWidth = isSprintPassage ? 220 + rng() * 95 : 165 + rng() * 105;
        const px = cursor + 90 + rng() * Math.max(90, width - elevatedWidth - 140);
        const py = isSprintPassage ? y - 108 - rng() * 25 : y - 102 - j * 78 - rng() * 24;
        platforms.push({
          id: `p-${platformId++}`,
          x: px,
          y: py,
          baseX: px,
          baseY: py,
          w: elevatedWidth,
          h: 26,
          ground: false,
          type: levelPlatformType(index, segmentIndex, j),
          moving: !isSprintPassage && segmentIndex > 0 && (segmentIndex + j + index) % 4 === 0,
          moveRange: 55 + rng() * 70,
          moveSpeed: 0.55 + rng() * 0.45,
          moveAxis: rng() > 0.45 ? "x" : "y",
          phase: rng() * TAU,
        });
      }

      const count = isSprintPassage ? 6 + Math.floor(rng() * 2) : 4 + Math.floor(rng() * 2);
      for (let j = 0; j < count; j += 1) {
        collectibles.push({
          id: `c-${segmentIndex}-${j}`,
          x: cursor + 105 + (j * (width - 210)) / Math.max(1, count - 1),
          y: y - 64 - (isSprintPassage ? Math.sin(j * 1.45) * 22 : (j % 2) * 24),
          collected: false,
          phase: rng() * TAU,
        });
      }

      if (!isSprintPassage && segmentIndex > 0) {
        hazards.push({
          x: cursor + width * 0.52,
          y: y - 34,
          baseX: cursor + width * 0.52,
          r: 25,
          range: Math.min(100, width * 0.22),
          speed: 0.7 + rng() * 0.35,
          phase: rng() * TAU,
        });
      }

      if (passage === 2 && index >= 2) {
        hazards.push({
          x: cursor + width * .74,
          y: y - 132,
          baseX: cursor + width * .74,
          baseY: y - 132,
          r: 21,
          range: Math.min(76, width * .16),
          verticalRange: 22,
          speed: .62 + rng() * .22,
          phase: rng() * TAU,
          kind: "sunBoost",
        });
      }

      if ((isSprintPassage && segmentIndex > 0) || (segmentIndex + index) % 6 === 3) {
        springs.push({ x: cursor + width - 110, y: y - 18, w: 54, h: 18 });
      }

      const gap = isSprintPassage ? 120 + rng() * 58 : 165 + rng() * Math.min(92 + index * 4, 142);
      cursor += width + gap;
    }

    const lastGround = [...platforms].reverse().find((item) => item.ground);
    if (lastGround.x + lastGround.w < worldWidth) {
      lastGround.w = worldWidth - lastGround.x;
    }

    const grounds = platforms.filter((item) => item.ground);
    const checkpoints = createCheckpointRoute(grounds);

    const level = {
      ...LEVELS[index],
      index,
      worldWidth,
      platforms,
      collectibles,
      hazards,
      springs,
      goal: { x: lastGround.x + lastGround.w - 150, y: lastGround.y - 116, w: 72, h: 116 },
      checkpoints,
      checkpoint: checkpoints[0],
      start: { x: 92, y: platforms[0].y - 98 },
      collected: 0,
    };
    addRegionalFeatures(level);
    addPuzzleChallenge(level);
    addNextStageFeatures(level);
    removeGoalApproachCollectibles(level);
    return level;
  }

  function removeGoalApproachCollectibles(level) {
    if (!level.goal || !level.collectibles) return;
    const clearZoneStart = level.goal.x - 300;
    level.collectibles = level.collectibles.filter((collectible) => collectible.x < clearZoneStart);
  }

  function levelPlatformType(levelIndex, segmentIndex, ledgeIndex) {
    if (LEVELS[levelIndex]?.mood === "rail" && (segmentIndex + ledgeIndex) % 2 === 0) return "train";
    if (LEVELS[levelIndex]?.mood === "rooftops" || LEVELS[levelIndex]?.mood === "night") return "roof";
    if (LEVELS[levelIndex]?.mood === "mine" || LEVELS[levelIndex]?.mood === "rocks") return "stone";
    return (segmentIndex + ledgeIndex + levelIndex) % 3 === 0 ? "wood" : "stone";
  }

  function createCheckpointRoute(grounds, ratios = [.34, .68]) {
    const routeEnd = grounds[grounds.length - 1].x + grounds[grounds.length - 1].w;
    return ratios.map((ratio, index) => {
      const targetX = routeEnd * ratio;
      const anchor = grounds.reduce((best, ground) => (
        Math.abs((ground.x + ground.w * .5) - targetX) < Math.abs((best.x + best.w * .5) - targetX) ? ground : best
      ));
      return {
        x: anchor.x + Math.max(54, Math.min(anchor.w - 64, anchor.w * .48)),
        y: anchor.y - 86,
        active: false,
        label: index === 0 ? "Erste Rast" : "Zweite Rast",
      };
    });
  }

  const PUZZLE_KINDS = [
    { id: "crystalChime", name: "Kristallklang", hint: "Bringe die drei Kristalle zum Klingen." },
    { id: "crankBridge", name: "Kurbelbrücke", hint: "Drehe die hölzerne Kurbel." },
    { id: "solarRelay", name: "Sonnenfänger", hint: "Lade das Solarfeld einen Moment auf." },
    { id: "railSignal", name: "Bahn-Signal", hint: "Schalte das grüne Signal frei." },
    { id: "windWheels", name: "Windrad-Reihe", hint: "Bringe die drei Windräder nacheinander in Schwung." },
  ];

  function addPuzzleChallenge(level) {
    if (level.underwater || level.isBonusRoom) return;
    const grounds = level.platforms.filter((platform) => platform.ground);
    if (grounds.length < 3) return;

    const kind = level.puzzleKind
      ? PUZZLE_KINDS.find((entry) => entry.id === level.puzzleKind)
      : level.mood === "solar"
        ? PUZZLE_KINDS.find((entry) => entry.id === "solarRelay")
        : PUZZLE_KINDS[level.index % PUZZLE_KINDS.length];
    const requestedAnchor = Number.isFinite(level.puzzleAnchorIndex) ? level.puzzleAnchorIndex : Math.floor(grounds.length * .54);
    const anchorIndex = Math.max(1, Math.min(grounds.length - 2, requestedAnchor));
    const anchor = grounds[anchorIndex];
    const baseX = anchor.x + Math.min(anchor.w * .52, Math.max(170, anchor.w - 230));
    const bridgeY = anchor.y - 136;
    const bridge = {
      id: `puzzle-bridge-${level.index}`,
      x: baseX + 160,
      y: bridgeY,
      baseX: baseX + 160,
      baseY: bridgeY,
      w: 242,
      h: 26,
      ground: false,
      type: kind.id === "railSignal" ? "train" : kind.id === "solarRelay" ? "stone" : "wood",
      moving: false,
      moveRange: 0,
      moveSpeed: 0,
      moveAxis: "x",
      phase: 0,
      puzzleBridge: true,
      active: false,
    };
    const puzzle = {
      ...kind,
      solved: false,
      progress: 0,
      charge: 0,
      bridgeId: bridge.id,
      nodes: [],
    };
    const node = (x, y, index = puzzle.nodes.length) => puzzle.nodes.push({ x, y, index, active: false, radius: 27 });

    if (kind.id === "crystalChime") {
      node(baseX - 52, anchor.y - 42, 0);
      node(baseX + 38, anchor.y - 105, 1);
      node(baseX + 128, anchor.y - 42, 2);
    } else if (kind.id === "windWheels") {
      node(baseX - 36, anchor.y - 48, 0);
      node(baseX + 66, anchor.y - 96, 1);
      node(baseX + 154, anchor.y - 48, 2);
    } else {
      node(baseX + 28, anchor.y - 48, 0);
    }

    level.platforms.push(bridge);
    level.collectibles.push({
      id: `puzzle-reward-${level.index}`,
      x: bridge.x + bridge.w * .5,
      y: bridge.y - 42,
      collected: false,
      phase: level.index * 1.71,
    });
    level.puzzle = puzzle;
  }

  function completePuzzle(level, puzzle) {
    if (puzzle.solved) return;
    puzzle.solved = true;
    const bridge = level.platforms.find((platform) => platform.id === puzzle.bridgeId);
    if (bridge) bridge.active = true;
    const lastNode = puzzle.nodes[puzzle.nodes.length - 1];
    burst(lastNode.x, lastNode.y, "#ffe27a", 28, 250);
    playTone(540, .12, "triangle", .04, 170);
    window.setTimeout(() => playTone(760, .16, "sine", .035, 150), 75);
    showToast(`${puzzle.name} gelöst – der Höhenweg ist frei!`);
  }

  function updatePuzzleChallenge(level, player, dt) {
    const puzzle = level.puzzle;
    if (!puzzle || puzzle.solved) return;
    const playerCenter = { x: player.x + player.w * .5, y: player.y + player.h * .5 };
    const isNear = (node) => Math.hypot(playerCenter.x - node.x, playerCenter.y - node.y) < node.radius + 24;

    if (puzzle.id === "solarRelay") {
      const relay = puzzle.nodes[0];
      if (isNear(relay)) {
        puzzle.charge = Math.min(1.15, puzzle.charge + dt);
        relay.active = true;
        if (puzzle.charge >= 1.1) completePuzzle(level, puzzle);
      } else {
        puzzle.charge = Math.max(0, puzzle.charge - dt * .26);
      }
      return;
    }

    const sequential = puzzle.id === "crystalChime" || puzzle.id === "windWheels";
    for (const node of puzzle.nodes) {
      if (node.active || !isNear(node)) continue;
      if (sequential && node.index !== puzzle.progress) continue;
      node.active = true;
      puzzle.progress += 1;
      burst(node.x, node.y, puzzle.id === "windWheels" ? "#bce9f0" : "#ffd35d", 11, 145);
      playTone(440 + node.index * 120, .09, "sine", .035, 90);
      if (puzzle.progress >= puzzle.nodes.length) completePuzzle(level, puzzle);
      break;
    }
  }

  function addRegionalFeatures(level) {
    const grounds = level.platforms.filter((platform) => platform.ground);
    const regional = {
      village: "Fachwerk-Fenster und Holzfiguren",
      mine: "Kristalllicht zeigt den Weg",
      river: "Sanfte Wasserströmungen",
      rail: "Fahrende Bimmelbahn-Plattformen",
      rooftops: "Schieferdächer und Schornsteine",
      night: "Laternen weisen durch die Nacht",
      rocks: "Granit-Stufen zum Klettern",
      castle: "Burgwind über Wolkenstein",
      summit: "Gipfelwind und Aussichtstürme",
    };
    level.mechanic = regional[level.mood] || "Holzwerkstätten und Fichten";
    level.currents = [];
    level.windZones = [];

    if (level.mood === "rail") {
      for (let i = 1; i < Math.min(grounds.length, 6); i += 2) {
        const ground = grounds[i];
        level.platforms.push({
          id: `train-${i}`,
          x: ground.x + 55,
          y: ground.y - 145,
          baseX: ground.x + 55,
          baseY: ground.y - 145,
          w: Math.min(245, ground.w - 70), h: 30, ground: false, type: "train",
          moving: true, moveRange: Math.min(125, ground.w * .2), moveSpeed: .36 + i * .025, moveAxis: "x", phase: i * .85,
        });
      }
    }

    if (level.mood === "rocks") {
      for (let i = 1; i < Math.min(grounds.length, 7); i += 2) {
        const ground = grounds[i];
        for (let step = 0; step < 3; step += 1) {
          level.platforms.push({
            id: `climb-${i}-${step}`, x: ground.x + 70 + step * 78, y: ground.y - 88 - step * 72,
            baseX: ground.x + 70 + step * 78, baseY: ground.y - 88 - step * 72,
            w: 95, h: 25, ground: false, type: "stone", moving: false, moveRange: 0, moveSpeed: 0, moveAxis: "x", phase: 0,
          });
        }
      }
    }

    if (level.mood === "summit" || level.mood === "castle") {
      for (let i = 1; i < grounds.length; i += 3) {
        const ground = grounds[i];
        level.windZones.push({ x: ground.x + ground.w * .2, w: ground.w * .46, push: i % 2 ? 105 : -85 });
      }
    }
  }

  function addNextStageFeatures(level) {
    const itemMeta = REGIONAL_ITEMS[level.mood] || REGIONAL_ITEMS.forest;
    const grounds = level.platforms.filter((platform) => platform.ground);
    const ledges = level.platforms.filter((platform) => !platform.ground && !platform.moving && !platform.puzzleBridge && platform.w >= 135);
    const entranceAnchor = level.secretAnchorId
      ? level.platforms.find((platform) => platform.id === level.secretAnchorId)
      : level.handcrafted
        ? level.platforms.find((platform) => platform.id === "s-secret-3")
      : ledges
        .filter((platform) => platform.x > level.worldWidth * .28 && platform.x < level.worldWidth * .72)
        .sort((a, b) => a.y - b.y)[0] || ledges[Math.floor(ledges.length / 2)];
    const safeAnchor = entranceAnchor || grounds[Math.max(1, Math.floor(grounds.length * .45))];

    level.secretEntrance = {
      x: safeAnchor.x + Math.max(14, safeAnchor.w - 76),
      y: safeAnchor.y - 86,
      w: 60,
      h: 86,
      returnX: safeAnchor.x + Math.min(24, safeAnchor.w - 64),
      returnY: safeAnchor.y - 92,
      label: "Geheimer Stolleneingang",
    };
    level.secret = { ...level.secretEntrance, found: false, used: false };

    const firstGround = grounds[Math.min(1, grounds.length - 1)] || grounds[0];
    const lateLedge = ledges
      .filter((platform) => platform.x > level.worldWidth * .58)
      .sort((a, b) => a.x - b.x)[0] || ledges[ledges.length - 1] || grounds[grounds.length - 1];
    const highRouteCandidates = ledges
      .filter((platform) => platform.y < 455)
      .sort((a, b) => a.x - b.x);
    const highRouteLedges = highRouteCandidates
      .filter((platform, index) => index % Math.max(1, Math.ceil(highRouteCandidates.length / 3)) === 0)
      .slice(0, 3);
    const itemIdA = `${level.index}:main-a`;
    const itemIdB = `${level.index}:main-b`;
    level.items = [
      {
        id: "main-a", x: firstGround.x + Math.min(firstGround.w - 70, 250), y: firstGround.y - 39,
        name: itemMeta.name, type: itemMeta.type, color: itemMeta.color, collected: game.foundItems.has(itemIdA),
      },
      {
        id: "main-b", x: lateLedge.x + lateLedge.w * .5, y: lateLedge.y - 39,
        name: itemMeta.name, type: itemMeta.type, color: itemMeta.color, collected: game.foundItems.has(itemIdB),
      },
      ...highRouteLedges.map((ledge, index) => ({
        id: `high-route-${index}`,
        x: ledge.x + ledge.w * .5,
        y: ledge.y - 42,
        name: index === 0 ? `Höhenfund: ${itemMeta.name}` : index === 1 ? "Bergkamm-Abzeichen" : "Aussichtsstern",
        type: index === 1 ? "badge" : "star",
        color: index === 1 ? "#d7a84a" : "#f3c95d",
        rare: true,
        collected: game.foundItems.has(`${level.index}:high-route-${index}`),
      })),
    ];

    const lifeAnchors = [
      grounds[Math.min(2, grounds.length - 1)] || firstGround,
      highRouteLedges[1] || highRouteLedges[0] || ledges[Math.floor(ledges.length * .42)] || safeAnchor,
      grounds[Math.max(0, grounds.length - 2)] || lateLedge,
    ];
    level.lifePickups = lifeAnchors.map((anchor, index) => ({
      id: `main-life-${index}`,
      x: anchor.x + Math.max(34, Math.min(anchor.w - 34, anchor.w * (index === 1 ? .64 : .38))),
      y: anchor.y - 48,
      collected: false,
      phase: index * 1.71 + level.index * .43,
    }));
  }

  function createSecretRoom(parentLevel) {
    const itemMeta = REGIONAL_ITEMS[parentLevel.mood] || REGIONAL_ITEMS.forest;
    const roomId = parentLevel.index;
    const layout = SECRET_ROOM_LAYOUTS[roomId] || SECRET_ROOM_LAYOUTS[0];
    const grounds = layout.grounds.map(([x, y, w], index) => bonusGround(`b-g${index}`, x, y, w, layout.groundType));
    const ledges = layout.ledges.map(([x, y, w, type, movement, extra], index) => (
      bonusLedge(`b-l${index}`, x, y, w, type || layout.ledgeType, movement, extra)
    ));
    const platforms = [...grounds, ...ledges];
    const lastGround = grounds[grounds.length - 1];
    const middleGround = grounds[Math.floor(grounds.length / 2)];
    const checkpoints = createCheckpointRoute(grounds, [.34, .68]);
    const sparkSpots = [
      ...ledges.slice(0, 8).map((platform) => [platform.x + platform.w * .5, platform.y - 54]),
      ...grounds.slice(1, 4).map((platform) => [platform.x + platform.w * .52, platform.y - 62]),
    ];
    const treasureAnchors = [ledges[2], ledges[Math.floor(ledges.length * .62)], ledges[ledges.length - 2]];
    const room = {
      ...parentLevel,
      name: `Geheimlevel: ${layout.name}`,
      short: layout.name,
      subtitle: layout.mechanic,
      mood: layout.mood,
      backdrop: layout.backdrop,
      parentMood: parentLevel.mood,
      mechanic: layout.mechanic,
      specialMechanic: layout.special,
      isBonusRoom: true,
      handcrafted: false,
      worldWidth: layout.worldWidth,
      platforms,
      springs: layout.springs.map(([x, y]) => ({ x, y, w: 54, h: 18 })),
      hazards: layout.hazards.map(([x, y, range, speed], index) => ({ x, y, baseX: x, r: 24, range, speed, phase: index * 1.37 + .4 })),
      collectibles: sparkSpots.map(([x, y], index) => ({ id: `bonus-c-${index}`, x, y, collected: false, phase: index * .57 })),
      items: [
        bonusItem(roomId, "bonus-a", treasureAnchors[0].x + treasureAnchors[0].w * .5, treasureAnchors[0].y - 45, itemMeta),
        bonusItem(roomId, "bonus-b", treasureAnchors[1].x + treasureAnchors[1].w * .5, treasureAnchors[1].y - 45, { name: "Glückstaler", type: "coin", color: "#e0b54d" }),
        bonusItem(roomId, "bonus-c", treasureAnchors[2].x + treasureAnchors[2].w * .5, treasureAnchors[2].y - 45, { name: "Altes Grubenlicht", type: "lantern", color: "#f2a83d" }),
      ],
      lifePickups: [
        { id: "bonus-life-a", x: grounds[1].x + grounds[1].w * .42, y: grounds[1].y - 48, collected: false, phase: .8 },
        { id: "bonus-life-b", x: ledges[Math.floor(ledges.length * .5)].x + ledges[Math.floor(ledges.length * .5)].w * .5, y: ledges[Math.floor(ledges.length * .5)].y - 48, collected: false, phase: 2.4 },
        { id: "bonus-life-c", x: lastGround.x + lastGround.w * .34, y: lastGround.y - 48, collected: false, phase: 4.1 },
      ],
      goal: { x: lastGround.x + lastGround.w - 112, y: lastGround.y - 116, w: 72, h: 116, returnPortal: true },
      checkpoints,
      checkpoint: checkpoints[0],
      start: { x: 72, y: grounds[0].y - 98 },
      collected: 0,
      currents: (layout.currents || []).map(([x, w, push]) => ({ x, w, push })),
      windZones: (layout.wind || []).map(([x, w, push]) => ({ x, w, push })),
      secret: { found: true },
      secretEntrance: null,
    };
    removeGoalApproachCollectibles(room);
    return room;
  }

  function bonusGround(id, x, y, w, type = "mine") {
    return { id, x, y, baseX: x, baseY: y, w, h: H - y + 80, ground: true, type };
  }

  function bonusLedge(id, x, y, w, type, movement = null, extra = null) {
    return {
      id, x, y, baseX: x, baseY: y, w, h: 26, ground: false, type,
      moving: Boolean(movement), moveRange: movement?.range || 0, moveSpeed: movement?.speed || 0,
      moveAxis: movement?.axis || "x", phase: movement?.phase || 0,
      ...(extra || {}),
    };
  }

  function bonusItem(levelIndex, id, x, y, meta) {
    return {
      id, x, y, name: meta.name, type: meta.type, color: meta.color,
      collected: game.foundItems.has(`${levelIndex}:${id}`),
    };
  }

  function createPlayer(start, underwater = false) {
    return {
      x: start.x,
      y: start.y,
      prevY: start.y,
      w: underwater ? 96 : 44,
      h: underwater ? 48 : 92,
      vx: 0,
      vy: 0,
      direction: 1,
      onGround: false,
      groundId: null,
      coyote: 0,
      jumpBuffer: 0,
      respawnX: start.x,
      respawnY: start.y,
      invincible: 0,
      landing: 0,
      takeoff: 0,
      state: underwater ? "swim" : "idle",
      runCycle: 0,
      stepDust: 0,
      surfaceType: underwater ? "water" : "earth",
      airtime: 0,
      sunBoost: 0,
    };
  }

  function startLevel(index, { resetHearts = true } = {}) {
    clearTimeout(restartTimer);
    restartTimer = 0;
    game.levelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
    game.level = createLevel(game.levelIndex);
    stage.classList.toggle("is-underwater", Boolean(game.level.underwater));
    game.player = createPlayer(game.level.start, game.level.underwater);
    game.cameraX = 0;
    game.cameraY = 0;
    game.cameraLookX = 0;
    game.cameraKick = 0;
    game.mainLevel = null;
    game.mainPlayer = null;
    game.mainCameraX = 0;
    game.inSecretRoom = false;
    game.secretCooldown = 0;
    game.sparks = 0;
    game.particles.length = 0;
    game.runStartedAt = performance.now();
    game.mode = "playing";
    if (resetHearts) game.hearts = START_LIVES;
    game.lifeTalentUsed = false;
    game.safetyNetUsed = false;
    game.musicBeatAt = 0;
    game.musicStep = 0;
    closeAllPanels();
    canvas.focus({ preventScroll: true });
    updateHud();
    saveProgress();
    playTone(340, 0.09, "sine", 0.04);
    playRegionalIntro(game.level);
    showToast(game.level.underwater
      ? "Bonuslevel: Tauchstollen · alles Eingesammelte zählt ×5!"
      : game.level.mood === "solar"
        ? "Bonuslevel: Sonnenbahn · lade die ruhige Bergbahn für die Heimfahrt!"
      : `Level ${game.levelIndex + 1}: ${game.level.short} · ${game.level.mechanic || "Wanderfreude"}`);
  }

  function enterSecretRoom() {
    if (game.inSecretRoom || game.secretCooldown > 0 || !game.level?.secretEntrance || game.level.secret?.used) return;
    const parent = game.level;
    parent.secret.found = true;
    parent.secret.used = true;
    parent.secretRoom ||= createSecretRoom(parent);
    game.mainLevel = parent;
    game.mainPlayer = game.player;
    game.mainCameraX = game.cameraX;
    game.level = parent.secretRoom;
    game.player = createPlayer(game.level.start, game.level.underwater);
    game.cameraX = 0;
    game.cameraY = 0;
    game.cameraLookX = 0;
    game.cameraKick = 0;
    game.inSecretRoom = true;
    game.secretCooldown = 1;
    game.musicBeatAt = 0;
    game.musicStep = 0;
    burst(game.player.x + 40, game.player.y + 45, "#ffc64d", 24, 210);
    updateHud();
    playRegionalIntro(game.level);
    showToast("Geheimgang entdeckt – finde die verborgene Schatzkammer!");
  }

  function leaveSecretRoom() {
    if (!game.inSecretRoom || !game.mainLevel || !game.mainPlayer) return;
    const room = game.level;
    const parent = game.mainLevel;
    const entrance = parent.secretEntrance;
    parent.secretRoom = room;
    game.level = parent;
    game.player = game.mainPlayer;
    game.player.x = entrance.returnX;
    game.player.y = entrance.returnY;
    game.player.prevY = game.player.y;
    game.player.vx = 0;
    game.player.vy = 0;
    game.player.invincible = 1;
    game.cameraX = Math.max(0, game.mainCameraX - 40);
    game.cameraY = 0;
    game.cameraLookX = 0;
    game.cameraKick = 0;
    game.mainLevel = null;
    game.mainPlayer = null;
    game.inSecretRoom = false;
    game.secretCooldown = 1.25;
    game.musicBeatAt = 0;
    game.musicStep = 0;
    updateHud();
    playTone(520, .13, "sine", .04, 260);
    playRegionalIntro(game.level);
    showToast("Zurück im Hauptlevel – die gefundenen Schätze bleiben im Rucksack.");
  }

  function closeAllPanels() {
    [ui.start, ui.map, ui.pause, ui.skills, ui.outfits, ui.inventory, ui.finish].forEach((panel) => { panel.hidden = true; });
  }

  function openPanel(panel) {
    [ui.map, ui.pause, ui.skills, ui.outfits, ui.inventory, ui.finish].forEach((item) => {
      if (item !== panel) item.hidden = true;
    });
    panel.hidden = false;
  }

  function pauseGame(panel = ui.pause) {
    if (game.mode !== "playing") return;
    game.mode = "paused";
    game.pausedAt = performance.now();
    openPanel(panel);
  }

  function resumeGame() {
    if (!game.level) return;
    if (game.pausedAt) game.runStartedAt += performance.now() - game.pausedAt;
    game.mode = "playing";
    closeAllPanels();
  }

  function openStartScreen() {
    const canResume = game.level && (game.mode === "playing" || game.mode === "paused");
    game.startReturnMode = canResume ? "playing" : null;
    if (game.mode === "playing") {
      game.mode = "paused";
      game.pausedAt = performance.now();
    }
    closeAllPanels();
    ui.start.hidden = false;
    ui.startButton.innerHTML = canResume
      ? "Weiterspielen <span aria-hidden=\"true\">→</span>"
      : "Abenteuer starten <span aria-hidden=\"true\">→</span>";
  }

  function openOverlay(panel) {
    game.panelReturnMode = game.mode;
    if (game.mode === "playing") {
      game.mode = "paused";
      game.pausedAt = performance.now();
    }
    ui.start.hidden = true;
    openPanel(panel);
  }

  function closeOverlay() {
    const returnMode = game.panelReturnMode;
    game.panelReturnMode = null;
    if (returnMode === "menu") {
      closeAllPanels();
      ui.start.hidden = false;
      game.mode = "menu";
    } else if (returnMode === "finished") {
      game.mode = "finished";
      openPanel(ui.finish);
    } else {
      resumeGame();
    }
  }

  function completeLevel() {
    if (game.mode !== "playing") return;
    game.mode = "finished";
    game.completed.add(game.levelIndex);
    game.unlocked = Math.max(game.unlocked, Math.min(LEVELS.length, game.levelIndex + 2));
    saveProgress();
    playJingle();
    const bonusRoom = game.level.secretRoom;
    const totalSparks = game.level.collectibles.length + (bonusRoom?.collectibles.length || 0);
    const foundSparks = game.level.collectibles.filter((item) => item.collected).length
      + (bonusRoom?.collectibles.filter((item) => item.collected).length || 0);
    const totalItems = (game.level.items?.length || 0) + (bonusRoom?.items?.length || 0);
    const foundItems = (game.level.items?.filter((item) => item.collected).length || 0)
      + (bonusRoom?.items?.filter((item) => item.collected).length || 0);
    ui.finishSparkCount.textContent = `${foundSparks}/${totalSparks}`;
    ui.finishItemCount.textContent = `${foundItems}/${totalItems}`;
    ui.finishTime.textContent = formatTime((performance.now() - game.runStartedAt) / 1000);
    const foundEverySpark = foundSparks === totalSparks;
    const foundSecret = game.level.secret?.found;
    ui.finishText.textContent = game.level.underwater
      ? foundEverySpark
        ? `${game.playerName} hat jeden Bergfunken im gefluteten Stollen geborgen – jeder Fund zählte fünffach!`
        : `${game.playerName} hat den versunkenen Ausgang erreicht. Im Wasser glitzern noch fünffache Schätze.`
      : game.level.mood === "solar"
        ? foundEverySpark
          ? `${game.playerName} hat alle Sonnenfunken gesammelt und die leise Bergbahn für die Heimfahrt geladen!`
          : `${game.playerName} hat die Sonnenbahn erreicht. Einige Sonnenfunken warten noch auf den Rückweg.`
      : foundEverySpark && foundSecret
        ? `${game.playerName} hat jeden Bergfunken und den geheimen Zwischenlevel entdeckt!`
      : foundSecret
        ? `${game.playerName} hat das Ziel und den geheimen Zwischenlevel gefunden.`
        : foundEverySpark
          ? `${game.playerName} hat jeden Bergfunken entdeckt! Ein Stolleneingang ist noch verborgen.`
          : `${game.playerName} hat den Weg geschafft. Geheimgang, Andenken und Bergfunken warten noch.`;
    const next = LEVELS[game.levelIndex + 1];
    ui.nextLevel.textContent = game.levelIndex === LEVELS.length - 1
      ? "Noch einmal auf Sonnenreise ↻"
      : next?.bonus ? `Bonuslevel: ${next.short} →` : "Nächster Ort →";
    openPanel(ui.finish);
  }

  function nextLevel() {
    startLevel(game.levelIndex === LEVELS.length - 1 ? 0 : game.levelIndex + 1);
  }

  function update(dt) {
    game.time += dt;
    game.secretCooldown = Math.max(0, game.secretCooldown - dt);
    updateParticles(dt);
    if (game.mode !== "playing" || !game.player) return;

    const level = game.level;
    const player = game.player;
    updateRegionalMusic(level);
    const wasOnGround = player.onGround;
    player.prevY = player.y;
    player.invincible = Math.max(0, player.invincible - dt);
    player.landing = Math.max(0, player.landing - dt);
    player.takeoff = Math.max(0, player.takeoff - dt);
    player.stepDust = Math.max(0, player.stepDust - dt);
    player.sunBoost = Math.max(0, player.sunBoost - dt);
    player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
    player.coyote = player.onGround ? 0.11 : Math.max(0, player.coyote - dt);

    for (const platform of level.platforms) {
      if (platform.puzzleBridge) {
        platform.active = Boolean(level.puzzle?.solved);
        platform.visibility = platform.active ? 1 : 0;
      } else if (platform.toggle) {
        const glowWave = (Math.sin(game.time * TAU / platform.toggle.period + platform.toggle.phase) + 1) * .5;
        platform.visibility = .12 + glowWave * .88;
        platform.active = platform.visibility > .34;
      } else {
        platform.visibility = 1;
        platform.active = true;
      }
      if (platform.moving) {
        const wave = Math.sin(game.time * platform.moveSpeed + platform.phase) * platform.moveRange;
        platform.x = platform.baseX + (platform.moveAxis === "x" ? wave : 0);
        platform.y = platform.baseY + (platform.moveAxis === "y" ? wave : 0);
      }
    }

    for (const hazard of level.hazards) updateHazardMotion(hazard, level);

    const move = (held.left || pressed.has("ArrowLeft") || pressed.has("KeyA") ? -1 : 0)
      + (held.right || pressed.has("ArrowRight") || pressed.has("KeyD") ? 1 : 0);
    const underwater = Boolean(level.underwater);
    const swimVertical = (isJumpHeld() ? -1 : 0)
      + (held.down || pressed.has("ArrowDown") || pressed.has("KeyS") ? 1 : 0);
    const icy = level.specialMechanic === "ice-wind";
    const sprintTalent = game.talents.has("trailRunner");
    const sunPowered = player.sunBoost > 0;
    const acceleration = (underwater ? 980 : player.onGround ? (icy ? 1780 : 2550) : 1550) * (sprintTalent ? 1.12 : 1) * (sunPowered ? 1.24 : 1);
    const maxSpeed = (underwater ? 285 : 385) * (sprintTalent ? 1.14 : 1) * (sunPowered ? 1.28 : 1);
    if (move) {
      player.vx += move * acceleration * dt;
      player.direction = move;
    } else {
      player.vx *= Math.pow(underwater ? .035 : player.onGround ? (icy ? .34 : .0007) : .085, dt);
    }
    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
    player.runCycle += (underwater ? Math.hypot(player.vx, player.vy) : Math.abs(player.vx)) * dt * .048;

    if (underwater) {
      if (swimVertical) player.vy += swimVertical * 760 * dt;
      else player.vy += 24 * dt;
      player.vy *= Math.pow(.075, dt);
      player.vy = Math.max(-260, Math.min(260, player.vy));
      player.jumpBuffer = 0;
    } else if (player.jumpBuffer > 0 && player.coyote > 0) {
      const takeoffPlatform = level.platforms.find((platform) => platform.id === player.groundId);
      player.vy = game.talents.has("highJump") ? -855 : -770;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.takeoff = .12;
      emitSurfaceEffect(level, takeoffPlatform, player.x + player.w / 2, player.y + player.h, "takeoff", 360);
      game.cameraKick = -4;
      playTone(420, 0.07, "sine", 0.045, 180);
      playTone(660, 0.045, "triangle", 0.018, -90);
    }

    if (!underwater) {
      if (!isJumpHeld() && player.vy < -250) player.vy += 1750 * dt;
      const gliding = game.talents.has("glide") && player.vy > 110 && isJumpHeld();
      const apexGravity = gliding ? .34 : Math.abs(player.vy) < 120 ? .68 : 1;
      player.vy = Math.min(1080, player.vy + 2050 * apexGravity * dt);
    }

    applyRegionalMechanics(level, player, dt);

    const oldGround = player.groundId;
    const groundPlatform = level.platforms.find((item) => item.id === oldGround);
    if (!underwater && player.onGround && groundPlatform?.moving && groundPlatform.moveAxis === "x") {
      const previousX = groundPlatform.baseX + Math.sin((game.time - dt) * groundPlatform.moveSpeed + groundPlatform.phase) * groundPlatform.moveRange;
      player.x += groundPlatform.x - previousX;
    }

    player.x += player.vx * dt;
    player.x = Math.max(0, Math.min(level.worldWidth - player.w, player.x));
    player.y += player.vy * dt;
    player.onGround = false;
    player.groundId = null;

    if (underwater) {
      const top = 54;
      const bottom = H - player.h - 38;
      if (player.y < top) {
        player.y = top;
        player.vy = Math.max(12, -player.vy * .18);
      } else if (player.y > bottom) {
        player.y = bottom;
        player.vy = Math.min(-12, -player.vy * .18);
      }
    }

    const previousBottom = player.prevY + player.h;
    const currentBottom = player.y + player.h;
    if (!underwater && player.vy >= 0) {
      let landingPlatform = null;
      for (const platform of level.platforms) {
        if (platform.active === false) continue;
        const withinX = player.x + player.w > platform.x + 5 && player.x < platform.x + platform.w - 5;
        const crossedTop = previousBottom <= platform.y + 13 && currentBottom >= platform.y;
        if (withinX && crossedTop && (!landingPlatform || platform.y < landingPlatform.y)) landingPlatform = platform;
      }
      if (landingPlatform) {
        const impact = player.vy;
        player.y = landingPlatform.y - player.h;
        player.vy = 0;
        player.onGround = true;
        player.groundId = landingPlatform.id;
        player.surfaceType = surfaceKind(level, landingPlatform);
        if (landingPlatform.conveyor) player.vx += landingPlatform.conveyor * dt * 9;
        if (impact > 360) {
          const landingStrength = Math.min(1, (impact - 300) / 520);
          player.landing = .1 + landingStrength * .07;
          emitSurfaceEffect(level, landingPlatform, player.x + player.w / 2, landingPlatform.y, "landing", impact);
          game.cameraKick = Math.max(game.cameraKick, 2 + landingStrength * 7);
          game.shake = Math.max(game.shake, landingStrength * .11);
        }
        if (impact > 520) {
          playTone(118, 0.055, "triangle", 0.03, -35);
          playTone(190, 0.03, "sine", 0.012, -70);
        }
      }
    }

    if (underwater) {
      player.airtime = 0;
      player.state = "swim";
      if (Math.hypot(player.vx, player.vy) > 85 && player.stepDust <= 0) {
        player.stepDust = .18;
        emitBubbleTrail(player.x + player.w / 2 - player.direction * 38, player.y + player.h / 2, 3, 48);
      }
    } else if (player.onGround) {
      player.airtime = 0;
      player.state = Math.abs(player.vx) > 38 ? "run" : "idle";
      if (!wasOnGround && player.landing <= 0) player.landing = .1;
      if (Math.abs(player.vx) > 220 && player.stepDust <= 0) {
        player.stepDust = .115;
        const runningPlatform = level.platforms.find((platform) => platform.id === player.groundId);
        emitSurfaceEffect(level, runningPlatform, player.x + player.w / 2 - player.direction * 16, player.y + player.h, "step", Math.abs(player.vx));
        playTone(level.mood === "mine" ? 120 : 165, .025, "triangle", .009, -18);
      }
    } else {
      player.airtime += dt;
      player.state = player.vy < -45 ? "jump" : player.vy > 90 ? "fall" : "apex";
    }

    for (const spring of underwater ? [] : level.springs) {
      if (rectsOverlap(player, spring) && player.vy >= 0 && currentBottom <= spring.y + spring.h + 24) {
        player.y = spring.y - player.h;
        player.vy = -1040;
        player.onGround = false;
        burst(spring.x + spring.w / 2, spring.y, level.accent, 11, 210);
        playTone(260, 0.18, "square", 0.035, 520);
      }
    }

    updatePuzzleChallenge(level, player, dt);

    for (const crystal of level.collectibles) {
      if (crystal.collected) continue;
      const box = { x: crystal.x - 17, y: crystal.y - 22, w: 34, h: 44 };
      if (game.talents.has("magnet")) {
        const dx = player.x + player.w / 2 - crystal.x;
        const dy = player.y + player.h / 2 - crystal.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 125 && distance > 4) {
          crystal.x += dx / distance * dt * 240;
          crystal.y += dy / distance * dt * 240;
        }
      }
      if (rectsOverlap(player, box)) {
        crystal.collected = true;
        const collectionMultiplier = level.bonusMultiplier || 1;
        game.sparks += collectionMultiplier;
        level.collected += 1;
        const claimId = `${level.index}:${crystal.id}`;
        const firstDiscovery = !game.claimedSparks.has(claimId);
        if (firstDiscovery) {
          game.claimedSparks.add(claimId);
          game.wallet += collectionMultiplier;
          saveProgress();
        }
        emitCrystalBurst(crystal.x, crystal.y, level.accent);
        playTone(660 + (game.sparks % 5) * 75, 0.09, "sine", 0.045, 120);
        if (firstDiscovery && collectionMultiplier > 1) showToast(`Tauchbonus ×${collectionMultiplier}: +${collectionMultiplier} Bergfunken!`);
        else if (firstDiscovery && game.wallet === 8) showToast("Genug Bergfunken für den ersten Umhang!");
        updateHud();
      }
    }

    for (const item of level.items || []) {
      if (item.collected) continue;
      const box = { x: item.x - 19, y: item.y - 25, w: 38, h: 50 };
      if (!rectsOverlap(player, box)) continue;
      item.collected = true;
      const discoveryId = `${level.index}:${item.id}`;
      const firstDiscovery = !game.foundItems.has(discoveryId);
      game.foundItems.add(discoveryId);
      burst(item.x, item.y, item.color, 18, 205);
      playTone(540, .1, "triangle", .04, 260);
      window.setTimeout(() => playTone(820, .12, "sine", .025, 120), 80);
      if (firstDiscovery) {
        const collectionMultiplier = level.bonusMultiplier || 1;
        if (collectionMultiplier > 1) game.wallet += collectionMultiplier;
        saveProgress();
        showToast(collectionMultiplier > 1
          ? `${item.name}! Tauchbonus ×${collectionMultiplier}: +${collectionMultiplier} Bergfunken.`
          : `Neues Reiseandenken: ${item.name}!`);
      } else {
        showToast(`${item.name} wiedergefunden.`);
      }
      updateHud();
    }

    for (const life of level.lifePickups || []) {
      if (life.collected) continue;
      const box = { x: life.x - 22, y: life.y - 24, w: 44, h: 48 };
      if (!rectsOverlap(player, box)) continue;
      life.collected = true;
      if (game.hearts >= MAX_LIVES) {
        showToast("999 Leben – mehr passen nicht in Schorschs Rucksack!");
      } else {
        const talentBonus = game.talents.has("extraHeart") && !game.lifeTalentUsed;
        const collectionMultiplier = level.bonusMultiplier || 1;
        const gained = Math.min(MAX_LIVES - game.hearts, (talentBonus ? 2 : 1) * collectionMultiplier);
        game.hearts = Math.min(MAX_LIVES, game.hearts + gained);
        if (talentBonus) game.lifeTalentUsed = true;
        showToast(collectionMultiplier > 1
          ? `Tauchbonus ×${collectionMultiplier}: ${gained} Leben dazu!`
          : talentBonus ? `Wanderherz gefunden – ${gained} Leben dazu!` : "Wanderherz gefunden – ein Leben dazu!");
      }
      burst(life.x, life.y, "#e96372", 20, 220);
      playTone(520, .1, "sine", .04, 180);
      window.setTimeout(() => playTone(760, .13, "triangle", .025, 100), 75);
      updateHud();
    }

    if (!level.isBonusRoom && level.secretEntrance && !level.secret?.used && game.secretCooldown <= 0 && rectsOverlap(player, level.secretEntrance)) {
      enterSecretRoom();
      return;
    }

    if (!level.secretEntrance && level.secret && !level.secret.found && rectsOverlap(player, level.secret)) {
      level.secret.found = true;
      burst(player.x + player.w / 2, player.y + player.h / 2, "#ffe184", 22, 230);
      showToast("Geheimweg entdeckt: Schorschs Holzstern-Höhenweg!");
      playTone(520, .12, "sine", .04, 260);
      window.setTimeout(() => playTone(780, .16, "sine", .035, 120), 110);
    }

    for (const checkpoint of level.checkpoints || [level.checkpoint]) {
      if (checkpoint.active || player.x <= checkpoint.x - 10) continue;
      checkpoint.active = true;
      player.respawnX = checkpoint.x - 20;
      player.respawnY = checkpoint.y - 10;
      burst(checkpoint.x, checkpoint.y, "#ffd35f", 18, 185);
      showToast(`${checkpoint.label || "Rastplatz"} erreicht – hier geht es weiter!`);
      playTone(520, 0.22, "sine", 0.04, 210);
    }

    for (const hazard of level.hazards) {
      if (hazard.kind !== "sunBoost" || hazard.collected) continue;
      const dx = player.x + player.w / 2 - hazard.x;
      const dy = player.y + player.h / 2 - hazard.y;
      if (Math.hypot(dx, dy) >= hazard.r + 27) continue;
      hazard.collected = true;
      player.sunBoost = Math.max(player.sunBoost, 6);
      burst(hazard.x, hazard.y, "#ffd35d", 28, 255);
      playTone(620, .12, "triangle", .045, 180);
      window.setTimeout(() => playTone(880, .16, "sine", .035, 100), 70);
      showToast("Sonnenkraft! 6 Sekunden schneller unterwegs.");
    }

    if (player.invincible <= 0) {
      for (const hazard of level.hazards) {
        if (hazard.collected || hazard.kind === "sunBoost") continue;
        const dx = player.x + player.w / 2 - hazard.x;
        const dy = player.y + player.h / 2 - hazard.y;
        if (Math.hypot(dx, dy) < hazard.r + 25) {
          const hazardName = level.underwater
            ? "ein Strömungsgeist"
            : "ein Rußwichtel";
          loseHeart(`Hoppla – ${hazardName}!`);
          return;
        }
      }
    }

    if (rectsOverlap(player, level.goal)) {
      if (level.isBonusRoom) leaveSecretRoom();
      else completeLevel();
      return;
    }
    if (player.y > H + 180) {
      if (game.talents.has("safetyNet") && !game.safetyNetUsed) {
        game.safetyNetUsed = true;
        player.x = player.respawnX;
        player.y = player.respawnY;
        player.vx = 0;
        player.vy = 0;
        player.invincible = 1.5;
        game.cameraX = Math.max(0, player.x - 220);
        game.cameraY = 0;
        game.cameraLookX = 0;
        game.cameraKick = 0;
        burst(player.x + player.w / 2, player.y + player.h / 2, "#e9d37a", 18, 190);
        playTone(620, .14, "sine", .04, 190);
        showToast("Das Wanderseil fängt Schorsch auf – einmal pro Level!");
        return;
      }
      loseHeart("Schorsch ist vom Weg gerutscht.");
      return;
    }

    const visibleWidth = getViewWidth();
    const desiredLookAhead = Math.max(-135, Math.min(135, player.vx * .35));
    game.cameraLookX += (desiredLookAhead - game.cameraLookX) * Math.min(1, dt * (player.onGround ? 4.8 : 3.2));
    const targetCamera = Math.max(0, Math.min(level.worldWidth - visibleWidth, player.x + game.cameraLookX - visibleWidth * .35));
    const cameraSpeed = Math.abs(targetCamera - game.cameraX) > visibleWidth * .3 ? 8.5 : 5.2;
    game.cameraX += (targetCamera - game.cameraX) * Math.min(1, dt * cameraSpeed);
    const airborneLook = underwater ? (player.y + player.h * .5 - H * .48) * .1 : player.onGround ? 0 : (player.y - H * .43) * .055;
    const targetCameraY = Math.max(-15, Math.min(18, airborneLook));
    game.cameraY += (targetCameraY - game.cameraY) * Math.min(1, dt * 3.6);
    game.cameraKick *= Math.pow(.018, dt);
    if (Math.abs(game.cameraKick) < .04) game.cameraKick = 0;
    game.shake = Math.max(0, game.shake - dt * 2.8);
  }

  function loseHeart(message) {
    const player = game.player;
    if (!player || player.invincible > 0 || game.mode !== "playing") return false;
    game.hearts = Math.max(0, game.hearts - 1);
    game.shake = 0.45;
    burst(player.x + player.w / 2, player.y + player.h / 2, "#ffffff", 14, 220);
    playTone(180, 0.16, "sawtooth", 0.03, -90);
    if (game.hearts <= 0) {
      game.mode = "restarting";
      updateHud();
      showToast("Alle Leben aufgebraucht – das Level beginnt von vorn!");
      playTone(120, .42, "triangle", .045, -50);
      restartTimer = window.setTimeout(() => startLevel(game.levelIndex), 950);
      return true;
    }
    showToast(game.hearts === 1 ? `${message} Noch ein Leben.` : `${message} Noch ${game.hearts} Leben.`);
    player.x = player.respawnX;
    player.y = player.respawnY;
    player.vx = 0;
    player.vy = 0;
    player.invincible = 1.5;
    game.cameraX = Math.max(0, player.x - 220);
    game.cameraY = 0;
    game.cameraLookX = 0;
    game.cameraKick = 0;
    updateHud();
    return true;
  }

  function updateHazardMotion(hazard, level) {
    if (!Number.isFinite(hazard.baseY)) hazard.baseY = hazard.y;
    if (!hazard.motionKind) {
      const variants = hazard.aquatic || level.underwater
        ? ["swim", "loop", "float"]
        : ["drift", "loop", "hop"];
      hazard.motionKind = variants[Math.abs(Math.floor(hazard.phase * 11)) % variants.length];
    }
    const time = game.time * hazard.speed + hazard.phase;
    if (hazard.kind === "sunBoost") {
      hazard.x = hazard.baseX + Math.sin(time) * hazard.range;
      hazard.y = hazard.baseY + Math.sin(time * 1.7) * hazard.verticalRange;
      return;
    }
    if (hazard.motionKind === "loop") {
      hazard.x = hazard.baseX + Math.sin(time) * hazard.range;
      hazard.y = hazard.baseY + Math.sin(time * 2 + .7) * (hazard.aquatic ? 18 : 10);
    } else if (hazard.motionKind === "hop") {
      hazard.x = hazard.baseX + Math.sin(time * .9) * hazard.range;
      hazard.y = hazard.baseY - Math.abs(Math.sin(time * 1.65)) * 15;
    } else if (hazard.motionKind === "swim") {
      hazard.x = hazard.baseX + Math.sin(time) * hazard.range;
      hazard.y = hazard.baseY + Math.cos(time * 1.35) * 17;
    } else if (hazard.motionKind === "float") {
      hazard.x = hazard.baseX + Math.sin(time * .72) * hazard.range;
      hazard.y = hazard.baseY + Math.sin(time * .88) * 9;
    } else {
      hazard.x = hazard.baseX + Math.sin(time) * hazard.range;
      hazard.y = hazard.baseY + Math.sin(time * .8) * 7;
    }
  }

  function surfaceKind(level, platform) {
    if (level.underwater) return "water";
    if (level.mood === "river" && platform?.ground) return "water";
    if (platform?.type === "wood") return "wood";
    if (platform?.type === "train" || platform?.type === "roof") return "metal";
    if (platform?.type === "mine") return "mine";
    if (platform?.type === "stone") return "stone";
    return "earth";
  }

  function addParticle(particle) {
    game.particles.push({
      gravity: 350,
      life: .7,
      maxLife: .7,
      size: 5,
      color: "#ffffff",
      rotation: 0,
      spin: 0,
      drag: 1,
      grow: 0,
      shape: "square",
      ...particle,
    });
  }

  function emitSurfaceEffect(level, platform, x, y, action, force) {
    const kind = surfaceKind(level, platform);
    const rng = seededRandom(Math.floor(x * 13 + y * 31 + game.time * 1000));
    const amount = action === "landing" ? 7 + Math.floor(Math.min(7, force / 110)) : action === "takeoff" ? 6 : 2;
    for (let i = 0; i < amount; i += 1) {
      const side = (rng() - .5) * (action === "landing" ? 1.8 : 1.1);
      const upward = 22 + rng() * (action === "landing" ? Math.min(150, force * .18) : 65);
      if (kind === "water") {
        addParticle({
          x: x + side * 16, y: y - 2,
          vx: side * (70 + rng() * 80), vy: -upward * 1.15,
          gravity: 390, drag: .72, life: .46 + rng() * .28, maxLife: .74,
          size: 3 + rng() * 4, color: i % 2 ? "#bdeff1" : "#63bac8", shape: "droplet",
        });
      } else if (kind === "wood") {
        addParticle({
          x: x + side * 12, y: y - 1,
          vx: side * (55 + rng() * 70), vy: -upward,
          gravity: 410, drag: .66, life: .38 + rng() * .25, maxLife: .63,
          size: 4 + rng() * 5, color: i % 2 ? "#d69a55" : "#855231", shape: "shard",
          rotation: rng() * TAU, spin: (rng() - .5) * 13,
        });
      } else if (kind === "metal" || kind === "mine") {
        addParticle({
          x, y: y - 2,
          vx: side * (85 + rng() * 100), vy: -upward * .9,
          gravity: 520, drag: .82, life: .28 + rng() * .24, maxLife: .52,
          size: 2 + rng() * 3, color: kind === "mine" ? "#ffb542" : "#f4d477", shape: "spark",
          rotation: rng() * TAU, spin: (rng() - .5) * 16,
        });
      } else {
        addParticle({
          x: x + side * 14, y: y - 1,
          vx: side * (30 + rng() * 52), vy: -upward * .42,
          gravity: -8, drag: .08, grow: 8 + rng() * 8,
          life: .42 + rng() * .3, maxLife: .72,
          size: 5 + rng() * 7, color: kind === "stone" ? "#c3c0ad" : "#d9cba5", shape: "dust",
        });
      }
    }
  }

  function emitBubbleTrail(x, y, count, force) {
    const rng = seededRandom(Math.floor(x * 19 + y * 23 + game.time * 1000));
    for (let i = 0; i < count; i += 1) {
      addParticle({
        x: x + (rng() - .5) * 22, y: y + (rng() - .5) * 14,
        vx: (rng() - .5) * force, vy: -22 - rng() * force,
        gravity: -38, drag: .18, grow: 2,
        life: .65 + rng() * .45, maxLife: 1.1,
        size: 2.5 + rng() * 4, color: "#c9fbf7", shape: "bubble",
      });
    }
  }

  function emitCrystalBurst(x, y, accent) {
    const rng = seededRandom(Math.floor(x * 29 + y * 17 + game.time * 1000));
    const colors = ["#fff5a9", "#ffd35f", "#ef941d", accent];
    for (let i = 0; i < 18; i += 1) {
      const angle = i / 18 * TAU + (rng() - .5) * .18;
      const speed = 95 + rng() * 155;
      addParticle({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 55,
        gravity: 280, drag: .74, life: .48 + rng() * .45, maxLife: .93,
        size: 3 + rng() * 5, color: colors[i % colors.length], shape: i % 3 ? "shard" : "spark",
        rotation: angle, spin: (rng() - .5) * 14,
      });
    }
  }

  function updateParticles(dt) {
    for (const particle of game.particles) {
      particle.life -= dt;
      particle.vx *= Math.pow(particle.drag ?? 1, dt);
      particle.vy *= Math.pow(particle.drag ?? 1, dt * .45);
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += particle.gravity * dt;
      particle.rotation += particle.spin * dt;
      particle.size = Math.max(.2, particle.size + (particle.grow || 0) * dt);
    }
    game.particles = game.particles.filter((particle) => particle.life > 0);
  }

  function burst(x, y, color, count, force) {
    const rng = seededRandom(Math.floor(x * 17 + y * 29 + game.time * 1000));
    for (let i = 0; i < count; i += 1) {
      const angle = rng() * TAU;
      const speed = force * (0.35 + rng() * 0.65);
      addParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - force * 0.25,
        gravity: 350,
        life: 0.45 + rng() * 0.5,
        maxLife: 0.95,
        size: 3 + rng() * 6,
        color,
        rotation: rng() * TAU,
        spin: (rng() - 0.5) * 8,
      });
    }
  }

  function draw() {
    ctx.save();
    const scale = canvas.height / H;
    const visibleWidth = getViewWidth();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, visibleWidth, H);

    const shakeX = game.shake ? Math.sin(game.time * 70) * game.shake * 12 : 0;
    const shakeY = game.shake ? Math.cos(game.time * 55) * game.shake * 7 : 0;
    ctx.translate(shakeX, shakeY - game.cameraY - game.cameraKick);
    const level = game.level || createLevel(game.levelIndex);
    drawBackground(level);
    drawWorld(level);
    drawForegroundParallax(level, visibleWidth);
    drawForegroundDepth(level);
    ctx.restore();
  }

  function drawBackground(level) {
    const visibleWidth = getViewWidth();
    const night = level.mood === "night";
    const backdropKey = level.backdrop || (level.mood === "mine" ? "mine" : night ? "night" : "day");
    const backdrop = getBackdropImage(backdropKey) || getBackdropImage("day");

    if (backdrop.complete && backdrop.naturalWidth) {
      drawGeneratedBackdrop(backdrop, level, visibleWidth);
      drawAnimatedMidground(level, visibleWidth);
      if (level.underwater) drawUnderwaterAtmosphere(level);
      else drawAtmosphere(level, night);
      drawWeatherLayer(level, visibleWidth);
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, level.sky[0]);
    gradient.addColorStop(1, level.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(-20, -20, visibleWidth + 40, H + 40);

    const sunX = visibleWidth * 0.8 - game.cameraX * 0.018;
    const sunY = night ? 105 : 92;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 86);
    sunGlow.addColorStop(0, night ? "#fff4c8" : "#fff7cc");
    sunGlow.addColorStop(1, "rgba(255,244,190,0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath(); ctx.arc(sunX, sunY, 86, 0, TAU); ctx.fill();
    ctx.fillStyle = night ? "#f7e8bd" : "#f6c759";
    ctx.beginPath(); ctx.arc(sunX, sunY, night ? 24 : 34, 0, TAU); ctx.fill();

    if (night) drawStars();
    drawClouds(level, 0.08, 0.55);
    drawMountainLayer(level, 0.08, 400, night ? "#48566a" : "#779f92", 175, 1);
    drawRegionalLandmark(level);
    drawMountainLayer(level, 0.18, 500, night ? "#344c52" : "#567f68", 125, 2);
    drawForestLayer(level, 0.28, 545, night ? "#253e3c" : "#345f49");
    drawAnimatedMidground(level, visibleWidth);
    ctx.fillStyle = night ? "rgba(26,44,55,.24)" : "rgba(255,248,225,.12)";
    ctx.fillRect(0, 0, visibleWidth, H);
    if (level.underwater) drawUnderwaterAtmosphere(level);
    else drawAtmosphere(level, night);
    drawWeatherLayer(level, visibleWidth);
  }

  function drawUnderwaterAtmosphere(level) {
    const visibleWidth = getViewWidth();
    ctx.save();
    const wash = ctx.createLinearGradient(0, 0, 0, H);
    wash.addColorStop(0, "rgba(54,191,205,.10)");
    wash.addColorStop(.55, "rgba(10,104,121,.14)");
    wash.addColorStop(1, "rgba(4,42,55,.28)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, visibleWidth, H);

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(151,245,240,.12)";
    ctx.lineWidth = 18;
    for (let i = -2; i < 8; i += 1) {
      const x = i * 230 - (game.cameraX * .035 % 230) + Math.sin(game.time * .45 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 65, 250, x + 115, 510);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    for (let i = 0; i < 32; i += 1) {
      const drift = game.time * (10 + i % 4 * 4);
      const x = wrap(hash(i * 43 + level.index) * visibleWidth - game.cameraX * .025 + Math.sin(game.time + i) * 12, -20, visibleWidth + 20);
      const y = wrap(690 - hash(i * 71) * 640 - drift, 35, 690);
      const radius = 1.5 + (i % 4) * .75;
      ctx.globalAlpha = .22 + (i % 3) * .09;
      ctx.strokeStyle = "#baf8f4";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawGeneratedBackdrop(image, level, visibleWidth) {
    const coverScale = Math.max(visibleWidth / image.naturalWidth, H / image.naturalHeight) * 1.075;
    const width = image.naturalWidth * coverScale;
    const height = image.naturalHeight * coverScale;
    const travel = Math.max(0, width - visibleWidth);
    const worldTravel = Math.max(1, level.worldWidth - visibleWidth);
    const progress = Math.max(0, Math.min(1, game.cameraX / worldTravel));
    const x = -travel * progress;
    const y = (H - height) * .48;
    const hasDedicatedBackdrop = String(level.backdrop || "").startsWith("level-");

    ctx.save();
    if (!hasDedicatedBackdrop && level.mood === "river") ctx.filter = "saturate(.92) hue-rotate(7deg)";
    else if (!hasDedicatedBackdrop && level.mood === "rooftops") ctx.filter = "saturate(.84) sepia(.08)";
    else if (!hasDedicatedBackdrop && level.mood === "rocks") ctx.filter = "saturate(.72) contrast(1.04)";
    else if (!hasDedicatedBackdrop && level.mood === "summit") ctx.filter = "brightness(1.06) saturate(.82)";
    ctx.drawImage(image, x, y, width, height);
    ctx.filter = "none";
    drawBackdropDepth(level, visibleWidth);

    const readability = ctx.createLinearGradient(0, 250, 0, H);
    readability.addColorStop(0, "rgba(18,42,38,0)");
    readability.addColorStop(.72, level.mood === "night" ? "rgba(15,29,50,.10)" : "rgba(26,49,39,.06)");
    readability.addColorStop(1, level.mood === "mine" ? "rgba(9,19,22,.28)" : "rgba(15,33,26,.18)");
    ctx.fillStyle = readability;
    ctx.fillRect(0, 0, visibleWidth, H);
    ctx.restore();
  }

  function drawBackdropDepth(level, visibleWidth) {
    const night = level.mood === "night";
    ctx.save();
    const haze = ctx.createLinearGradient(0, 270, 0, H);
    haze.addColorStop(0, "rgba(255,255,245,0)");
    haze.addColorStop(.58, night ? "rgba(144,172,196,.08)" : "rgba(230,245,220,.15)");
    haze.addColorStop(1, "rgba(15,45,34,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 220, visibleWidth, H - 220);

    ctx.globalAlpha = night ? .16 : .13;
    ctx.filter = "blur(4px)";
    const parallax = game.cameraX * .16;
    for (let i = -1; i < 8; i += 1) {
      const x = wrap(i * 190 - parallax, -150, visibleWidth + 160);
      const h = 96 + hash(i * 19 + level.index * 13) * 88;
      ctx.fillStyle = night ? "#1c3740" : "#315943";
      ctx.beginPath();
      ctx.moveTo(x, 605);
      ctx.lineTo(x + 32, 605 - h);
      ctx.lineTo(x + 66, 605);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = night ? .15 : .12;
    ctx.filter = "blur(8px)";
    ctx.fillStyle = night ? "#172c36" : "#254d39";
    const nearShift = game.cameraX * .31;
    for (let i = -1; i < 6; i += 1) {
      const x = wrap(i * 280 - nearShift, -180, visibleWidth + 200);
      ctx.beginPath();
      ctx.ellipse(x + 70, H - 36, 100, 85 + (i % 2) * 24, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAnimatedMidground(level, visibleWidth) {
    if (level.underwater) {
      drawUnderwaterMidground(level, visibleWidth);
      return;
    }
    const midX = (anchor, speed = .24, padding = 280) => wrap(anchor - game.cameraX * speed, -padding, visibleWidth + padding);
    ctx.save();
    ctx.globalAlpha = level.mood === "night" ? .52 : .42;

    if (level.mood === "river") {
      const x = midX(visibleWidth * .72, .27, 320);
      drawMill(x, 520, .48);
      drawWaterReflection(x + 31, 529, 86, "#bdeef0");
    } else if (level.mood === "rail") {
      const travel = wrap(game.time * 34 - game.cameraX * .23, -360, visibleWidth + 420);
      drawMidgroundRail(travel, 516, visibleWidth);
      drawModernTram(travel, 507, .58);
    } else if (["summit", "castle", "rocks"].includes(level.mood)) {
      drawWavingFlag(midX(visibleWidth * .27, .21), 446, .62, level.accent);
      drawWavingFlag(midX(visibleWidth * .78 + 390, .29), 495, .46, level.mood === "summit" ? "#d75a55" : "#e4b34d");
    } else if (level.mood === "mine") {
      drawTurningMineWheel(midX(visibleWidth * .75, .2), 470, .68);
    } else if (level.mood === "night") {
      drawWarmWindowLayer(level, visibleWidth, .23, 468);
      drawSchwibbogenGlow(midX(visibleWidth * .72, .18), 430, .56);
    } else if (level.mood === "solar") {
      drawSolarLightSweep(midX(visibleWidth * .64, .2), 470, 1.05);
    } else if (level.mood === "village" || level.mood === "rooftops") {
      drawWarmWindowLayer(level, visibleWidth, .26, 486);
    } else {
      drawSwayingTreeLine(level, visibleWidth, .25, 525);
    }

    drawSolarGlints(level, visibleWidth);
    ctx.restore();
  }

  function drawMidgroundRail(tramX, y, visibleWidth) {
    ctx.save();
    ctx.strokeStyle = "rgba(71,78,75,.72)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-30, y + 2); ctx.lineTo(visibleWidth + 30, y + 2);
    ctx.moveTo(-30, y + 10); ctx.lineTo(visibleWidth + 30, y + 10);
    ctx.stroke();
    ctx.strokeStyle = "rgba(83,62,43,.5)";
    ctx.lineWidth = 3;
    for (let x = -20 - (game.cameraX * .23 % 25); x < visibleWidth + 30; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(x, y + 14); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(74,91,88,.45)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-20, y - 88); ctx.quadraticCurveTo(tramX, y - 96, visibleWidth + 20, y - 84); ctx.stroke();
    ctx.restore();
  }

  function drawModernTram(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const body = ctx.createLinearGradient(0, -72, 0, 4);
    body.addColorStop(0, "#e9f2f4");
    body.addColorStop(.54, "#d8e6e9");
    body.addColorStop(.56, "#1686c5");
    body.addColorStop(1, "#0869aa");
    ctx.shadowColor = "rgba(19,42,45,.26)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 7;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-132, -65);
    ctx.quadraticCurveTo(-123, -81, -103, -82);
    ctx.lineTo(106, -82);
    ctx.quadraticCurveTo(130, -77, 137, -54);
    ctx.lineTo(137, -5);
    ctx.quadraticCurveTo(130, 5, 116, 7);
    ctx.lineTo(-117, 7);
    ctx.quadraticCurveTo(-135, 2, -136, -16);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#263b45";
    ctx.beginPath();
    ctx.moveTo(-112, -67); ctx.quadraticCurveTo(-101, -75, -88, -75); ctx.lineTo(-55, -75); ctx.lineTo(-52, -39); ctx.lineTo(-116, -39); ctx.closePath(); ctx.fill();
    for (let wx = -43; wx <= 91; wx += 34) {
      ctx.fillStyle = "#29444e";
      ctx.beginPath(); ctx.roundRect(wx, -73, 27, 32, 4); ctx.fill();
      ctx.fillStyle = "rgba(170,225,235,.26)";
      ctx.fillRect(wx + 3, -69, 6, 23);
    }
    ctx.fillStyle = "#f5fbf8";
    ctx.beginPath(); ctx.roundRect(-20, -31, 66, 22, 4); ctx.fill();
    ctx.fillStyle = "#0a7bc0";
    ctx.font = "900 17px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("CVAG", 13, -14);

    ctx.strokeStyle = "#4a5658";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-10, -82); ctx.lineTo(9, -109); ctx.lineTo(35, -82);
    ctx.moveTo(9, -109); ctx.lineTo(43, -109);
    ctx.stroke();
    ctx.fillStyle = "#233033";
    for (const wheelX of [-88, 91]) {
      ctx.beginPath(); ctx.arc(wheelX, 7, 14, 0, TAU); ctx.fill();
      ctx.fillStyle = "#87969a"; ctx.beginPath(); ctx.arc(wheelX, 7, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = "#233033";
    }
    ctx.fillStyle = "#fff4b0";
    ctx.shadowColor = "#fff0a0";
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(-119, -24, 4, 0, TAU); ctx.arc(125, -24, 4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawWavingFlag(x, y, scale, color) {
    const wave = Math.sin(game.time * 3.1 + x * .013);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(57,48,39,.82)";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -128); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(3, -124);
    ctx.bezierCurveTo(29, -137 + wave * 6, 54, -108 - wave * 5, 82, -121 + wave * 7);
    ctx.lineTo(82, -91 + wave * 4);
    ctx.bezierCurveTo(54, -80 - wave * 5, 28, -108 + wave * 6, 3, -96);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.24)";
    ctx.beginPath(); ctx.moveTo(7, -119); ctx.bezierCurveTo(30, -127 + wave * 5, 54, -101 - wave * 4, 76, -114 + wave * 5); ctx.lineTo(76, -107); ctx.bezierCurveTo(52, -95, 29, -118, 7, -110); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawTurningMineWheel(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(66,75,73,.86)";
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(-55, 0); ctx.lineTo(-28, -108); ctx.lineTo(28, -108); ctx.lineTo(55, 0); ctx.stroke();
    ctx.translate(0, -118);
    ctx.rotate(game.time * .32);
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const angle = i * TAU / 8;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * 34, Math.sin(angle) * 34); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWarmWindowLayer(level, visibleWidth, parallax, baseY) {
    for (let i = 0; i < 7; i += 1) {
      const x = wrap(i * 210 + 80 - game.cameraX * parallax, -80, visibleWidth + 100);
      const pulse = .5 + Math.sin(game.time * 1.7 + i * 1.4) * .14;
      ctx.globalAlpha = pulse;
      ctx.shadowColor = "#ffd36c";
      ctx.shadowBlur = 18;
      ctx.fillStyle = i % 3 === 0 ? "#ffe49a" : "#f2bd5a";
      ctx.beginPath(); ctx.roundRect(x, baseY - (i % 2) * 32, 14, 22, 3); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = level.mood === "night" ? .52 : .42;
  }

  function drawSchwibbogenGlow(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = .58 + Math.sin(game.time * 1.8) * .08;
    drawSchwibbogen(x, y, scale);
    ctx.restore();
  }

  function drawSwayingTreeLine(level, visibleWidth, parallax, baseY) {
    for (let i = -1; i < Math.ceil(visibleWidth / 190) + 2; i += 1) {
      const x = wrap(i * 190 + 40 - game.cameraX * parallax, -130, visibleWidth + 150);
      const sway = Math.sin(game.time * 1.1 + i * .8 + level.index) * 4;
      ctx.save();
      ctx.translate(x, baseY);
      ctx.rotate(sway * .003);
      drawSpruce(0, 0, 88 + i % 3 * 13, "#274c3c", .72);
      ctx.restore();
    }
  }

  function drawSolarLightSweep(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "rgba(23,89,121,.6)";
    ctx.beginPath(); ctx.moveTo(-92, 0); ctx.lineTo(-72, -42); ctx.lineTo(82, -42); ctx.lineTo(98, 0); ctx.closePath(); ctx.fill();
    const sweep = wrap(game.time * 38, -95, 95);
    const glint = ctx.createLinearGradient(sweep - 28, 0, sweep + 28, 0);
    glint.addColorStop(0, "rgba(255,250,190,0)");
    glint.addColorStop(.5, "rgba(255,250,190,.7)");
    glint.addColorStop(1, "rgba(255,250,190,0)");
    ctx.fillStyle = glint;
    ctx.beginPath(); ctx.moveTo(-92, -1); ctx.lineTo(-72, -41); ctx.lineTo(82, -41); ctx.lineTo(97, -1); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawSolarGlints(level, visibleWidth) {
    if (level.underwater || level.mood === "mine" || level.mood === "night") return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i += 1) {
      const x = wrap(170 + i * 330 - game.cameraX * (.12 + i * .012), -30, visibleWidth + 40);
      const y = 308 + (i % 2) * 82;
      const pulse = Math.max(0, Math.sin(game.time * 1.45 + i * 1.8));
      ctx.globalAlpha = pulse * .34;
      ctx.strokeStyle = "#fff6bb";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x + 8, y); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaterReflection(x, y, width, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const ripple = Math.sin(game.time * 2.4 + i) * 9;
      ctx.globalAlpha = .2 + i * .05;
      ctx.beginPath(); ctx.ellipse(x + ripple, y + i * 7, width * (.36 + i * .11), 3, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawUnderwaterMidground(level, visibleWidth) {
    ctx.save();
    ctx.globalAlpha = .24;
    ctx.strokeStyle = "#68c8c2";
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    const shift = -(game.cameraX * .24 % 250);
    for (let i = -1; i < Math.ceil(visibleWidth / 250) + 2; i += 1) {
      const x = shift + i * 250 + 80;
      const sway = Math.sin(game.time * .85 + i) * 20;
      ctx.beginPath();
      ctx.moveTo(x, 590);
      ctx.quadraticCurveTo(x - 12, 500, x + sway, 432 - (i % 2) * 35);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawWeatherLayer(level, visibleWidth) {
    ctx.save();
    if (level.underwater) {
      ctx.globalAlpha = .18;
      ctx.fillStyle = "#d7faf5";
      for (let i = 0; i < 26; i += 1) {
        const x = wrap(hash(i * 41 + level.index) * visibleWidth - game.cameraX * .035 + game.time * (3 + i % 4), -12, visibleWidth + 12);
        const y = wrap(80 + hash(i * 67) * 570 - game.time * (4 + i % 3), 45, 670);
        ctx.beginPath(); ctx.arc(x, y, 1 + i % 2, 0, TAU); ctx.fill();
      }
    } else if (level.mood === "summit" || level.mood === "night") {
      ctx.fillStyle = level.mood === "night" ? "#f6e7bd" : "#edf6f2";
      for (let i = 0; i < 24; i += 1) {
        const speed = 12 + i % 5 * 4;
        const x = wrap(hash(i * 73 + level.index) * visibleWidth + game.time * speed - game.cameraX * .018, -20, visibleWidth + 20);
        const y = wrap(hash(i * 101) * H + game.time * (8 + i % 4 * 3), 35, H - 48);
        ctx.globalAlpha = .14 + (i % 3) * .05;
        ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3 * .6, 0, TAU); ctx.fill();
      }
    } else if (level.mood === "river") {
      ctx.strokeStyle = "#d6eef0";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 18; i += 1) {
        const x = wrap(hash(i * 83) * visibleWidth - game.cameraX * .025 - game.time * 18, -20, visibleWidth + 20);
        const y = wrap(hash(i * 47) * 520 + game.time * 42, 70, 590);
        ctx.globalAlpha = .1 + (i % 3) * .035;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 18); ctx.stroke();
      }
    } else if (["forest", "village", "rooftops", "rocks", "castle"].includes(level.mood)) {
      ctx.fillStyle = "#e5c56d";
      for (let i = 0; i < 15; i += 1) {
        const x = wrap(hash(i * 97 + level.index) * visibleWidth + game.time * (5 + i % 3), -15, visibleWidth + 15);
        const y = 130 + hash(i * 53) * 420 + Math.sin(game.time * .8 + i) * 18;
        ctx.globalAlpha = .08 + (i % 4) * .025;
        ctx.beginPath(); ctx.ellipse(x, y, 2.8, 1.3, game.time + i, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawForegroundParallax(level, visibleWidth) {
    ctx.save();
    ctx.globalAlpha = level.underwater ? .18 : level.mood === "mine" ? .2 : .13;
    ctx.filter = "blur(2.5px)";
    const shift = -(game.cameraX * 1.14 % 230);
    const color = level.underwater ? "#123f43" : level.mood === "mine" ? "#172422" : level.mood === "night" ? "#17322f" : "#204733";
    ctx.fillStyle = color;
    for (let i = -2; i < Math.ceil(visibleWidth / 230) + 3; i += 1) {
      const x = shift + i * 230 + 40;
      const width = 70 + hash(i * 37 + level.index) * 75;
      const height = 28 + hash(i * 61 + level.index) * 42;
      ctx.beginPath(); ctx.ellipse(x, H + 5, width, height, 0, 0, TAU); ctx.fill();
      if (!level.underwater && level.mood !== "mine") {
        ctx.strokeStyle = color;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(x, H - 4);
        ctx.quadraticCurveTo(x - 8, H - 48, x + Math.sin(game.time * 1.4 + i) * 9, H - 78);
        ctx.stroke();
      }
    }
    if (level.mood === "mine" || level.underwater) {
      ctx.globalAlpha *= .8;
      for (const side of [-1, 1]) {
        const edgeX = side < 0 ? -22 : visibleWidth + 22;
        ctx.beginPath();
        ctx.ellipse(edgeX, 250, 76, 230, side * .12, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawAtmosphere(level, night) {
    const visibleWidth = getViewWidth();
    ctx.save();
    const mist = ctx.createLinearGradient(0, 430, 0, 640);
    mist.addColorStop(0, "rgba(246,246,220,0)");
    mist.addColorStop(.62, night ? "rgba(154,174,181,.06)" : "rgba(239,244,220,.10)");
    mist.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 390, visibleWidth, 270);
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < 22; i += 1) {
      const x = wrap(hash(i * 17 + level.index) * visibleWidth + game.time * (4 + i % 3), -20, visibleWidth + 20);
      const y = 115 + hash(i * 37 + level.index * 3) * 470 + Math.sin(game.time * .8 + i) * 10;
      const pulse = .22 + Math.sin(game.time * 2 + i * .7) * .09;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = night ? "#f5d67c" : "#fff4bb";
      ctx.beginPath(); ctx.arc(x, y, 1.3 + i % 3 * .45, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawStars() {
    const visibleWidth = getViewWidth();
    for (let i = 0; i < 34; i += 1) {
      const x = hash(i * 97) * visibleWidth;
      const y = 20 + hash(i * 193) * 260;
      const blink = 0.45 + Math.sin(game.time * 1.7 + i) * 0.25;
      ctx.globalAlpha = blink;
      ctx.fillStyle = "#fff5cf";
      ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawClouds(level, parallax, alpha) {
    const visibleWidth = getViewWidth();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 8; i += 1) {
      const x = wrap(i * 320 - game.cameraX * parallax + game.time * 3, -240, visibleWidth + 320);
      const y = 92 + (i % 3) * 76;
      const size = 42 + (i % 4) * 9;
      ctx.fillStyle = level.mood === "night" ? "#8794a4" : "#f4f3df";
      ctx.beginPath();
      ctx.arc(x, y, size * .55, 0, TAU);
      ctx.arc(x + size * .58, y - size * .18, size * .75, 0, TAU);
      ctx.arc(x + size * 1.22, y, size * .54, 0, TAU);
      ctx.roundRect(x - size * .45, y, size * 2.1, size * .5, 18);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMountainLayer(level, parallax, baseY, color, height, seedOffset) {
    const visibleWidth = getViewWidth();
    const shift = -(game.cameraX * parallax) % 460;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-500, H);
    ctx.lineTo(-500, baseY);
    for (let i = -2; i < 6; i += 1) {
      const x = shift + i * 460;
      const peak = baseY - height * (0.72 + hash(i * 13 + seedOffset * 41) * 0.45);
      ctx.quadraticCurveTo(x + 115, peak + 45, x + 230, peak);
      ctx.quadraticCurveTo(x + 345, peak + 55, x + 460, baseY);
    }
    ctx.lineTo(visibleWidth + 500, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawForestLayer(level, parallax, baseY, color) {
    const visibleWidth = getViewWidth();
    const spacing = 72;
    const shift = -((game.cameraX * parallax) % spacing);
    for (let i = -2; i < Math.ceil(visibleWidth / spacing) + 3; i += 1) {
      const x = shift + i * spacing;
      const height = 75 + hash(i + level.index * 31) * 78;
      drawSpruce(x, baseY, height, color, 0.92);
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, baseY - 2, visibleWidth, H - baseY + 2);
  }

  function drawRegionalLandmark(level) {
    const x = getViewWidth() * 0.62 - game.cameraX * 0.11;
    ctx.save();
    ctx.globalAlpha = 0.64;
    switch (level.mood) {
      case "village":
      case "rooftops":
        for (let i = 0; i < 6; i += 1) drawFachwerkHouse(x - 420 + i * 145, 440 - (i % 2) * 20, 0.7, level.accent);
        break;
      case "mine":
        drawMineHeadframe(x, 455, 0.9);
        break;
      case "river":
        drawRiverValley(x, 478, 0.86);
        break;
      case "rail":
        drawTrain(x - 130, 435, 0.85);
        break;
      case "night":
        drawSchwibbogen(x - 100, 425, 1);
        break;
      case "rocks":
        drawRockTowers(x - 180, 475, 0.95);
        break;
      case "castle":
        drawCastle(x, 414, 0.85);
        break;
      case "summit":
        drawSummitTower(x, 418, 0.9);
        break;
      default:
        for (let i = 0; i < 4; i += 1) drawFachwerkHouse(x - 270 + i * 160, 458, 0.62, level.accent);
    }
    ctx.restore();
  }

  function drawEnergyBackdrop(level, x) {
    const groundY = level.mood === "summit" ? 502 : level.mood === "night" ? 518 : 525;
    const solarScale = level.mood === "solar" ? 1.05 : level.mood === "mine" || level.mood === "rail" ? .82 : .68;
    ctx.save();
    ctx.globalAlpha = level.mood === "night" ? .86 : .78;
    drawSolarArray(x - 410, groundY, solarScale);
    drawEVChargingPoint(x + 300, groundY + 4, .78);
    if (level.mood === "rail" || level.mood === "village" || level.mood === "rooftops" || level.mood === "solar") drawElectricShuttle(x + 395, groundY + 8, level.mood === "solar" ? .78 : .62);
    ctx.restore();
  }

  function drawSolarArray(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#4c5549";
    ctx.fillRect(-94, 0, 188, 7);
    ctx.fillRect(-49, 4, 8, 34);
    ctx.fillRect(42, 4, 8, 34);
    for (let panel = 0; panel < 4; panel += 1) {
      const px = -96 + panel * 49;
      ctx.fillStyle = "#193f60";
      ctx.beginPath();
      ctx.moveTo(px, -47); ctx.lineTo(px + 43, -55); ctx.lineTo(px + 47, -10); ctx.lineTo(px + 4, -3);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#98cfdb";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(188,231,238,.7)";
      ctx.beginPath(); ctx.moveTo(px + 12, -43); ctx.lineTo(px + 17, -7); ctx.moveTo(px + 27, -46); ctx.lineTo(px + 32, -9); ctx.stroke();
    }
    ctx.fillStyle = "#d8e66c";
    ctx.beginPath(); ctx.arc(0, -66, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawEVChargingPoint(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#314c4d";
    ctx.beginPath(); ctx.roundRect(-18, -58, 36, 58, 6); ctx.fill();
    ctx.fillStyle = "#bce9d5";
    ctx.beginPath(); ctx.roundRect(-12, -51, 24, 24, 4); ctx.fill();
    ctx.fillStyle = "#248b82";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("⚡", 0, -33);
    ctx.strokeStyle = "#2d4746";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(15, -32); ctx.quadraticCurveTo(37, -30, 30, -8); ctx.lineTo(24, -5); ctx.stroke();
    ctx.fillStyle = "#e7f4df";
    ctx.beginPath(); ctx.arc(24, -5, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawElectricShuttle(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#e9f3e6";
    ctx.beginPath(); ctx.roundRect(-48, -30, 96, 28, 10); ctx.fill();
    ctx.fillStyle = "#2d7f77";
    ctx.beginPath(); ctx.roundRect(-30, -46, 56, 22, 8); ctx.fill();
    ctx.fillStyle = "#a8dce3";
    ctx.fillRect(-22, -40, 17, 10); ctx.fillRect(1, -40, 17, 10);
    ctx.fillStyle = "#354343";
    ctx.beginPath(); ctx.arc(-28, 0, 9, 0, TAU); ctx.arc(28, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = "#f4c958";
    ctx.fillRect(38, -20, 6, 7);
    ctx.restore();
  }

  function drawWorld(level) {
    const visibleWidth = getViewWidth();
    const left = game.cameraX - 180;
    const right = game.cameraX + visibleWidth + 180;
    ctx.save();
    ctx.translate(-game.cameraX, 0);
    drawWorldDecor(level);
    for (const platform of level.platforms) {
      if (platform.active !== false && platform.x + platform.w >= left && platform.x <= right) drawPlatform(platform, level);
    }
    for (const spring of level.springs) {
      if (spring.x + spring.w >= left && spring.x <= right) drawSpring(spring, level);
    }
    for (const checkpoint of level.checkpoints || [level.checkpoint]) drawCheckpoint(checkpoint, level);
    if (level.secretEntrance && !level.secret?.used) drawSecretEntrance(level.secretEntrance, level);
    drawGoal(level.goal, level);
    if (level.puzzle) drawPuzzleChallenge(level.puzzle, level);
    for (const crystal of level.collectibles) {
      if (!crystal.collected && crystal.x >= left && crystal.x <= right) drawCrystal(crystal, level);
    }
    for (const item of level.items || []) {
      if (!item.collected && item.x >= left && item.x <= right) drawRegionalItem(item, level);
    }
    for (const life of level.lifePickups || []) {
      if (!life.collected && life.x >= left && life.x <= right) drawLifePickup(life, level);
    }
    for (const hazard of level.hazards) {
      if (!hazard.collected && hazard.x >= left && hazard.x <= right) drawHazard(hazard, level);
    }
    if (level.handcrafted) drawLevelHints(level);
    if (level.mood === "mine" || level.backdrop === "mine") drawCaveDarkness(level);
    drawParticles();
    if (game.player) drawPlayer(game.player);
    ctx.restore();
  }

  function drawPuzzleChallenge(puzzle, level) {
    const firstNode = puzzle.nodes[0];
    ctx.save();
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(20,48,43,.76)";
    ctx.beginPath(); ctx.roundRect(firstNode.x - 58, firstNode.y - 76, 116, 20, 8); ctx.fill();
    ctx.fillStyle = puzzle.solved ? "#dff5b8" : "#fff4c2";
    ctx.fillText(puzzle.solved ? "WEG FREI" : puzzle.name.toUpperCase(), firstNode.x, firstNode.y - 62);

    for (const node of puzzle.nodes) {
      const glow = node.active || puzzle.solved;
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.shadowColor = glow ? "#ffe27a" : "rgba(255,233,155,.4)";
      ctx.shadowBlur = glow ? 16 : 5;

      if (puzzle.id === "crystalChime") {
        ctx.fillStyle = glow ? "#ffd75c" : "#6ea4ad";
        ctx.beginPath();
        ctx.moveTo(0, -23); ctx.lineTo(14, -6); ctx.lineTo(8, 19); ctx.lineTo(-8, 19); ctx.lineTo(-14, -6); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#eff8de";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(0, 14); ctx.moveTo(0, -2); ctx.lineTo(11, -6); ctx.stroke();
      } else if (puzzle.id === "crankBridge") {
        ctx.strokeStyle = "#7c4b2f";
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-2, 20); ctx.lineTo(-2, -17); ctx.stroke();
        ctx.fillStyle = glow ? "#e8be55" : "#9e6842";
        ctx.beginPath(); ctx.arc(-2, -18, 15, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#f5ddb0"; ctx.lineWidth = 2; ctx.stroke();
        for (let spoke = 0; spoke < 4; spoke += 1) {
          const angle = spoke * TAU / 4 + (glow ? game.time * 2 : 0);
          ctx.beginPath(); ctx.moveTo(-2, -18); ctx.lineTo(-2 + Math.cos(angle) * 12, -18 + Math.sin(angle) * 12); ctx.stroke();
        }
      } else if (puzzle.id === "solarRelay") {
        ctx.fillStyle = "#42564e";
        ctx.fillRect(-24, 12, 48, 6);
        ctx.fillRect(-4, 16, 8, 17);
        ctx.fillStyle = "#1b526b";
        ctx.beginPath(); ctx.moveTo(-28, -21); ctx.lineTo(19, -28); ctx.lineTo(27, 7); ctx.lineTo(-20, 13); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#9cd2dd"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = "rgba(205,242,238,.65)";
        ctx.beginPath(); ctx.moveTo(-11, -22); ctx.lineTo(-4, 10); ctx.moveTo(5, -25); ctx.lineTo(12, 8); ctx.moveTo(-24, -7); ctx.lineTo(23, -14); ctx.stroke();
        ctx.fillStyle = "rgba(255,239,133,.22)";
        ctx.beginPath(); ctx.arc(0, -8, 34, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffd75c";
        ctx.fillRect(-24, -39, 48, 5);
        ctx.fillStyle = "#7bd6ae";
        ctx.fillRect(-22, -38, 44 * Math.min(1, puzzle.charge / 1.1), 3);
      } else if (puzzle.id === "railSignal") {
        ctx.fillStyle = "#384849";
        ctx.fillRect(-4, -36, 8, 57);
        ctx.fillStyle = glow ? "#73df85" : "#d95d55";
        ctx.beginPath(); ctx.arc(0, -43, 12, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#eff3de"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#324641";
        ctx.fillRect(-18, 19, 36, 5);
      } else if (puzzle.id === "windWheels") {
        ctx.strokeStyle = "#75503a";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 21); ctx.lineTo(0, -2); ctx.stroke();
        ctx.fillStyle = glow ? "#bfe4e7" : "#91a8aa";
        for (let blade = 0; blade < 4; blade += 1) {
          const angle = blade * TAU / 4 + (glow ? game.time * 2.6 : 0);
          ctx.save(); ctx.rotate(angle);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(16, -14, 23, -3); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "#e9d587";
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawForegroundDepth(level) {
    const visibleWidth = getViewWidth();
    ctx.save();
    const bottomShade = ctx.createLinearGradient(0, H - 170, 0, H);
    bottomShade.addColorStop(0, "rgba(12,29,24,0)");
    bottomShade.addColorStop(1, level.mood === "mine" ? "rgba(5,12,14,.24)" : "rgba(11,27,20,.13)");
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, H - 170, visibleWidth, 170);

    const edgeShade = ctx.createLinearGradient(0, 0, visibleWidth, 0);
    edgeShade.addColorStop(0, "rgba(9,25,19,.13)");
    edgeShade.addColorStop(.075, "rgba(9,25,19,0)");
    edgeShade.addColorStop(.925, "rgba(9,25,19,0)");
    edgeShade.addColorStop(1, "rgba(9,25,19,.13)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(0, 0, visibleWidth, H);

    ctx.globalAlpha = level.mood === "mine" ? .18 : .09;
    ctx.filter = "blur(5px)";
    ctx.fillStyle = level.mood === "night" ? "#172b35" : "#173b2b";
    for (const side of [-1, 1]) {
      const anchor = side < 0 ? -22 : visibleWidth + 22;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.ellipse(anchor + side * (i % 2) * 14, H - 34 - i * 31, 44 - i * 3, 27, side * .35, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawWorldDecor(level) {
    const visibleWidth = getViewWidth();
    if (level.underwater) {
      drawUnderwaterWorldDecor(level, visibleWidth);
      return;
    }
    if (level.isBonusRoom) drawBonusRoomDecor(level, visibleWidth);
    if (level.handcrafted) drawSeiffenDecorations(level, visibleWidth);
    const start = Math.max(0, Math.floor(game.cameraX / 340) - 1);
    const end = Math.ceil((game.cameraX + visibleWidth) / 340) + 1;
    for (let i = start; i <= end; i += 1) {
      const x = i * 340 + 90;
      const ground = groundAt(level, x);
      if (!ground) continue;
      if (!level.isBonusRoom && (i + level.index) % 3 === 0) drawSpruce(x, ground.y, 105 + (i % 3) * 18, "#27543f", 1);
      const signX = x + 100;
      const signGround = groundAt(level, signX);
      if (!level.isBonusRoom && (i + level.index) % 5 === 2 && level.mood !== "mine" && signGround?.id === ground.id) {
        drawSignpost(signX, signGround.y + 1, i % 2 ? "↑" : "→");
      }
      drawRegionalForeground(level, x, ground.y, i);
    }
    if (game.talents.has("secretPaths")) drawSecretPathGuides(level);
  }

  function drawUnderwaterWorldDecor(level, visibleWidth) {
    const left = game.cameraX - 180;
    const right = game.cameraX + visibleWidth + 180;
    ctx.save();
    for (let x = 260; x < level.worldWidth; x += 520) {
      if (x < left || x > right) continue;
      const floor = groundAt(level, x) || { y: 650 };
      const sway = Math.sin(game.time * 1.15 + x * .01) * .12;
      ctx.strokeStyle = "rgba(82,169,143,.58)";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      for (let stem = 0; stem < 3; stem += 1) {
        ctx.beginPath();
        ctx.moveTo(x + stem * 15, floor.y);
        ctx.quadraticCurveTo(x - 8 + stem * 14, floor.y - 42, x + stem * 13 + sway * 28, floor.y - 78 - stem * 9);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(90,229,221,.42)";
      for (let bubble = 0; bubble < 3; bubble += 1) {
        const by = floor.y - 105 - bubble * 42 - wrap(game.time * (12 + bubble * 3) + x, 0, 54);
        ctx.beginPath(); ctx.arc(x + 55 + bubble * 12, by, 3 + bubble, 0, TAU); ctx.fill();
      }
    }
    for (const current of level.currents || []) {
      if (current.x + current.w < left || current.x > right) continue;
      ctx.globalAlpha = .16;
      ctx.strokeStyle = "#baf8f4";
      ctx.lineWidth = 2;
      for (let row = 0; row < 4; row += 1) {
        const y = current.y + 70 + row * 88;
        const offset = wrap(game.time * current.push * .25 + row * 53, 0, 110);
        for (let x = current.x - 80 + offset; x < current.x + current.w; x += 110) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 25, y - 8, x + 52, y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBonusRoomDecor(level, visibleWidth) {
    const left = game.cameraX - 150;
    const right = game.cameraX + visibleWidth + 150;
    ctx.save();
    if (["spring-workshop", "clockwork"].includes(level.specialMechanic)) {
      for (let x = 360; x < level.worldWidth; x += 520) {
        if (x < left || x > right) continue;
        drawClockworkGear(x, 515 - (x % 3) * 26, 34 + (x % 2) * 10, x * .01);
      }
    } else if (level.specialMechanic === "water-grotto") {
      ctx.globalAlpha = .4;
      ctx.fillStyle = "#3d9dac";
      for (const current of level.currents) {
        ctx.beginPath(); ctx.roundRect(current.x, 565, current.w, 72, 18); ctx.fill();
        ctx.strokeStyle = "rgba(225,255,250,.65)"; ctx.lineWidth = 2;
        for (let x = current.x + 18; x < current.x + current.w; x += 45) {
          ctx.beginPath(); ctx.arc(x + Math.sin(game.time * 2 + x) * 8, 585, 12, .2, Math.PI - .2); ctx.stroke();
        }
      }
    } else if (level.specialMechanic === "train-depot") {
      for (let x = 150; x < level.worldWidth; x += 620) {
        if (x >= left && x <= right) drawRailTrack(x - 100, 565, 330);
      }
    } else if (level.specialMechanic === "granite-climb") {
      ctx.fillStyle = "rgba(232,211,157,.3)";
      ctx.font = "900 34px Georgia";
      for (let x = 420; x < level.worldWidth; x += 560) {
        if (x >= left && x <= right) ctx.fillText("✦", x, 480 - (x % 4) * 36);
      }
    } else if (level.specialMechanic === "ice-wind") {
      ctx.fillStyle = "rgba(202,238,244,.56)";
      for (let x = 250; x < level.worldWidth; x += 310) {
        if (x < left || x > right) continue;
        ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x + 18, 150 + x % 55); ctx.lineTo(x + 36, 90); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawClockworkGear(x, y, radius, phase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(game.time * .18 + phase);
    ctx.strokeStyle = "rgba(203,151,76,.42)";
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i += 1) {
      const angle = i * TAU / 8;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12); ctx.lineTo(Math.cos(angle) * (radius + 10), Math.sin(angle) * (radius + 10)); ctx.stroke();
    }
    ctx.fillStyle = "rgba(58,45,34,.65)";
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRegionalForeground(level, x, y, index) {
    switch (level.mood) {
      case "village":
        if (index % 4 === 0) drawFachwerkHouse(x + 48, y, .56, level.accent);
        if (index % 5 === 0) drawToyArch(x - 42, y - 10, .32);
        break;
      case "mine":
        drawMineSupport(x, y, 1);
        break;
      case "river":
        break;
      case "rail":
        drawRailTrack(x - 125, y - 2, 250);
        break;
      case "rooftops":
        if (index % 2 === 0) drawChimney(x + 72, y, .88);
        if (index % 4 === 0) drawFachwerkHouse(x - 42, y + 5, .46, level.accent);
        break;
      case "night":
        if (index % 2 === 0) drawLantern(x + 45, y, .9);
        break;
      case "rocks":
        if (index % 2) drawClimbingFlag(x + 32, y - 15);
        break;
      case "summit":
      case "castle":
        drawWindRibbon(x, y - 135, index);
        break;
      default:
        break;
    }
  }

  function drawSecretPathGuides(level) {
    const guides = level.secretEntrance && !level.secret?.used
      ? [{ x: level.secretEntrance.x + level.secretEntrance.w / 2, y: level.secretEntrance.y - 16 }]
      : [];
    for (const guide of guides) {
      ctx.save();
      ctx.globalAlpha = .65 + Math.sin(game.time * 3 + guide.x) * .2;
      ctx.fillStyle = "#ffe184";
      ctx.beginPath();
      ctx.arc(guide.x, guide.y, 4, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  function drawCaveDarkness(level) {
    const player = game.player;
    if (!player) return;
    ctx.save();
    ctx.fillStyle = "rgba(12,27,33,.48)";
    const x = player.x + player.w / 2;
    const y = player.y + player.h / 2;
    const left = game.cameraX - 200;
    const width = getViewWidth() + 400;
    ctx.beginPath();
    ctx.rect(left, 0, width, H);
    ctx.roundRect(x - 145, y - 130, 290, 260, 110);
    ctx.fill("evenodd");
    ctx.restore();
  }

  function drawLevelHints(level) {
    const visibleWidth = getViewWidth();
    for (const hint of level.hints) {
      if (hint.x > game.cameraX - 220 && hint.x < game.cameraX + visibleWidth + 220) drawHintBoard(hint);
    }
  }

  function drawRailAdventureDecorations(level, visibleWidth) {
    const markers = [
      { x: 720, y: 620, label: "START" },
      { x: 2025, y: 620, label: "HALT" },
      { x: 3615, y: 595, label: "WEICHE" },
      { x: 5060, y: 620, label: "TALFAHRT" },
      { x: 7840, y: 590, label: "DEPOT" },
    ];
    for (const marker of markers) {
      if (marker.x < game.cameraX - 180 || marker.x > game.cameraX + visibleWidth + 180) continue;
      drawRailRouteMarker(marker.x, marker.y, marker.label);
    }
    for (const zone of level.railBoostZones || []) {
      if (zone.x + zone.w < game.cameraX - 120 || zone.x > game.cameraX + visibleWidth + 120) continue;
      ctx.save();
      ctx.globalAlpha = .32;
      ctx.strokeStyle = "#d6ecf2";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let row = 0; row < 3; row += 1) {
        const y = zone.y - 58 - row * 22;
        const offset = wrap(game.time * 185 + row * 87, 0, 96);
        for (let x = zone.x - 80 + offset; x < zone.x + zone.w; x += 96) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 18, y - 6, x + 43, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawRailRouteMarker(x, y, label) {
    ctx.save();
    ctx.fillStyle = "#5b4535";
    ctx.fillRect(x - 3, y - 75, 6, 75);
    ctx.fillStyle = "#255f86";
    ctx.beginPath(); ctx.roundRect(x - 42, y - 93, 84, 31, 7); ctx.fill();
    ctx.strokeStyle = "#dcecf0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f5f0d9";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - 73);
    ctx.fillStyle = "#f5d568";
    ctx.beginPath(); ctx.arc(x - 29, y - 77, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSeiffenDecorations(level, visibleWidth) {
    for (const decor of level.decorations) {
      if (decor.x < game.cameraX - 260 || decor.x > game.cameraX + visibleWidth + 260) continue;
      switch (decor.type) {
        case "village-sign":
          drawVillageSign(decor.x, decor.y, decor.text);
          break;
        case "workshop":
          drawWorkshop(decor.x, decor.y, decor.scale);
          break;
        case "wood-table":
          drawWoodTable(decor.x, decor.y, decor.scale);
          break;
        case "toy-arch":
          drawToyArch(decor.x, decor.y, decor.scale);
          break;
        case "log-pile":
          drawLogPile(decor.x, decor.y, decor.scale);
          break;
        case "finish-house":
          drawFinishHouse(decor.x, decor.y, decor.scale);
          break;
      }
    }
  }

  function drawVillageSign(x, y, text) {
    ctx.save();
    ctx.fillStyle = "#67472f";
    ctx.fillRect(x - 4, y - 91, 8, 91);
    ctx.fillStyle = "#c58a4c";
    ctx.beginPath();
    ctx.roundRect(x - 52, y - 101, 104, 38, 7);
    ctx.fill();
    ctx.strokeStyle = "#765033";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff1c9";
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y - 77);
    ctx.restore();
  }

  function drawWorkshop(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = .94;
    drawFachwerkHouse(x, y, scale, "#b24b50");
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#5d4030";
    ctx.fillRect(22, -126, 15, 34);
    for (let i = 0; i < 3; i += 1) {
      const drift = Math.sin(game.time * .8 + i) * 4;
      ctx.globalAlpha = .22 - i * .045;
      ctx.fillStyle = "#f4eee1";
      ctx.beginPath();
      ctx.arc(29 + drift, -137 - i * 17, 9 + i * 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWoodTable(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#67472f";
    ctx.fillRect(-70, -57, 140, 13);
    ctx.fillRect(-55, -45, 10, 45);
    ctx.fillRect(45, -45, 10, 45);
    const colors = ["#c14d54", "#efbf46", "#368476"];
    for (let i = 0; i < 3; i += 1) {
      const px = -42 + i * 42;
      ctx.fillStyle = colors[i];
      ctx.beginPath(); ctx.arc(px, -71, 9, 0, TAU); ctx.fill();
      ctx.fillRect(px - 7, -63, 14, 19);
      ctx.fillStyle = "#f6dfb4";
      ctx.beginPath(); ctx.arc(px, -73, 3, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawToyArch(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#8b5d35";
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, 0, 98, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-102, 0); ctx.lineTo(102, 0); ctx.stroke();
    for (let i = -3; i <= 3; i += 1) {
      const px = i * 24;
      const py = -Math.sqrt(Math.max(0, 92 ** 2 - px ** 2));
      ctx.fillStyle = "#f2c85c";
      ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = "#b8793d";
      ctx.beginPath(); ctx.arc(px, -18, 6, 0, TAU); ctx.fill();
      ctx.fillRect(px - 4, -12, 8, 12);
    }
    ctx.restore();
  }

  function drawLogPile(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i < 4 - row; i += 1) {
        const px = -55 + i * 36 + row * 18;
        const py = -14 - row * 27;
        ctx.fillStyle = "#765137";
        ctx.beginPath();
        ctx.roundRect(px, py - 16, 41, 22, 9); ctx.fill();
        ctx.fillStyle = "#bd8750";
        ctx.beginPath(); ctx.arc(px + 36, py - 5, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(91,57,36,.55)";
        ctx.beginPath(); ctx.arc(px + 36, py - 5, 5, 0, TAU); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFinishHouse(x, y, scale) {
    drawFachwerkHouse(x, y, scale, "#3f8a65");
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#f2c85c";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? 8 : 16;
      const px = 64 + Math.cos(angle) * radius;
      const py = -87 + Math.sin(angle) * radius;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawHintBoard(hint) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.font = "900 13px Arial, sans-serif";
    const width = Math.max(145, ctx.measureText(hint.text).width + 34);
    ctx.fillStyle = "#6c4b33";
    ctx.fillRect(hint.x - 3, hint.y - 71, 6, 71);
    ctx.fillStyle = "rgba(255,250,230,.94)";
    ctx.beginPath();
    ctx.roundRect(hint.x - width / 2, hint.y - 112, width, 45, 12);
    ctx.fill();
    ctx.strokeStyle = "#c18a50";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#102f2a";
    ctx.textAlign = "center";
    ctx.fillText(hint.text, hint.x, hint.y - 84);
    ctx.restore();
  }

  function drawSecretStar(level) {
    const x = 1545;
    const y = 214;
    ctx.save();
    ctx.globalAlpha = level.secret.found ? 1 : .7 + Math.sin(game.time * 3) * .18;
    ctx.shadowColor = "#ffe184";
    ctx.shadowBlur = level.secret.found ? 20 : 8;
    ctx.fillStyle = level.secret.found ? "#f4c84d" : "#c78b3e";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? 10 : 22;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawPlatform(platform, level) {
    ctx.save();
    if (!platform.ground) {
      ctx.globalAlpha = .23;
      ctx.fillStyle = "#132c25";
      ctx.filter = "blur(3px)";
      ctx.beginPath();
      ctx.ellipse(platform.x + platform.w * .53, platform.y + 38, Math.min(92, platform.w * .38), 9, 0, 0, TAU);
      ctx.fill();
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    }
    if (platform.toggle) {
      ctx.globalAlpha = platform.visibility ?? 1;
      ctx.shadowColor = "#ffe178";
      ctx.shadowBlur = 10 * (platform.visibility ?? 1);
    }
    if (platform.type === "train") {
      drawTrainPlatform(platform, level);
      if (platform.conveyor) drawConveyorMarkers(platform);
      ctx.restore();
      return;
    }
    if (platform.type === "wood") {
      drawWoodPlatform(platform);
      if (platform.conveyor) drawConveyorMarkers(platform);
      ctx.restore();
      return;
    }

    if (platform.type === "roof") {
      drawSlateRoof(platform);
      ctx.restore();
      return;
    }

    drawMossyRockPlatform(platform, level);
    if (platform.conveyor) drawConveyorMarkers(platform);
    ctx.restore();
  }

  function drawConveyorMarkers(platform) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = .72;
    ctx.fillStyle = "#f8d46c";
    const direction = Math.sign(platform.conveyor) || 1;
    for (let x = platform.x + 24; x < platform.x + platform.w - 18; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x - direction * 7, platform.y + 6);
      ctx.lineTo(x + direction * 7, platform.y + 11);
      ctx.lineTo(x - direction * 7, platform.y + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWoodPlatform(platform) {
    const x = platform.x;
    const y = platform.y;
    const beamGradient = ctx.createLinearGradient(0, y + 7, 0, y + 35);
    beamGradient.addColorStop(0, "#5b3927");
    beamGradient.addColorStop(1, "#2f211a");
    ctx.fillStyle = beamGradient;
    ctx.beginPath(); ctx.roundRect(x - 7, y + 6, platform.w + 14, 28, 7); ctx.fill();

    if (!platform.moving && platform.w > 170) {
      ctx.strokeStyle = "#563722";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 30); ctx.lineTo(x + 48, y + 88);
      ctx.moveTo(x + platform.w - 24, y + 30); ctx.lineTo(x + platform.w - 48, y + 88);
      ctx.moveTo(x + 38, y + 70); ctx.lineTo(x + platform.w - 38, y + 70);
      ctx.stroke();
      ctx.strokeStyle = "rgba(229,168,91,.28)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 42, y + 67); ctx.lineTo(x + platform.w - 42, y + 67); ctx.stroke();
    }

    const plankW = 38;
    for (let plankIndex = 0, offset = 0; offset < platform.w; plankIndex += 1, offset += plankW) {
      const px = x + offset;
      const width = Math.min(plankW - 3, platform.w - offset);
      const plank = ctx.createLinearGradient(0, y - 2, 0, y + 20);
      plank.addColorStop(0, plankIndex % 2 ? "#e0a45b" : "#c88b49");
      plank.addColorStop(.5, plankIndex % 2 ? "#b9793e" : "#a96938");
      plank.addColorStop(1, "#75462c");
      ctx.fillStyle = plank;
      ctx.beginPath(); ctx.roundRect(px, y - 2, width, 22, 4); ctx.fill();
      ctx.strokeStyle = "rgba(255,220,157,.24)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 4, y + 2); ctx.lineTo(px + width - 4, y + 2); ctx.stroke();
      ctx.fillStyle = "#493227";
      ctx.beginPath(); ctx.arc(px + 7, y + 10, 2, 0, TAU); ctx.fill();
    }

    if (platform.moving) {
      ctx.strokeStyle = "rgba(55,38,29,.55)";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + 18, y + 6); ctx.lineTo(x + platform.w - 18, y + 6); ctx.stroke();
    }
  }

  function drawSlateRoof(platform) {
    const x = platform.x;
    const y = platform.y;
    const roofGradient = ctx.createLinearGradient(0, y - 26, 0, y + 13);
    roofGradient.addColorStop(0, "#69747a");
    roofGradient.addColorStop(.5, "#46545b");
    roofGradient.addColorStop(1, "#26363d");
    ctx.fillStyle = roofGradient;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 12); ctx.lineTo(x + 21, y - 25);
    ctx.lineTo(x + platform.w - 17, y - 25); ctx.lineTo(x + platform.w + 14, y + 12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(197,218,221,.24)";
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 3; row += 1) {
      const py = y - 18 + row * 10;
      ctx.beginPath(); ctx.moveTo(x + 13 - row * 8, py); ctx.lineTo(x + platform.w - 10 + row * 7, py); ctx.stroke();
      for (let px = x + 17 + (row % 2) * 11; px < x + platform.w - 8; px += 22) {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 6, py + 9); ctx.stroke();
      }
    }
    ctx.fillStyle = "#6d442c";
    ctx.fillRect(x - 8, y + 10, platform.w + 16, 8);
    ctx.fillStyle = "rgba(246,194,108,.34)";
    ctx.fillRect(x - 6, y + 10, platform.w + 12, 2);
  }

  function drawMossyRockPlatform(platform, level) {
    const x = platform.x;
    const y = platform.y;
    // Keep procedural surface details anchored to the platform's origin. Moving
    // platforms may change their draw position, but their rocks and moss must not.
    const visualSeed = Number.isFinite(platform.baseX) ? platform.baseX : x;
    const isMine = platform.type === "mine";
    const depth = Math.max(24, Math.min(platform.h, platform.ground ? 210 : 145));
    const bodyGradient = ctx.createLinearGradient(0, y, 0, y + depth);
    bodyGradient.addColorStop(0, isMine ? "#53605c" : "#667467");
    bodyGradient.addColorStop(.48, isMine ? "#34413f" : "#46564a");
    bodyGradient.addColorStop(1, isMine ? "#202c2d" : "#283a31");
    ctx.fillStyle = bodyGradient;
    ctx.beginPath(); ctx.roundRect(x, y, platform.w, platform.h, platform.ground ? 8 : 14); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, platform.w, depth, 12); ctx.clip();
    const rowHeight = 43;
    for (let row = 0; row < Math.ceil(depth / rowHeight) + 1; row += 1) {
      const py = y + 8 + row * rowHeight;
      const offset = row % 2 ? -39 : -7;
      for (let col = 0; col < Math.ceil(platform.w / 70) + 2; col += 1) {
        const seed = visualSeed * .013 + row * 31 + col * 17;
        const px = x + offset + col * 70;
        const width = 59 + hash(seed) * 21;
        const height = 34 + hash(seed + 7) * 13;
        ctx.fillStyle = isMine
          ? (col + row) % 3 === 0 ? "#4d5a56" : "#3d4b48"
          : (col + row) % 3 === 0 ? "#697668" : (col + row) % 3 === 1 ? "#59675b" : "#4d5d51";
        ctx.shadowColor = "rgba(8,20,16,.34)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        const rockY = py + hash(seed + 19) * 5;
        ctx.moveTo(px + 9, rockY + 2);
        ctx.lineTo(px + width * .58, rockY);
        ctx.lineTo(px + width - 8, rockY + 6);
        ctx.lineTo(px + width, rockY + height * .48);
        ctx.lineTo(px + width - 10, rockY + height - 3);
        ctx.lineTo(px + width * .37, rockY + height);
        ctx.lineTo(px + 3, rockY + height - 9);
        ctx.lineTo(px, rockY + height * .35);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = isMine ? "rgba(12,24,24,.54)" : "rgba(24,42,33,.45)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = "rgba(229,236,207,.12)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + 10, rockY + 8); ctx.quadraticCurveTo(px + width * .55, rockY + 2, px + width - 11, rockY + 9);
        ctx.stroke();
        if (!isMine && (row + col) % 4 === 1) {
          ctx.fillStyle = "rgba(111,139,75,.45)";
          ctx.beginPath(); ctx.ellipse(px + width * .68, rockY + height * .42, 7, 3.5, -.35, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.restore();

    const cap = ctx.createLinearGradient(0, y - 12, 0, y + 14);
    cap.addColorStop(0, isMine ? "#9b8c62" : "#c0cf6e");
    cap.addColorStop(.38, isMine ? "#6f765e" : "#79984e");
    cap.addColorStop(1, isMine ? "#47534d" : "#456b3c");
    ctx.fillStyle = cap;
    ctx.beginPath(); ctx.roundRect(x - 3, y - 9, platform.w + 6, 20, 9); ctx.fill();
    ctx.fillStyle = isMine ? "rgba(217,180,91,.22)" : "#3f6b38";
    const dripCount = Math.min(15, Math.max(2, Math.floor(platform.w / 42)));
    for (let i = 0; i < dripCount; i += 1) {
      const px = x + 8 + hash(visualSeed * .041 + i * 17) * Math.max(1, platform.w - 16);
      const drop = 4 + hash(visualSeed * .081 + i * 29) * 14;
      ctx.beginPath();
      ctx.moveTo(px - 5, y + 7); ctx.quadraticCurveTo(px, y + 7 + drop, px + 4, y + 7); ctx.closePath(); ctx.fill();
    }

    if (!isMine) {
      const tuftCount = Math.min(13, Math.max(1, Math.floor(platform.w / 58)));
      ctx.lineCap = "round";
      for (let i = 0; i < tuftCount; i += 1) {
        const tx = x + 16 + hash(visualSeed * .07 + i * 11) * Math.max(1, platform.w - 32);
        const tall = 8 + hash(visualSeed * .13 + i * 23) * 8;
        ctx.strokeStyle = i % 3 ? "#4b793f" : "#88a94e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx, y - 6); ctx.quadraticCurveTo(tx - 4, y - tall, tx - 8, y - tall - 1);
        ctx.moveTo(tx, y - 6); ctx.quadraticCurveTo(tx + 3, y - tall + 1, tx + 7, y - tall);
        ctx.stroke();
        if (i % 5 === 1 && platform.w > 105) {
          ctx.fillStyle = i % 2 ? "#f2cf62" : "#e8e8dc";
          ctx.beginPath(); ctx.arc(tx + 6, y - tall - 2, 2.7, 0, TAU); ctx.fill();
        }
      }
    } else if (platform.w > 90) {
      ctx.save();
      ctx.shadowColor = "#ffb42b";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(255,177,45,.72)";
      for (let i = 0; i < Math.min(4, Math.floor(platform.w / 95)); i += 1) {
        const px = x + 35 + hash(visualSeed + i * 47) * (platform.w - 70);
        ctx.beginPath(); ctx.moveTo(px, y + 23); ctx.lineTo(px + 5, y + 33); ctx.lineTo(px, y + 42); ctx.lineTo(px - 5, y + 33); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawTrainPlatform(platform, level) {
    const x = platform.x;
    const y = platform.y;
    const carriage = ctx.createLinearGradient(0, y - 30, 0, y + 13);
    carriage.addColorStop(0, "#438457");
    carriage.addColorStop(.5, level.accent);
    carriage.addColorStop(1, "#1e543e");
    ctx.fillStyle = "#2b3332";
    ctx.beginPath(); ctx.roundRect(x - 4, y + 7, platform.w + 8, 27, 7); ctx.fill();
    ctx.fillStyle = carriage;
    ctx.beginPath(); ctx.roundRect(x + 14, y - 31, platform.w - 32, 41, 7); ctx.fill();
    ctx.strokeStyle = "#e2b750";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 18, y - 27, platform.w - 40, 30);
    for (let px = x + 35; px < x + platform.w - 28; px += 42) {
      ctx.fillStyle = "#b9d9d2";
      ctx.fillRect(px, y - 21, 23, 14);
      ctx.fillStyle = "rgba(255,245,188,.5)";
      ctx.fillRect(px + 3, y - 18, 8, 9);
    }
    ctx.fillStyle = "#1b2424";
    ctx.beginPath(); ctx.arc(x + 34, y + 35, 12, 0, TAU); ctx.arc(x + platform.w - 36, y + 35, 12, 0, TAU); ctx.fill();
    ctx.fillStyle = "#9c4b32";
    ctx.fillRect(x - 1, y + 28, platform.w + 2, 6);
    ctx.fillStyle = "rgba(244,244,230,.48)";
    const steam = Math.sin(game.time * 2 + (platform.baseX ?? x)) * 6;
    ctx.beginPath(); ctx.arc(x + 22 + steam, y - 47, 10, 0, TAU); ctx.arc(x + 28 + steam, y - 61, 15, 0, TAU); ctx.fill();
  }

  function drawSpring(spring, level) {
    const squish = Math.max(0, Math.sin(game.time * 5 + spring.x) * 0.08);
    ctx.save();
    ctx.translate(spring.x + spring.w / 2, spring.y + spring.h);
    ctx.scale(1, 1 - squish);
    ctx.shadowColor = "rgba(11,24,22,.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;
    ctx.strokeStyle = "#36423f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(15, -7); ctx.lineTo(-15, -14); ctx.lineTo(15, -21);
    ctx.stroke();
    ctx.fillStyle = level.accent;
    ctx.beginPath();
    ctx.roundRect(-28, -31, 56, 12, 6); ctx.fill();
    ctx.fillStyle = "#f2c44f";
    ctx.beginPath();
    ctx.roundRect(-22, -31, 44, 4, 3); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#813d35";
    ctx.beginPath(); ctx.roundRect(-30, -20, 60, 7, 4); ctx.fill();
    ctx.restore();
  }

  function drawCrystal(crystal, level) {
    const bob = Math.sin(game.time * 3 + crystal.phase) * 7;
    const x = crystal.x;
    const y = crystal.y + bob;
    ctx.save();
    const crystalGradient = ctx.createLinearGradient(x - 12, y - 20, x + 12, y + 18);
    crystalGradient.addColorStop(0, "#fff3a2");
    crystalGradient.addColorStop(.3, "#ffc43b");
    crystalGradient.addColorStop(.72, "#ef8b0d");
    crystalGradient.addColorStop(1, "#b94b0c");
    ctx.shadowColor = "#ffb51f";
    ctx.shadowBlur = 24;
    ctx.fillStyle = crystalGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - 21); ctx.lineTo(x + 14, y - 5); ctx.lineTo(x + 8, y + 18); ctx.lineTo(x - 8, y + 18); ctx.lineTo(x - 14, y - 5); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,250,205,.9)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x, y + 16); ctx.moveTo(x + 3, y - 5); ctx.lineTo(x + 13, y - 5); ctx.moveTo(x + 3, y - 5); ctx.lineTo(x - 13, y - 5); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath(); ctx.moveTo(x - 2, y - 16); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x, y + 8); ctx.lineTo(x - 6, y - 5); ctx.closePath(); ctx.fill();
    const twinkle = .45 + Math.sin(game.time * 5 + crystal.phase) * .35;
    ctx.globalAlpha = twinkle;
    ctx.strokeStyle = "#fff9d8";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 18, y - 22); ctx.lineTo(x + 18, y - 8); ctx.moveTo(x + 11, y - 15); ctx.lineTo(x + 25, y - 15); ctx.stroke();
    if (level.bonusMultiplier > 1) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff7cf";
      ctx.beginPath(); ctx.roundRect(x + 13, y + 12, 26, 14, 6); ctx.fill();
      ctx.fillStyle = "#9b571d";
      ctx.font = "900 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`×${level.bonusMultiplier}`, x + 26, y + 23);
    }
    ctx.restore();
  }

  function drawLifePickup(life, level) {
    const bob = Math.sin(game.time * 2.8 + life.phase) * 6;
    const pulse = 1 + Math.sin(game.time * 4.2 + life.phase) * .055;
    ctx.save();
    ctx.translate(life.x, life.y + bob);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "#ff6174";
    ctx.shadowBlur = 22;
    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 25);
    glow.addColorStop(0, "rgba(255,246,208,.95)");
    glow.addColorStop(1, "rgba(255,118,132,.08)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = "#e94f67";
    ctx.strokeStyle = "#fff3d1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 17);
    ctx.bezierCurveTo(-27, 2, -17, -19, 0, -9);
    ctx.bezierCurveTo(17, -19, 27, 2, 0, 17);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 6); ctx.moveTo(-6.5, -.5); ctx.lineTo(6.5, -.5); ctx.stroke();
    ctx.fillStyle = level.accent;
    ctx.beginPath(); ctx.arc(17, -16, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRegionalItem(item, level) {
    const bob = Math.sin(game.time * 2.6 + item.x * .01) * 5;
    const x = item.x;
    const y = item.y + bob;
    ctx.save();
    ctx.translate(x, y);
    if (item.rare) {
      ctx.strokeStyle = "rgba(255,247,190,.85)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 25 + Math.sin(game.time * 3 + x) * 2, 0, TAU); ctx.stroke();
    }
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255,252,225,.88)";
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "#fff3bf";
    ctx.lineWidth = 2;
    switch (item.type) {
      case "ticket":
        ctx.rotate(-.12); ctx.beginPath(); ctx.roundRect(-15, -10, 30, 20, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-8, -2, 16, 3);
        break;
      case "lantern":
        ctx.beginPath(); ctx.roundRect(-10, -9, 20, 22, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -8, 9, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "#fff0a1"; ctx.beginPath(); ctx.arc(0, 2, 5, 0, TAU); ctx.fill();
        break;
      case "coin":
      case "badge":
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(-4, -4, 4, 0, TAU); ctx.fill();
        break;
      case "heart":
        ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-23, 1, -13, -17, 0, -7); ctx.bezierCurveTo(13, -17, 23, 1, 0, 14); ctx.fill(); ctx.stroke();
        break;
      case "key":
        ctx.beginPath(); ctx.arc(-7, -2, 7, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(14, 13); ctx.lineTo(18, 9); ctx.moveTo(10, 9); ctx.lineTo(14, 5); ctx.stroke();
        break;
      case "flag":
        ctx.fillRect(-11, -15, 3, 30); ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(15, -7); ctx.lineTo(-8, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "candle":
        ctx.fillRect(-7, -4, 14, 18); ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(9, -8, 0, -3); ctx.quadraticCurveTo(-8, -9, 0, -18); ctx.fill();
        break;
      case "figure":
        ctx.beginPath(); ctx.arc(0, -9, 7, 0, TAU); ctx.fill(); ctx.fillRect(-9, -2, 18, 17); ctx.fillRect(-14, 1, 5, 12); ctx.fillRect(9, 1, 5, 12); ctx.stroke();
        break;
      default:
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const angle = -Math.PI / 2 + i * Math.PI / 5;
          const radius = i % 2 ? 7 : 15;
          if (!i) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function drawHazard(hazard, level) {
    const bounce = Math.abs(Math.sin(game.time * hazard.speed * 2 + hazard.phase)) * 8;
    const x = hazard.x;
    const y = hazard.y - bounce;
    ctx.save();
    if (hazard.aquatic || level.underwater) {
      const pulse = 1 + Math.sin(game.time * 2.1 + hazard.phase) * .08;
      ctx.translate(x, y);
      ctx.scale(pulse, 2 - pulse);
      ctx.shadowColor = "#55e0d8";
      ctx.shadowBlur = 18;
      const jelly = ctx.createRadialGradient(-6, -8, 2, 0, 0, 31);
      jelly.addColorStop(0, "rgba(133,239,230,.88)");
      jelly.addColorStop(1, "rgba(45,112,126,.78)");
      ctx.fillStyle = jelly;
      ctx.beginPath();
      ctx.arc(0, -3, 24, Math.PI, 0);
      ctx.quadraticCurveTo(23, 15, 13, 12);
      ctx.quadraticCurveTo(5, 21, 0, 12);
      ctx.quadraticCurveTo(-6, 21, -14, 12);
      ctx.quadraticCurveTo(-24, 15, -24, -3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f7fbef";
      ctx.beginPath(); ctx.arc(-7, -5, 5.5, 0, TAU); ctx.arc(7, -5, 5.5, 0, TAU); ctx.fill();
      ctx.fillStyle = "#17393f";
      ctx.beginPath(); ctx.arc(-6, -4, 2.1, 0, TAU); ctx.arc(8, -4, 2.1, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(168,245,239,.7)";
      ctx.lineWidth = 2;
      for (let tentacle = -2; tentacle <= 2; tentacle += 1) {
        ctx.beginPath();
        ctx.moveTo(tentacle * 8, 11);
        ctx.quadraticCurveTo(tentacle * 8 + Math.sin(game.time * 2 + tentacle) * 6, 23, tentacle * 8 - 3, 31);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (hazard.kind === "sunBoost") {
      const rayWiggle = Math.sin(game.time * hazard.speed * 6 + hazard.phase) * .12;
      ctx.translate(x, y);
      ctx.shadowColor = "rgba(255,185,63,.82)";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#e88932";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      for (let ray = 0; ray < 10; ray += 1) {
        const angle = (ray / 10) * TAU + rayWiggle;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 21, Math.sin(angle) * 21);
        ctx.lineTo(Math.cos(angle) * 29, Math.sin(angle) * 29);
        ctx.stroke();
      }
      const sunFace = ctx.createRadialGradient(-6, -8, 2, 0, 0, 23);
      sunFace.addColorStop(0, "#fff3a6");
      sunFace.addColorStop(.65, "#ffd45c");
      sunFace.addColorStop(1, "#ef9a36");
      ctx.fillStyle = sunFace;
      ctx.beginPath(); ctx.arc(0, 0, 21, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff9de";
      ctx.beginPath(); ctx.arc(-7, -4, 5.8, 0, TAU); ctx.arc(7, -4, 5.8, 0, TAU); ctx.fill();
      ctx.fillStyle = "#1e3834";
      ctx.beginPath(); ctx.arc(-6, -3, 2, 0, TAU); ctx.arc(8, -3, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = "#f09272";
      ctx.beginPath(); ctx.ellipse(-13, 6, 4, 2.5, 0, 0, TAU); ctx.ellipse(13, 6, 4, 2.5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#a95a35";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 6, 6, .18, Math.PI - .18); ctx.stroke();
      ctx.restore();
      return;
    }
    const cloudStyles = [
      { dark: "#6f7784", light: "#cbd0d8", highlight: "#eff1f4", outline: "#505966", blush: "#d5899c" },
      { dark: "#b86f8d", light: "#eca0b6", highlight: "#ffe3ea", outline: "#8f4d68", blush: "#ce6f8b" },
      { dark: "#8e8797", light: "#c4bccd", highlight: "#eee9f1", outline: "#696172", blush: "#cf829a" },
    ];
    const cloud = cloudStyles[Math.abs(Math.floor(hazard.phase * 7)) % cloudStyles.length];
    const wobble = Math.sin(game.time * hazard.speed * 3.1 + hazard.phase) * (hazard.motionKind === "loop" ? .08 : .035);
    const squash = hazard.motionKind === "hop" ? 1 + Math.sin(game.time * hazard.speed * 3.3 + hazard.phase) * .05 : 1;
    ctx.translate(x, y);
    ctx.rotate(wobble);
    ctx.scale(squash, 2 - squash);
    ctx.translate(-x, -y);
    const driftDirection = Math.cos(game.time * hazard.speed + hazard.phase) >= 0 ? 1 : -1;
    ctx.globalAlpha = .22;
    ctx.fillStyle = cloud.light;
    for (let puff = 0; puff < 2; puff += 1) {
      ctx.beginPath();
      ctx.arc(x - driftDirection * (31 + puff * 11), y + 5 + puff * 5, 5 - puff, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = .26;
    ctx.fillStyle = "#172927";
    ctx.beginPath(); ctx.ellipse(x, y + 27, 30, 8, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = cloud.dark;
    ctx.shadowBlur = 7;
    ctx.fillStyle = cloud.dark;
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * TAU;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 15, y + Math.sin(angle) * 12, 13 + (i % 2) * 3, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = cloud.light;
    ctx.beginPath();
    ctx.arc(x - 15, y + 2, 13, 0, TAU);
    ctx.arc(x - 4, y - 9, 16, 0, TAU);
    ctx.arc(x + 12, y - 7, 15, 0, TAU);
    ctx.arc(x + 21, y + 5, 12, 0, TAU);
    ctx.ellipse(x + 2, y + 9, 26, 13, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = cloud.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cloud.highlight;
    ctx.globalAlpha = .82;
    ctx.beginPath(); ctx.ellipse(x - 8, y - 12, 11, 6, -.25, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f8f4e8";
    ctx.beginPath(); ctx.arc(x - 8, y - 2, 6, 0, TAU); ctx.arc(x + 8, y - 2, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = "#172927";
    const eyeLook = game.player ? Math.max(-1.8, Math.min(1.8, (game.player.x + game.player.w * .5 - x) * .018)) : 0;
    ctx.beginPath(); ctx.arc(x - 7 + eyeLook, y - 1, 2.5, 0, TAU); ctx.arc(x + 7 + eyeLook, y - 1, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = cloud.blush;
    ctx.globalAlpha = .72;
    ctx.beginPath(); ctx.ellipse(x - 17, y + 7, 4, 2.5, 0, 0, TAU); ctx.ellipse(x + 17, y + 7, 4, 2.5, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = cloud.outline;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y + 8, 7, .18, Math.PI - .18); ctx.stroke();
    ctx.restore();
  }

  function drawCheckpoint(checkpoint, level) {
    ctx.save();
    ctx.fillStyle = "#65442f";
    ctx.fillRect(checkpoint.x, checkpoint.y, 7, 86);
    ctx.fillStyle = checkpoint.active ? "#ffd35f" : "#eee6cf";
    ctx.beginPath();
    ctx.moveTo(checkpoint.x + 7, checkpoint.y + 5);
    ctx.quadraticCurveTo(checkpoint.x + 44, checkpoint.y - 6, checkpoint.x + 58, checkpoint.y + 15);
    ctx.quadraticCurveTo(checkpoint.x + 39, checkpoint.y + 35, checkpoint.x + 7, checkpoint.y + 24);
    ctx.closePath(); ctx.fill();
    if (checkpoint.active) {
      ctx.shadowColor = "#ffd35f";
      ctx.shadowBlur = 25;
      ctx.fillStyle = "#fff4b4";
      ctx.beginPath(); ctx.arc(checkpoint.x + 4, checkpoint.y, 6, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = checkpoint.active ? "#fff3bf" : "#f7edd5";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(checkpoint.label || "RAST", checkpoint.x + 11, checkpoint.y + 50);
    ctx.restore();
  }

  function drawSecretEntrance(entrance, level) {
    const discovered = level.secret?.found;
    ctx.save();
    const glow = .6 + Math.sin(game.time * 2.2) * .08;
    ctx.shadowColor = "#f0b84c";
    ctx.shadowBlur = discovered ? 24 : 12;
    ctx.fillStyle = "#263a35";
    ctx.beginPath();
    ctx.roundRect(entrance.x, entrance.y + 18, entrance.w, entrance.h - 18, 24);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = discovered ? "#e6b54b" : "#735d3d";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(entrance.x + entrance.w / 2, entrance.y + 37, entrance.w * .4, Math.PI, 0);
    ctx.lineTo(entrance.x + entrance.w - 6, entrance.y + entrance.h);
    ctx.moveTo(entrance.x + 6, entrance.y + entrance.h);
    ctx.lineTo(entrance.x + 6, entrance.y + 37);
    ctx.stroke();
    ctx.globalAlpha = glow;
    ctx.fillStyle = "#ffd66d";
    ctx.beginPath(); ctx.arc(entrance.x + entrance.w / 2, entrance.y + 46, 5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f8edcf";
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(discovered ? "GEÖFFNET" : "?", entrance.x + entrance.w / 2, entrance.y + 69);
    ctx.restore();
  }

  function drawGoal(goal, level) {
    const glow = 0.78 + Math.sin(game.time * 3) * 0.12;
    ctx.save();
    if (level.underwater) {
      ctx.translate(goal.x + goal.w / 2, goal.y + goal.h / 2);
      ctx.shadowColor = "#67eee5";
      ctx.shadowBlur = 30;
      ctx.strokeStyle = "#79eee5";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 50, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = glow * .62;
      ctx.fillStyle = "#4ac6cf";
      ctx.beginPath(); ctx.ellipse(0, 0, 23, 43, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff0a6";
      ctx.font = "900 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("✦", 0, 7);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#66503f";
    ctx.beginPath();
    ctx.roundRect(goal.x, goal.y + 30, goal.w, goal.h - 30, 26); ctx.fill();
    ctx.fillStyle = level.accent;
    ctx.globalAlpha = glow;
    ctx.beginPath(); ctx.ellipse(goal.x + goal.w / 2, goal.y + 70, 25, 45, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#f0c766";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(goal.x + goal.w / 2, goal.y + 69, 28, Math.PI, 0); ctx.lineTo(goal.x + goal.w - 8, goal.y + 111); ctx.lineTo(goal.x + 8, goal.y + 111); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#f4d978";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const r = i % 2 ? 5 : 11;
      const x = goal.x + goal.w / 2 + Math.cos(a) * r;
      const y = goal.y + 18 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    if (level.isBonusRoom) {
      ctx.fillStyle = "#fff3c4";
      ctx.font = "900 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("ZURÜCK", goal.x + goal.w / 2, goal.y + 104);
    }
    ctx.restore();
  }

  function drawPlayer(player) {
    if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0) return;
    if (game.level?.underwater) {
      drawDivingPlayer(player);
      return;
    }
    const speedRatio = Math.min(1, Math.abs(player.vx) / 380);
    const stride = Math.sin(player.runCycle);
    const runBob = player.state === "run" ? Math.abs(Math.sin(player.runCycle)) * speedRatio * -5 : 0;
    let scaleX = 1;
    let scaleY = 1;
    let tilt = 0;
    let lift = runBob;

    if (player.state === "idle") {
      scaleY = 1 + Math.sin(game.time * 2.2) * .008;
      scaleX = 1 - Math.sin(game.time * 2.2) * .004;
      tilt = Math.sin(game.time * 1.15) * .008;
    } else if (player.state === "run") {
      scaleX = 1 + Math.abs(stride) * .025;
      scaleY = 1 - Math.abs(stride) * .02;
      tilt = player.vx * .00072 + stride * .018;
    } else if (player.state === "jump") {
      scaleX = .94;
      scaleY = 1.065;
      tilt = player.vx * .00042 - player.direction * .035;
      lift -= 3;
    } else if (player.state === "apex") {
      scaleX = 1.025;
      scaleY = .985;
      tilt = player.vx * .00036;
    } else if (player.state === "fall") {
      scaleX = 1.045;
      scaleY = .96;
      tilt = player.vx * .0003 + player.direction * .025;
    }

    if (player.takeoff > 0) {
      const takeoffAmount = Math.min(1, player.takeoff / .12);
      scaleX -= takeoffAmount * .045;
      scaleY += takeoffAmount * .075;
      lift -= takeoffAmount * 3;
    }

    if (player.landing > 0) {
      const landingAmount = Math.min(1, player.landing / .17);
      scaleX += landingAmount * .105;
      scaleY -= landingAmount * .12;
      lift += 4;
    }

    if (player.state === "run" && speedRatio > .55) {
      ctx.save();
      ctx.globalAlpha = .18 + speedRatio * .16;
      ctx.strokeStyle = "#f6edcf";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i += 1) {
        const lineY = player.y + 34 + i * 18 + Math.sin(player.runCycle + i) * 4;
        const startX = player.direction > 0 ? player.x - 10 : player.x + player.w + 10;
        ctx.beginPath();
        ctx.moveTo(startX, lineY);
        ctx.lineTo(startX - player.direction * (15 + i * 7) * speedRatio, lineY);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h + lift);
    ctx.rotate(tilt);
    ctx.scale(player.direction * scaleX, scaleY);
    const loadout = currentOutfitLoadout();
    if (player.state === "run" && speedRatio > .12) drawRunningBackpack(player, stride, speedRatio);
    drawTailoredOutfitBack(ctx, loadout, player, stride, speedRatio);
    drawCharacterSprite(player, stride, speedRatio);
    drawTailoredOutfitFront(ctx, loadout, player, stride, speedRatio);
    ctx.restore();
  }

  function drawDivingPlayer(player) {
    const speed = Math.min(1, Math.hypot(player.vx, player.vy) / 300);
    const stroke = Math.sin(player.runCycle * .82);
    const bob = Math.sin(game.time * 2.4 + player.runCycle * .16) * (1.5 + speed * 1.4);
    const pitch = Math.max(-.22, Math.min(.22, player.vy * .00072)) + stroke * .025 * speed;

    ctx.save();
    ctx.globalAlpha = .18 + speed * .14;
    ctx.strokeStyle = "#d2fbf7";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let line = 0; line < 3; line += 1) {
      const trailX = player.direction > 0 ? player.x - 4 : player.x + player.w + 4;
      const trailY = player.y + 15 + line * 11 + Math.sin(game.time * 4 + line) * 3;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(trailX - player.direction * (15 + line * 8) * speed, trailY + stroke * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2 + bob);
    ctx.rotate(pitch);
    ctx.scale(player.direction, 1 + Math.abs(stroke) * .025 * speed);
    if (divingCharacterImage.complete && divingCharacterImage.naturalWidth) {
      const kick = stroke * (.045 + speed * .065);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-30, -31, 91, 62);
      ctx.clip();
      ctx.drawImage(divingCharacterImage, -59, -28, 118, 56);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(-61, -33, 34, 66);
      ctx.clip();
      ctx.translate(-27, 0);
      ctx.rotate(kick);
      ctx.translate(27, 0);
      ctx.drawImage(divingCharacterImage, -59, -28, 118, 56);
      ctx.restore();
    } else {
      ctx.fillStyle = "#42b8c4";
      ctx.beginPath(); ctx.roundRect(-48, -21, 96, 42, 16); ctx.fill();
    }
    ctx.restore();

    if (Math.floor(game.time * 2.2 + player.runCycle * .05) % 3 === 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(199,250,246,.72)";
      ctx.lineWidth = 1.4;
      for (let bubble = 0; bubble < 2; bubble += 1) {
        const bx = player.x + player.w / 2 + player.direction * (38 + bubble * 9);
        const by = player.y + 12 - wrap(game.time * (15 + bubble * 3) + bubble * 21, 0, 34);
        ctx.beginPath(); ctx.arc(bx, by, 2.4 + bubble, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function equippedOutfit(category) {
    return OUTFITS.find((outfit) => outfit.category === category && game.equippedOutfits.has(outfit.id)) || null;
  }

  const outfitVariantCache = new Map();

  function currentOutfitLoadout() {
    return {
      jacket: equippedOutfit("jacket"),
      head: equippedOutfit("head"),
      shoes: equippedOutfit("shoes"),
      accessory: equippedOutfit("accessory"),
    };
  }

  function singleOutfitLoadout(outfit) {
    return {
      jacket: outfit.category === "jacket" ? outfit : null,
      head: outfit.category === "head" ? outfit : null,
      shoes: outfit.category === "shoes" ? outfit : null,
      accessory: outfit.category === "accessory" ? outfit : null,
    };
  }

  function outfitVariantKey(loadout) {
    return ["jacket", "head", "shoes", "accessory"].map((category) => loadout[category]?.id || "none").join("|");
  }

  function drawTailoredOutfitBack(target, loadout, player, stride, speedRatio) {
    if (loadout.jacket?.id === "cape") drawTailoredCape(target, player, speedRatio, loadout.jacket.color);
    if (loadout.accessory?.id === "scarf") drawTailoredScarfTail(target, player, stride, speedRatio, loadout.accessory.color);
  }

  function drawTailoredOutfitFront(target, loadout, player, stride, speedRatio) {
    if (loadout.jacket?.id === "cape") drawTailoredCapeCollar(target, loadout.jacket.color);
    else if (loadout.jacket) drawTailoredJacket(target, loadout.jacket, player, stride, speedRatio);
    if (loadout.shoes) drawTailoredShoes(target, loadout.shoes, player, stride, speedRatio);
    if (loadout.head) drawTailoredHeadwear(target, loadout.head, player);
    if (loadout.accessory?.id === "scarf") drawTailoredScarfKnot(target, loadout.accessory.color);
    if (loadout.accessory?.id === "cane") drawTailoredCane(target, player, stride, speedRatio);
    if (loadout.accessory?.id === "lanternGear") drawTailoredLantern(target, player, stride, speedRatio, loadout.accessory.color);
  }

  function outfitArmPoses(player, stride, speedRatio) {
    if (player.state === "run" && speedRatio > .12) {
      return [runningArmPose(stride, speedRatio, true), runningArmPose(stride, speedRatio, false)];
    }
    return [
      { shoulderX: -15, shoulderY: -68, controlX: -22, controlY: -57, handX: -25, handY: -37, gloveRotation: -.06 },
      { shoulderX: 14, shoulderY: -69, controlX: 18, controlY: -84, handX: 27, handY: -96, gloveRotation: .06 },
    ];
  }

  function drawTailoredCape(target, player, speedRatio, color) {
    const lift = player.onGround === false ? 5 : 0;
    const wave = Math.sin(game.time * 7.5 + player.runCycle * .45) * (2 + speedRatio * 4);
    const dark = darkenColor(color, .28);
    const light = lightenColor(color, .19);
    target.save();
    const gradient = target.createLinearGradient(-14, -78, -43, -15);
    gradient.addColorStop(0, light);
    gradient.addColorStop(.45, color);
    gradient.addColorStop(1, dark);
    target.fillStyle = gradient;
    target.strokeStyle = dark;
    target.lineWidth = 2.1;
    target.beginPath();
    target.moveTo(-15, -78);
    target.bezierCurveTo(-28, -72, -38 - wave, -58, -43 - speedRatio * 8, -34 + lift);
    target.quadraticCurveTo(-47 - wave, -20 + lift, -31, -7 + lift);
    target.quadraticCurveTo(-22, -15, -17, -31);
    target.lineTo(-10, -69);
    target.closePath();
    target.fill(); target.stroke();
    target.strokeStyle = "rgba(255,235,208,.34)";
    target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-22, -69); target.quadraticCurveTo(-32 - wave, -39, -30, -16); target.stroke();
    target.restore();
  }

  function drawTailoredCapeCollar(target, color) {
    target.save();
    target.fillStyle = darkenColor(color, .16);
    target.strokeStyle = darkenColor(color, .35);
    target.lineWidth = 1.7;
    target.beginPath();
    target.moveTo(-17, -76); target.quadraticCurveTo(0, -69, 17, -76);
    target.lineTo(14, -67); target.quadraticCurveTo(0, -63, -14, -68); target.closePath();
    target.fill(); target.stroke();
    target.fillStyle = "#e9b54d";
    target.beginPath(); target.arc(0, -69, 3.3, 0, TAU); target.fill();
    target.restore();
  }

  function drawTailoredScarfTail(target, player, stride, speedRatio, color) {
    const wave = Math.sin(game.time * 7 + stride) * 4;
    const lift = player.onGround === false ? 5 : 0;
    target.save();
    target.fillStyle = color;
    target.strokeStyle = darkenColor(color, .3);
    target.lineWidth = 1.5;
    target.beginPath();
    target.moveTo(-13, -70);
    target.bezierCurveTo(-25, -69 + wave, -29 - speedRatio * 10, -59, -38 - speedRatio * 9, -51 + wave + lift);
    target.lineTo(-31 - speedRatio * 8, -44 + wave + lift);
    target.bezierCurveTo(-24, -54, -18, -62, -8, -67);
    target.closePath(); target.fill(); target.stroke();
    for (let fringe = 0; fringe < 3; fringe += 1) {
      target.beginPath();
      target.moveTo(-36 + fringe * 3, -50 + wave + lift);
      target.lineTo(-39 + fringe * 3, -44 + wave + lift);
      target.stroke();
    }
    target.restore();
  }

  function drawTailoredScarfKnot(target, color) {
    target.save();
    target.fillStyle = color;
    target.strokeStyle = darkenColor(color, .3);
    target.lineWidth = 1.5;
    target.beginPath(); target.roundRect(-18, -72, 36, 8, 4); target.fill(); target.stroke();
    target.beginPath(); target.arc(13, -66, 4.5, 0, TAU); target.fill(); target.stroke();
    target.restore();
  }

  function drawTailoredJacket(target, outfit, player, stride, speedRatio) {
    const poses = outfitArmPoses(player, stride, speedRatio);
    const outline = outfit.id === "minerJacket" ? "#142630" : outfit.id === "winterJacket" ? "#6c2732" : "#203d34";
    const trim = outfit.id === "minerJacket" ? "#f0eee6" : outfit.id === "winterJacket" ? "#f5eee3" : "#dcb858";
    target.save();
    target.lineCap = "round";
    target.lineJoin = "round";
    for (const pose of poses) drawTailoredSleeve(target, pose, outfit, outline, trim);

    const bodyGradient = target.createLinearGradient(-22, -68, 22, -25);
    bodyGradient.addColorStop(0, lightenColor(outfit.color, outfit.id === "minerJacket" ? .1 : .2));
    bodyGradient.addColorStop(.47, outfit.color);
    bodyGradient.addColorStop(1, darkenColor(outfit.color, .2));
    target.fillStyle = bodyGradient;
    target.strokeStyle = outline;
    target.lineWidth = 2.2;
    target.beginPath();
    target.moveTo(-15, -71);
    target.quadraticCurveTo(-21, -70, -22, -62);
    target.lineTo(-20, -29);
    target.quadraticCurveTo(-18, -23, -12, -22);
    target.quadraticCurveTo(0, -20, 13, -22);
    target.quadraticCurveTo(20, -23, 21, -29);
    target.lineTo(22, -62);
    target.quadraticCurveTo(21, -70, 15, -71);
    target.quadraticCurveTo(0, -74, -15, -71);
    target.closePath(); target.fill(); target.stroke();

    if (outfit.id === "forestJacket") drawForestJacketDetails(target, outline, trim);
    else if (outfit.id === "minerJacket") drawMinerJacketDetails(target, outline, trim);
    else drawWinterJacketDetails(target, outline, trim);

    for (const pose of poses) drawRunningGloveOn(target, pose.handX, pose.handY, pose.gloveRotation);
    target.restore();
  }

  function drawTailoredSleeve(target, pose, outfit, outline, trim) {
    const dx = pose.handX - pose.shoulderX;
    const dy = pose.handY - pose.shoulderY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const cuffX = pose.handX - dx / length * 6.5;
    const cuffY = pose.handY - dy / length * 6.5;
    const width = outfit.id === "winterJacket" ? 11.5 : 9.5;
    target.strokeStyle = outline;
    target.lineWidth = width;
    target.beginPath(); target.moveTo(pose.shoulderX, pose.shoulderY); target.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); target.stroke();
    target.strokeStyle = outfit.color;
    target.lineWidth = width - 3;
    target.beginPath(); target.moveTo(pose.shoulderX, pose.shoulderY); target.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); target.stroke();
    target.fillStyle = trim;
    target.strokeStyle = outline;
    target.lineWidth = 1;
    target.beginPath(); target.arc(cuffX, cuffY, outfit.id === "winterJacket" ? 4.8 : 4, 0, TAU); target.fill(); target.stroke();
  }

  function drawForestJacketDetails(target, outline, trim) {
    target.strokeStyle = trim;
    target.lineWidth = 1.5;
    target.beginPath(); target.moveTo(0, -63); target.lineTo(0, -24); target.stroke();
    target.beginPath(); target.moveTo(-18, -35); target.lineTo(19, -35); target.stroke();
    target.fillStyle = trim;
    target.beginPath(); target.moveTo(-16, -69); target.lineTo(-3, -55); target.lineTo(0, -62); target.lineTo(3, -55); target.lineTo(17, -69); target.lineTo(15, -60); target.lineTo(6, -51); target.lineTo(-6, -51); target.lineTo(-15, -60); target.closePath(); target.fill();
    drawTailoredPocket(target, -15, -46, outline, trim, 9, 11);
    drawTailoredPocket(target, 7, -46, outline, trim, 9, 11);
    drawTailoredPocket(target, -15, -33, outline, trim, 10, 9);
    drawTailoredPocket(target, 6, -33, outline, trim, 10, 9);
    target.fillStyle = "#ebbf55";
    for (let y = -48; y <= -27; y += 7) { target.beginPath(); target.arc(4, y, 1.45, 0, TAU); target.fill(); }
  }

  function drawMinerJacketDetails(target, outline, trim) {
    target.fillStyle = trim;
    target.beginPath();
    target.moveTo(-17, -70); target.lineTo(-4, -54); target.lineTo(0, -62); target.lineTo(4, -54); target.lineTo(18, -70);
    target.lineTo(18, -62); target.lineTo(7, -49); target.lineTo(-7, -49); target.lineTo(-18, -62); target.closePath(); target.fill();
    target.strokeStyle = "#caa545";
    target.lineWidth = 1.3;
    target.beginPath(); target.moveTo(-17, -30); target.quadraticCurveTo(0, -27, 18, -30); target.stroke();
    target.fillStyle = "#d9ac45";
    for (const x of [-5, 6]) {
      for (let y = -45; y <= -28; y += 8.5) { target.beginPath(); target.arc(x, y, 1.65, 0, TAU); target.fill(); }
    }
    target.strokeStyle = trim;
    target.lineWidth = 1.4;
    target.beginPath(); target.moveTo(-13, -40); target.lineTo(-5, -37); target.moveTo(6, -37); target.lineTo(14, -40); target.stroke();
  }

  function drawWinterJacketDetails(target, outline, trim) {
    target.fillStyle = trim;
    target.strokeStyle = outline;
    target.lineWidth = 1.2;
    target.beginPath(); target.roundRect(-18, -74, 36, 10, 5); target.fill(); target.stroke();
    target.strokeStyle = "rgba(255,239,226,.48)";
    for (const y of [-55, -44, -33]) {
      target.beginPath(); target.moveTo(-19, y); target.quadraticCurveTo(0, y + 2, 19, y); target.stroke();
    }
    target.strokeStyle = trim;
    target.lineWidth = 2;
    target.beginPath(); target.moveTo(0, -63); target.lineTo(0, -23); target.stroke();
    target.fillStyle = darkenColor("#b84d57", .25);
    target.beginPath(); target.roundRect(-15, -39, 11, 12, 4); target.roundRect(5, -39, 11, 12, 4); target.fill();
    target.strokeStyle = trim;
    target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-14, -35); target.lineTo(-5, -35); target.moveTo(6, -35); target.lineTo(15, -35); target.stroke();
  }

  function drawTailoredPocket(target, x, y, outline, trim, width, height) {
    target.fillStyle = "rgba(14,35,30,.16)";
    target.strokeStyle = outline;
    target.lineWidth = .9;
    target.beginPath(); target.roundRect(x, y, width, height, 2.3); target.fill(); target.stroke();
    target.strokeStyle = trim;
    target.beginPath(); target.moveTo(x + 1, y + 2); target.lineTo(x + width - 1, y + 2); target.stroke();
  }

  function drawRunningGloveOn(target, x, y, rotation) {
    target.save();
    target.translate(x, y); target.rotate(rotation);
    target.fillStyle = "#fffdfa";
    target.strokeStyle = "#252724";
    target.lineWidth = 1.4;
    target.beginPath(); target.ellipse(0, 0, 5.5, 6.5, 0, 0, TAU); target.fill(); target.stroke();
    target.lineWidth = 1.1;
    for (let finger = -1; finger <= 1; finger += 1) {
      target.beginPath(); target.moveTo(finger * 2.1, -3); target.lineTo(finger * 2.8, -7.5 + Math.abs(finger)); target.stroke();
    }
    target.restore();
  }

  function drawTailoredHeadwear(target, outfit, player) {
    const bounce = player.state === "run" ? Math.abs(Math.sin(player.runCycle)) * 1.5 : 0;
    target.save();
    target.translate(0, -bounce);
    target.strokeStyle = "#182b28";
    target.lineWidth = 1.8;
    if (outfit.id === "hat") drawHikingCap(target, outfit);
    else if (outfit.id === "redBeanie") drawRibbedBeanie(target, outfit);
    else if (outfit.id === "minerCap") drawMinerCap(target, outfit);
    else drawWinterHat(target, outfit);
    target.restore();
  }

  function drawHikingCap(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-21, -106); target.quadraticCurveTo(-17, -119, 1, -121); target.quadraticCurveTo(18, -119, 22, -106); target.closePath(); target.fill(); target.stroke();
    target.fillStyle = "#e3b74c";
    target.beginPath(); target.roundRect(-18, -111, 38, 4, 2); target.fill();
    target.fillStyle = outfit.color;
    target.beginPath(); target.ellipse(20, -104, 18, 4.5, .1, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = "#f2d475";
    target.beginPath(); target.arc(0, -115, 3.4, 0, TAU); target.fill();
    target.fillStyle = "#315744";
    target.font = "900 5px system-ui"; target.textAlign = "center"; target.fillText("E", 0, -113.3);
  }

  function drawRibbedBeanie(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-20, -106); target.quadraticCurveTo(-17, -124, 0, -127); target.quadraticCurveTo(17, -124, 21, -106); target.closePath(); target.fill(); target.stroke();
    target.strokeStyle = "rgba(255,231,221,.34)";
    target.lineWidth = 1;
    for (let x = -13; x <= 13; x += 6.5) { target.beginPath(); target.moveTo(x, -108); target.lineTo(x * .72, -122); target.stroke(); }
    target.fillStyle = "#dca84a";
    target.strokeStyle = "#7d2937";
    target.beginPath(); target.arc(0, -128, 6, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = darkenColor(outfit.color, .15);
    target.beginPath(); target.roundRect(-21, -111, 43, 6, 3); target.fill(); target.stroke();
  }

  function drawMinerCap(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-21, -106); target.quadraticCurveTo(-15, -120, 1, -121); target.quadraticCurveTo(18, -119, 22, -106); target.closePath(); target.fill(); target.stroke();
    target.fillStyle = "#1c303c";
    target.beginPath(); target.ellipse(19, -104, 16, 4, .08, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = "#e0c375";
    target.beginPath(); target.roundRect(-18, -110, 38, 3.5, 1.7); target.fill();
    target.shadowColor = "#ffe77c"; target.shadowBlur = 12;
    target.fillStyle = "#ffe16c";
    target.strokeStyle = "#483e2a";
    target.beginPath(); target.arc(1, -114, 5, 0, TAU); target.fill(); target.stroke();
    target.shadowBlur = 0;
    target.fillStyle = "#fff7c1";
    target.beginPath(); target.arc(0, -115, 2, 0, TAU); target.fill();
  }

  function drawWinterHat(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-20, -106); target.quadraticCurveTo(-17, -125, 0, -127); target.quadraticCurveTo(18, -124, 21, -106); target.closePath(); target.fill(); target.stroke();
    target.fillStyle = "#f3f0e9";
    target.beginPath(); target.roundRect(-21, -111, 43, 6, 3); target.fill(); target.stroke();
    target.beginPath(); target.arc(0, -128, 5.5, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = outfit.color;
    target.beginPath(); target.roundRect(-25, -110, 8, 19, 4); target.roundRect(17, -110, 8, 19, 4); target.fill(); target.stroke();
    target.strokeStyle = "#f3f0e9";
    target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-21, -93); target.lineTo(-22, -86); target.moveTo(21, -93); target.lineTo(22, -86); target.stroke();
    target.fillStyle = "#f3f0e9";
    target.font = "900 10px system-ui"; target.textAlign = "center"; target.fillText("✦", 0, -114);
  }

  function outfitFeet(player, stride, speedRatio) {
    const running = player.state === "run" && speedRatio > .12;
    const swing = running ? stride * (7 + speedRatio * 4) : 0;
    return running ? [[-9 - swing, 2], [4 + swing, 2]] : [[-9, 1], [5, 1]];
  }

  function drawTailoredShoes(target, outfit, player, stride, speedRatio) {
    target.save();
    for (const [x, y] of outfitFeet(player, stride, speedRatio)) {
      target.fillStyle = outfit.color;
      target.strokeStyle = "#222522";
      target.lineWidth = 1.45;
      if (outfit.id === "hikingBoots") {
        target.beginPath(); target.roundRect(x - 4, y - 7, 12, 9, 3); target.fill(); target.stroke();
        target.beginPath(); target.ellipse(x + 4, y + 2, 9, 4.6, -.04, 0, TAU); target.fill(); target.stroke();
        target.strokeStyle = "#d8b784"; target.lineWidth = 1;
        for (let lace = 0; lace < 3; lace += 1) { target.beginPath(); target.moveTo(x - 1, y - 5 + lace * 2); target.lineTo(x + 6, y - 3.5 + lace * 2); target.stroke(); }
        target.strokeStyle = "#31231b"; target.lineWidth = 2; target.beginPath(); target.moveTo(x - 4, y + 4); target.lineTo(x + 12, y + 4); target.stroke();
      } else if (outfit.id === "redSneakers") {
        target.beginPath(); target.ellipse(x + 4, y + 1, 8.5, 4.2, -.02, 0, TAU); target.fill(); target.stroke();
        target.strokeStyle = "#fff7eb"; target.lineWidth = 2.2; target.beginPath(); target.moveTo(x - 4, y + 3); target.lineTo(x + 12, y + 3); target.stroke();
        target.lineWidth = 1.2; target.beginPath(); target.moveTo(x, y - 1); target.lineTo(x + 5, y + 1); target.lineTo(x + 8, y - 1); target.stroke();
      } else {
        target.beginPath(); target.roundRect(x - 4, y - 8, 13, 11, 4); target.fill(); target.stroke();
        target.beginPath(); target.ellipse(x + 4, y + 2, 9, 4.8, 0, 0, TAU); target.fill(); target.stroke();
        target.fillStyle = "#f4f1e8"; target.beginPath(); target.roundRect(x - 4, y - 8, 13, 4.5, 2); target.fill();
        target.strokeStyle = "#d9eef1"; target.lineWidth = 2; target.beginPath(); target.moveTo(x - 4, y + 4); target.lineTo(x + 13, y + 4); target.stroke();
      }
    }
    target.restore();
  }

  function accessoryHandPose(player, stride, speedRatio) {
    if (player.state === "run" && speedRatio > .12) return runningArmPose(stride, speedRatio, false);
    return { handX: -25, handY: -37, gloveRotation: -.06 };
  }

  function drawTailoredCane(target, player, stride, speedRatio) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const runSwing = player.state === "run" ? Math.sin(player.runCycle) * 3.5 : 0;
    const endX = hand.handX - 3 + runSwing;
    target.save();
    target.strokeStyle = "#4c2d1c";
    target.lineWidth = 5.2;
    target.lineCap = "round";
    target.beginPath();
    target.moveTo(hand.handX + 4, hand.handY - 2);
    target.quadraticCurveTo(hand.handX - 5, hand.handY - 9, hand.handX - 10, hand.handY - 1);
    target.lineTo(endX, 2);
    target.stroke();
    target.strokeStyle = "#a8733f";
    target.lineWidth = 1.5;
    target.beginPath(); target.moveTo(hand.handX - 6, hand.handY); target.lineTo(endX - 1, -1); target.stroke();
    target.fillStyle = "#d8a83f"; target.beginPath(); target.arc(hand.handX - 8, hand.handY - 2, 2.7, 0, TAU); target.fill();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
    target.restore();
  }

  function drawTailoredLantern(target, player, stride, speedRatio, color) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const swing = player.state === "run" ? Math.sin(player.runCycle) * .2 : 0;
    target.save();
    target.translate(hand.handX, hand.handY + 3);
    target.rotate(swing);
    target.strokeStyle = "#3d332a";
    target.lineWidth = 2;
    target.beginPath(); target.arc(0, 5, 8, Math.PI, 0); target.stroke();
    target.shadowColor = "#ffc95a"; target.shadowBlur = 16;
    target.fillStyle = color;
    target.beginPath(); target.roundRect(-7, 6, 14, 18, 4); target.fill(); target.stroke();
    target.fillStyle = "#fff0a1"; target.beginPath(); target.arc(0, 15, 3.8, 0, TAU); target.fill();
    target.shadowBlur = 0;
    target.strokeStyle = "#3d332a"; target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-5, 9); target.lineTo(5, 21); target.moveTo(5, 9); target.lineTo(-5, 21); target.stroke();
    target.restore();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
  }

  function buildOutfitVariant(loadout) {
    const key = outfitVariantKey(loadout);
    if (outfitVariantCache.has(key)) return outfitVariantCache.get(key);
    const variant = document.createElement("canvas");
    variant.width = 260;
    variant.height = 340;
    const render = variant.getContext("2d");
    render.imageSmoothingEnabled = true;
    render.translate(130, 304);
    render.scale(2.3, 2.3);
    const previewPlayer = { state: "idle", onGround: true, runCycle: 0 };
    drawTailoredOutfitBack(render, loadout, previewPlayer, 0, 0);
    if (characterImage.complete && characterImage.naturalWidth) render.drawImage(characterImage, -29, -108, 58, 116);
    drawTailoredOutfitFront(render, loadout, previewPlayer, 0, 0);
    outfitVariantCache.set(key, variant);
    return variant;
  }

  function renderOutfitVariantInto(target, loadout) {
    if (!target) return;
    const source = buildOutfitVariant(loadout);
    const render = target.getContext("2d");
    render.clearRect(0, 0, target.width, target.height);
    const scale = Math.min(target.width / source.width, target.height / source.height);
    const width = source.width * scale;
    const height = source.height * scale;
    render.drawImage(source, (target.width - width) / 2, (target.height - height) / 2, width, height);
  }

  function drawCharacterSprite(player, stride, speedRatio) {
    const isRunning = player.state === "run" && speedRatio > .12;
    if (isRunning) {
      drawRunningLegs(stride, speedRatio);
      drawRunningArm(stride, speedRatio, true);
    }

    if (characterImage.complete && characterImage.naturalWidth) {
      if (isRunning) {
        // Beim Rennen bleiben nur Kopf und Körper des Originals sichtbar.
        // Arme, Hände, Beine und Rucksack werden separat animiert.
        ctx.save();
        ctx.beginPath();
        ctx.rect(-27, -110, 41, 98);
        ctx.clip();
        ctx.drawImage(characterImage, -29, -108, 58, 116);
        ctx.restore();
        drawRunningArm(stride, speedRatio, false);
      } else {
        ctx.drawImage(characterImage, -29, -108, 58, 116);
      }
    } else {
      ctx.fillStyle = "#f4bd43";
      ctx.beginPath();
      ctx.roundRect(-22, -95, 44, 92, 10); ctx.fill();
    }
  }

  function drawRunningBackpack(player, stride, speedRatio) {
    const bounce = Math.abs(stride) * 2.5;
    const trail = 2 + speedRatio * 4;
    ctx.save();
    ctx.translate(-17 - trail, -61 + bounce);
    ctx.rotate(-.1 - stride * .025);
    ctx.strokeStyle = "#722c37";
    ctx.fillStyle = "#bd3b4a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-12, -19, 20, 38, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#962f3a";
    ctx.beginPath(); ctx.roundRect(-14, 2, 24, 15, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#00a9ce";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(8, -5, 14, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = "#e0ad45";
    ctx.beginPath(); ctx.arc(-8, 7, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRunningArm(stride, speedRatio, behind) {
    const pose = runningArmPose(stride, speedRatio, behind);
    ctx.save();
    ctx.strokeStyle = behind ? "#242724" : "#121513";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pose.shoulderX, pose.shoulderY);
    ctx.quadraticCurveTo(pose.controlX, pose.controlY, pose.handX, pose.handY);
    ctx.stroke();
    drawRunningGlove(pose.handX, pose.handY, pose.gloveRotation);
    ctx.restore();
  }

  function runningArmPose(stride, speedRatio, behind) {
    const swing = stride * (11 + speedRatio * 5);
    const shoulderX = behind ? -11 : 8;
    const direction = behind ? 1 : -1;
    return {
      shoulderX,
      shoulderY: -72,
      controlX: shoulderX + (behind ? -8 : 9),
      controlY: -60 + direction * swing * .45,
      handX: shoulderX + (behind ? -12 : 14) + direction * swing * .4,
      handY: -43 + direction * swing,
      gloveRotation: direction * .12,
    };
  }

  function drawRunningGlove(x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = "#fffdfa";
    ctx.strokeStyle = "#252724";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 6.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.25;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * 2.2, -3); ctx.lineTo(i * 3, -8 + Math.abs(i)); ctx.stroke();
    }
    ctx.restore();
  }

  function drawRunningLegs(stride, speedRatio) {
    const swing = stride * (7 + speedRatio * 4);
    const leg = (hipX, kneeX, footX, shade) => {
      ctx.strokeStyle = "#1d1d1b";
      ctx.lineWidth = 3.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(hipX, -25);
      ctx.lineTo(kneeX, -11);
      ctx.lineTo(footX, 1);
      ctx.stroke();
      ctx.fillStyle = shade;
      ctx.strokeStyle = "#1d1d1b";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(footX + 3, 2, 7.2, 3.6, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    };

    leg(-10, -12 - swing * .35, -9 - swing, "#f7f7f4");
    leg(4, 6 + swing * .35, 4 + swing, "#e4e4df");
  }

  function drawPlayerCape(player, speedRatio, color = "#9f4054") {
    const airborne = player.onGround ? 0 : 5;
    const flutter = Math.sin(game.time * 8 + player.runCycle * .4) * (2 + speedRatio * 3);
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#6e263b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-16, -79);
    ctx.quadraticCurveTo(-31 - flutter, -65, -32 - speedRatio * 11, -45 + airborne);
    ctx.quadraticCurveTo(-31 - flutter, -23, -19, -12 + airborne);
    ctx.quadraticCurveTo(-8, -30, -11, -67);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.beginPath();
    ctx.moveTo(-17, -73); ctx.quadraticCurveTo(-25 - flutter, -54, -23, -29); ctx.lineTo(-18, -35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e4ad45";
    ctx.beginPath(); ctx.arc(-14, -77, 3.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawPlayerScarf(player, speedRatio, color) {
    const flutter = Math.sin(game.time * 7 + player.runCycle) * 3;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#7f3340";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-17, -82, 31, 8, 4); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -79); ctx.quadraticCurveTo(-29 - speedRatio * 8, -72 + flutter, -33 - speedRatio * 10, -59 + flutter);
    ctx.lineTo(-26, -58 + flutter); ctx.quadraticCurveTo(-23, -69, -9, -75); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawPlayerJacket(outfit, player, stride, speedRatio) {
    const isRunning = player.state === "run" && speedRatio > .12;
    const outline = outfit.id === "winterJacket" ? "#6f2935" : outfit.id === "minerJacket" ? "#172b38" : "#244b3d";
    const trim = outfit.id === "winterJacket" ? "#f3e9dc" : outfit.id === "minerJacket" ? "#f2eee3" : "#d6b15a";
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const sleevePoses = isRunning
      ? [runningArmPose(stride, speedRatio, true), runningArmPose(stride, speedRatio, false)]
      : [
          { shoulderX: -15, shoulderY: -67, controlX: -22, controlY: -57, handX: -25, handY: -37, gloveRotation: 0 },
          { shoulderX: 14, shoulderY: -68, controlX: 19, controlY: -82, handX: 27, handY: -96, gloveRotation: 0 },
        ];

    for (const pose of sleevePoses) drawJacketSleeve(pose, outfit.color, outline, trim);

    const bodyGradient = ctx.createLinearGradient(-21, -70, 22, -24);
    bodyGradient.addColorStop(0, lightenColor(outfit.color, .2));
    bodyGradient.addColorStop(.36, outfit.color);
    bodyGradient.addColorStop(1, darkenColor(outfit.color, .16));
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-15, -71);
    ctx.quadraticCurveTo(-21, -70, -22, -62);
    ctx.lineTo(-20, -29);
    ctx.quadraticCurveTo(-19, -23, -13, -22);
    ctx.quadraticCurveTo(0, -20, 13, -22);
    ctx.quadraticCurveTo(20, -23, 21, -29);
    ctx.lineTo(22, -62);
    ctx.quadraticCurveTo(21, -70, 15, -71);
    ctx.quadraticCurveTo(0, -75, -15, -71);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.beginPath();
    ctx.moveTo(-15, -65); ctx.quadraticCurveTo(-12, -48, -14, -28); ctx.lineTo(-8, -27); ctx.lineTo(-7, -66); ctx.closePath(); ctx.fill();

    ctx.strokeStyle = trim;
    ctx.lineWidth = outfit.id === "winterJacket" ? 2.1 : 1.5;
    ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(0, -23); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-17, -25); ctx.quadraticCurveTo(0, -22, 17, -25); ctx.stroke();

    if (outfit.id === "minerJacket") {
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.moveTo(-16, -69); ctx.lineTo(-2, -55); ctx.lineTo(0, -62); ctx.lineTo(2, -55); ctx.lineTo(17, -69);
      ctx.lineTo(17, -62); ctx.lineTo(5, -51); ctx.lineTo(-5, -51); ctx.lineTo(-17, -62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d9ac45";
      for (let y = -49; y <= -31; y += 9) {
        ctx.beginPath(); ctx.arc(5, y, 1.7, 0, TAU); ctx.fill();
      }
      drawJacketPocket(-13, -40, outline, trim);
      drawJacketPocket(5, -40, outline, trim);
    } else if (outfit.id === "winterJacket") {
      ctx.fillStyle = trim;
      ctx.beginPath(); ctx.roundRect(-16, -72, 32, 9, 4); ctx.fill();
      ctx.strokeStyle = "rgba(255,238,221,.42)";
      ctx.lineWidth = 1.2;
      for (const y of [-53, -41, -30]) {
        ctx.beginPath(); ctx.moveTo(-19, y); ctx.quadraticCurveTo(0, y + 2, 19, y); ctx.stroke();
      }
      drawJacketPocket(-15, -37, outline, trim);
      drawJacketPocket(7, -37, outline, trim);
    } else {
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.moveTo(-15, -69); ctx.lineTo(-2, -56); ctx.lineTo(0, -64); ctx.lineTo(3, -56); ctx.lineTo(16, -69);
      ctx.lineTo(15, -62); ctx.lineTo(6, -53); ctx.lineTo(-6, -53); ctx.lineTo(-15, -62); ctx.closePath(); ctx.fill();
      drawJacketPocket(-15, -39, outline, trim);
      drawJacketPocket(7, -39, outline, trim);
      ctx.fillStyle = "#e8b94c";
      for (let y = -48; y <= -31; y += 9) {
        ctx.beginPath(); ctx.arc(5, y, 1.6, 0, TAU); ctx.fill();
      }
    }

    if (isRunning) {
      for (const pose of sleevePoses) drawRunningGlove(pose.handX, pose.handY, pose.gloveRotation);
    }
    ctx.restore();
  }

  function drawJacketSleeve(pose, color, outline, trim) {
    const dx = pose.handX - pose.shoulderX;
    const dy = pose.handY - pose.shoulderY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const cuffX = pose.handX - dx / length * 7;
    const cuffY = pose.handY - dy / length * 7;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(pose.shoulderX, pose.shoulderY); ctx.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(pose.shoulderX, pose.shoulderY); ctx.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); ctx.stroke();
    ctx.fillStyle = trim;
    ctx.beginPath(); ctx.arc(cuffX, cuffY, 4, 0, TAU); ctx.fill();
  }

  function drawJacketPocket(x, y, outline, trim) {
    ctx.fillStyle = "rgba(18,35,31,.13)";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, 8, 10, 2.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = trim;
    ctx.beginPath(); ctx.moveTo(x + 1, y + 2); ctx.lineTo(x + 7, y + 2); ctx.stroke();
  }

  function lightenColor(hex, amount) {
    return shadeHex(hex, Math.abs(amount));
  }

  function darkenColor(hex, amount) {
    return shadeHex(hex, -Math.abs(amount));
  }

  function shadeHex(hex, amount) {
    const value = Number.parseInt(hex.slice(1), 16);
    const mix = amount >= 0 ? 255 : 0;
    const weight = Math.abs(amount);
    const channel = (shift) => Math.round(((value >> shift) & 255) * (1 - weight) + mix * weight);
    return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
  }

  function drawPlayerHeadwear(outfit, player) {
    const bounce = player.state === "run" ? Math.abs(Math.sin(player.runCycle)) * 1.5 : 0;
    ctx.save();
    ctx.translate(0, -bouncingHatOffset(bounce));
    ctx.strokeStyle = "#173b33";
    ctx.lineWidth = 2;
    ctx.fillStyle = outfit.color;
    if (outfit.style === "beanie" || outfit.style === "winter") {
      ctx.beginPath(); ctx.moveTo(-20, -106); ctx.quadraticCurveTo(-17, -124, 0, -126); ctx.quadraticCurveTo(18, -124, 21, -106); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = outfit.style === "winter" ? "#f0eee6" : "#e7b64e";
      ctx.beginPath(); ctx.arc(0, -127, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillRect(-20, -110, 41, 5);
      if (outfit.style === "winter") {
        ctx.fillStyle = outfit.color; ctx.beginPath(); ctx.roundRect(-24, -110, 7, 17, 3); ctx.roundRect(17, -110, 7, 17, 3); ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(-21, -106); ctx.quadraticCurveTo(-16, -120, 3, -120); ctx.quadraticCurveTo(20, -119, 22, -106); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e2ad3f"; ctx.fillRect(-19, -109, 39, 4);
      ctx.fillStyle = outfit.color;
      ctx.beginPath(); ctx.ellipse(18, -105, 17, 4.5, .12, 0, TAU); ctx.fill(); ctx.stroke();
      if (outfit.style === "miner") {
        ctx.shadowColor = "#ffe77c"; ctx.shadowBlur = 12; ctx.fillStyle = "#ffe16c";
        ctx.beginPath(); ctx.arc(1, -113, 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  function bouncingHatOffset(bounce) {
    return bounce;
  }

  function drawPlayerCane(player) {
    const handSwing = player.state === "run" ? Math.sin(player.runCycle) * 5 : 0;
    ctx.save();
    ctx.translate(0, handSwing * .22);
    ctx.strokeStyle = "#5d371f";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(24, -54);
    ctx.quadraticCurveTo(34, -58, 34, -49);
    ctx.lineTo(29 + handSwing * .18, 1);
    ctx.stroke();
    ctx.strokeStyle = "#a7723e";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(31, -42); ctx.lineTo(27 + handSwing * .18, -3); ctx.stroke();
    ctx.fillStyle = "#d8a83f";
    ctx.beginPath(); ctx.arc(24, -54, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawPlayerShoes(outfit, player, stride, speedRatio) {
    const running = player.state === "run" && speedRatio > .12;
    const swing = running ? stride * (7 + speedRatio * 4) : 0;
    const feet = running ? [[-9 - swing, 2], [4 + swing, 2]] : [[-9, 1], [5, 1]];
    ctx.save();
    for (const [x, y] of feet) {
      ctx.fillStyle = outfit.color;
      ctx.strokeStyle = "#222522";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x + 3, y, outfit.style === "boots" || outfit.style === "snow" ? 8 : 7.5, outfit.style === "snow" ? 5 : 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#f1eee3";
      ctx.lineWidth = outfit.style === "sneakers" ? 2.4 : 1.4;
      ctx.beginPath(); ctx.moveTo(x - 3, y + 2); ctx.lineTo(x + 10, y + 2); ctx.stroke();
      if (outfit.style === "snow") {
        ctx.fillStyle = "#f3f0e6"; ctx.fillRect(x - 3, y - 5, 13, 3);
      }
    }
    ctx.restore();
  }

  function drawPlayerLantern(player, color) {
    const swing = player.state === "run" ? Math.sin(player.runCycle) * .18 : 0;
    ctx.save();
    ctx.translate(25, -47);
    ctx.rotate(swing);
    ctx.strokeStyle = "#4c3a2d";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -5, 8, Math.PI, 0); ctx.stroke();
    ctx.shadowColor = "#ffc95a";
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-7, -4, 14, 18, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff0a1"; ctx.beginPath(); ctx.arc(0, 5, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of game.particles) {
      ctx.save();
      const fade = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      ctx.globalAlpha = fade;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = particle.color;
      if (particle.shape === "dust") {
        ctx.globalAlpha = fade * .48;
        ctx.beginPath(); ctx.ellipse(0, 0, particle.size * 1.35, particle.size * .62, 0, 0, TAU); ctx.fill();
      } else if (particle.shape === "bubble") {
        ctx.globalAlpha = fade * .68;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, particle.size, 0, TAU); ctx.stroke();
        ctx.globalAlpha = fade * .8;
        ctx.fillStyle = "rgba(255,255,255,.75)";
        ctx.beginPath(); ctx.arc(-particle.size * .28, -particle.size * .3, Math.max(.7, particle.size * .18), 0, TAU); ctx.fill();
      } else if (particle.shape === "droplet") {
        ctx.beginPath();
        ctx.moveTo(0, -particle.size * 1.5);
        ctx.quadraticCurveTo(particle.size, 0, 0, particle.size * 1.15);
        ctx.quadraticCurveTo(-particle.size, 0, 0, -particle.size * 1.5);
        ctx.fill();
      } else if (particle.shape === "shard") {
        ctx.beginPath();
        ctx.moveTo(0, -particle.size * 1.4);
        ctx.lineTo(particle.size * .55, 0);
        ctx.lineTo(0, particle.size * 1.2);
        ctx.lineTo(-particle.size * .55, 0);
        ctx.closePath();
        ctx.fill();
      } else if (particle.shape === "spark") {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = Math.max(1.2, particle.size * .42);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-particle.size * 1.5, 0); ctx.lineTo(particle.size * 1.5, 0);
        ctx.moveTo(0, -particle.size); ctx.lineTo(0, particle.size);
        ctx.stroke();
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }
      ctx.restore();
    }
  }

  function drawSpruce(x, baseY, height, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#5a4938";
    ctx.fillRect(x - height * .035, baseY - height * .22, height * .07, height * .22);
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i += 1) {
      const top = baseY - height + i * height * .2;
      const half = height * (.22 + i * .075);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - half, top + height * .55); ctx.lineTo(x + half, top + height * .55); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawFachwerkHouse(x, y, scale, accent) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#efe2c4"; ctx.fillRect(-48, -75, 96, 75);
    ctx.fillStyle = "#544039";
    ctx.beginPath(); ctx.moveTo(-60, -72); ctx.lineTo(0, -116); ctx.lineTo(60, -72); ctx.closePath(); ctx.fill();
    ctx.fillRect(-45, -70, 7, 70); ctx.fillRect(38, -70, 7, 70); ctx.fillRect(-4, -77, 7, 77); ctx.fillRect(-45, -42, 90, 6);
    ctx.lineWidth = 5; ctx.strokeStyle = "#544039";
    ctx.beginPath(); ctx.moveTo(-43, -68); ctx.lineTo(-2, -42); ctx.lineTo(42, -69); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-26, -31, 20, 31); ctx.fillStyle = "#f4cd68"; ctx.fillRect(12, -29, 19, 18);
    ctx.restore();
  }

  function drawMineHeadframe(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#33433f"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-65, 0); ctx.lineTo(-28, -135); ctx.lineTo(28, -135); ctx.lineTo(65, 0); ctx.moveTo(-48, -65); ctx.lineTo(48, -65); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -143, 29, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i += 1) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(0, -143); ctx.lineTo(Math.cos(a) * 29, -143 + Math.sin(a) * 29); ctx.stroke(); }
    ctx.restore();
  }

  function drawMill(x, y, scale) {
    drawFachwerkHouse(x, y, scale, "#4b96a3");
    ctx.save(); ctx.translate(x + 65 * scale, y - 18 * scale); ctx.scale(scale, scale);
    ctx.rotate(game.time * .55);
    ctx.strokeStyle = "#77523a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = i * TAU / 8;
      ctx.strokeStyle = i % 2 ? "#8c623f" : "#a2774c";
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 38, Math.sin(a) * 38); ctx.stroke();
    }
    ctx.fillStyle = "#644630"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRiverValley(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = .9;
    drawWaterfall(x - 132 * scale, y + 8 * scale, scale);
    drawMill(x + 32 * scale, y, scale * .78);
    ctx.fillStyle = "rgba(49,139,159,.82)";
    ctx.beginPath();
    ctx.ellipse(x - 35 * scale, y + 12 * scale, 150 * scale, 24 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,250,240,.72)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const ripple = Math.sin(game.time * 2.2 + i * 1.7) * 8;
      ctx.beginPath(); ctx.ellipse(x - 72 * scale + i * 50 * scale + ripple, y + 8 * scale, 23 * scale, 4 * scale, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaterfall(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#63756c";
    ctx.beginPath(); ctx.moveTo(-82, 5); ctx.lineTo(-72, -150); ctx.lineTo(50, -150); ctx.lineTo(69, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#4c625e";
    for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.roundRect(-68 + i * 29, -132 + (i % 2) * 16, 22, 72, 8); ctx.fill(); }
    const sway = Math.sin(game.time * 2.5) * 5;
    ctx.fillStyle = "rgba(204,244,245,.76)";
    ctx.beginPath();
    ctx.moveTo(-33 + sway, -151); ctx.lineTo(25 - sway, -151); ctx.quadraticCurveTo(12 + sway, -74, 23 - sway, -5); ctx.lineTo(-31 + sway, -5); ctx.quadraticCurveTo(-18 - sway, -78, -33 + sway, -151); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.62)";
    for (let i = 0; i < 5; i += 1) { const foam = Math.sin(game.time * 3 + i) * 5; ctx.beginPath(); ctx.arc(-32 + i * 15 + foam, -2 - i % 2 * 5, 7, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawTrain(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#3d4946"; ctx.beginPath(); ctx.roundRect(-80, -48, 155, 48, 8); ctx.fill();
    ctx.fillStyle = "#913f43"; ctx.fillRect(-20, -82, 60, 36); ctx.fillStyle = "#2b3634"; ctx.fillRect(-61, -92, 21, 45);
    ctx.fillStyle = "#f2c457"; ctx.fillRect(0, -71, 22, 17);
    ctx.fillStyle = "#252f2d"; ctx.beginPath(); ctx.arc(-43, 1, 19, 0, TAU); ctx.arc(41, 1, 19, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(244,244,233,.5)"; ctx.beginPath(); ctx.arc(-52, -112, 16, 0, TAU); ctx.arc(-35, -132, 22, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSchwibbogen(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#f3c969"; ctx.lineWidth = 8; ctx.shadowColor = "#f3c969"; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, 0, 110, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(110, 0); ctx.stroke();
    for (let i = -4; i <= 4; i += 1) { const cx = i * 23; const cy = -Math.sqrt(Math.max(0, 108 ** 2 - cx ** 2)); ctx.fillStyle = "#f7dc8f"; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.restore();
  }

  function drawRockTowers(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = "#77766b";
    const towers = [[0, 0, 54, 150], [72, 0, 42, 118], [140, 0, 47, 172], [210, 0, 38, 130]];
    for (const [rx, ry, rw, rh] of towers) { ctx.beginPath(); ctx.roundRect(rx, ry - rh, rw, rh, 18); ctx.fill(); ctx.fillStyle = "#6b6c61"; ctx.fillRect(rx + 8, ry - rh + 34, rw - 10, 8); ctx.fillStyle = "#77766b"; }
    ctx.restore();
  }

  function drawCastle(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = "#7d796d";
    ctx.fillRect(-85, -95, 170, 95); ctx.fillRect(-105, -135, 50, 135); ctx.fillRect(55, -155, 50, 155);
    ctx.fillStyle = "#5c5552";
    ctx.beginPath(); ctx.moveTo(-115, -135); ctx.lineTo(-80, -180); ctx.lineTo(-45, -135); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(45, -155); ctx.lineTo(80, -205); ctx.lineTo(115, -155); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#eac36a"; ctx.fillRect(-10, -55, 20, 55); ctx.fillRect(-88, -112, 14, 20); ctx.fillRect(73, -125, 14, 20);
    ctx.restore();
  }

  function drawSummitTower(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#716f68"; ctx.fillRect(-48, -122, 96, 122); ctx.fillStyle = "#4c514d"; ctx.fillRect(-18, -205, 36, 83);
    ctx.strokeStyle = "#4c514d"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -205); ctx.lineTo(0, -252); ctx.stroke();
    ctx.fillStyle = "#b54d50"; ctx.beginPath(); ctx.moveTo(3, -247); ctx.lineTo(44, -232); ctx.lineTo(3, -217); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f0cf75"; ctx.fillRect(-30, -91, 19, 25); ctx.fillRect(11, -91, 19, 25);
    ctx.restore();
  }

  function drawSignpost(x, y, symbol) {
    ctx.fillStyle = "#6b4b35"; ctx.fillRect(x - 4, y - 72, 8, 72);
    ctx.fillStyle = "#b77a43"; ctx.beginPath(); ctx.roundRect(x - 32, y - 73, 72, 28, 5); ctx.fill();
    ctx.fillStyle = "#f5e5c2"; ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.fillText(symbol, x + 4, y - 52);
  }

  function drawMineSupport(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#594838"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-64, 0); ctx.lineTo(-49, -115); ctx.lineTo(49, -115); ctx.lineTo(64, 0); ctx.stroke();
    ctx.strokeStyle = "#856344"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-50, -112); ctx.lineTo(49, -112); ctx.stroke();
    ctx.fillStyle = "#ffd15f"; ctx.globalAlpha = .78;
    ctx.beginPath(); ctx.arc(0, -95, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRiverWater(x, y, width, seed) {
    ctx.save(); ctx.globalAlpha = .72;
    ctx.fillStyle = "#3e9eaa"; ctx.fillRect(x, y, width, 28);
    ctx.strokeStyle = "rgba(230,255,246,.65)"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const waveX = x + i * 66 + Math.sin(game.time * 2 + seed + i) * 10;
      ctx.beginPath(); ctx.moveTo(waveX, y + 9 + i % 2 * 7); ctx.quadraticCurveTo(waveX + 16, y + 3, waveX + 33, y + 9 + i % 2 * 7); ctx.stroke();
    }
    ctx.restore();
  }

  function drawRailTrack(x, y, width) {
    ctx.save(); ctx.strokeStyle = "#454946"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.moveTo(x, y + 13); ctx.lineTo(x + width, y + 13); ctx.stroke();
    ctx.strokeStyle = "#72513a"; ctx.lineWidth = 5;
    for (let px = x + 10; px < x + width; px += 28) { ctx.beginPath(); ctx.moveTo(px, y - 5); ctx.lineTo(px, y + 18); ctx.stroke(); }
    ctx.restore();
  }

  function drawChimney(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#734f4b"; ctx.fillRect(-12, -104, 24, 104); ctx.fillStyle = "#4c403d"; ctx.fillRect(-17, -109, 34, 9);
    for (let i = 0; i < 3; i += 1) { ctx.globalAlpha = .15 - i * .03; ctx.fillStyle = "#f1eee2"; ctx.beginPath(); ctx.arc(Math.sin(game.time + i) * 6, -126 - i * 17, 9 + i * 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawLantern(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#63462f"; ctx.fillRect(-3, -105, 6, 105); ctx.fillRect(-22, -103, 38, 6);
    ctx.shadowColor = "#f6cf72"; ctx.shadowBlur = 14; ctx.fillStyle = "#f6cf72"; ctx.beginPath(); ctx.roundRect(-12, -94, 22, 31, 5); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#885c37"; ctx.fillRect(-15, -100, 28, 7); ctx.restore();
  }

  function drawClimbingFlag(x, y) {
    ctx.save(); ctx.fillStyle = "#654736"; ctx.fillRect(x, y - 62, 4, 62); ctx.fillStyle = "#d65156";
    ctx.beginPath(); ctx.moveTo(x + 3, y - 61); ctx.lineTo(x + 34, y - 50); ctx.lineTo(x + 3, y - 39); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawWindRibbon(x, y, seed) {
    ctx.save(); ctx.globalAlpha = .35; ctx.strokeStyle = "#f5f1dc"; ctx.lineWidth = 3; ctx.lineCap = "round";
    const drift = Math.sin(game.time * 1.6 + seed) * 16;
    ctx.beginPath(); ctx.moveTo(x - 65 + drift, y); ctx.bezierCurveTo(x - 28 + drift, y - 13, x + 8 + drift, y + 13, x + 55 + drift, y - 5); ctx.stroke(); ctx.restore();
  }

  function groundAt(level, x) {
    return level.platforms.find((platform) => platform.ground && x >= platform.x && x <= platform.x + platform.w);
  }

  function applyRegionalMechanics(level, player, dt) {
    for (const current of level.currents || []) {
      const centerX = player.x + player.w / 2;
      const centerY = player.y + player.h / 2;
      const insideX = centerX > current.x && centerX < current.x + current.w;
      const insideY = current.y == null ? player.y > 430 : centerY > current.y && centerY < current.y + current.h;
      if (insideX && insideY) {
        player.vx += current.push * dt;
        if (current.lift) player.vy += current.lift * dt;
      }
    }
    for (const wind of level.windZones || []) {
      const inside = player.x + player.w / 2 > wind.x && player.x + player.w / 2 < wind.x + wind.w && player.y < 535;
      if (inside) player.vx += wind.push * dt;
    }
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hash(value) {
    const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function wrap(value, min, max) {
    const range = max - min;
    return ((value - min) % range + range) % range + min;
  }

  function isJumpHeld() {
    return held.jump || pressed.has("ArrowUp") || pressed.has("KeyW") || pressed.has("Space");
  }

  function queueJump() {
    if (game.player) game.player.jumpBuffer = 0.14;
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), 2400);
  }

  function updateHud() {
    ui.sparkCount.textContent = game.wallet;
    ui.itemCount.textContent = game.foundItems.size;
    ui.shopWallet.textContent = game.wallet;
    ui.skillsWallet.textContent = game.wallet;
    game.hearts = Math.max(0, Math.min(MAX_LIVES, game.hearts));
    ui.heartCount.textContent = game.hearts;
    ui.heartCount.parentElement?.setAttribute("aria-label", `${game.hearts} von maximal ${MAX_LIVES} Leben`);
    ui.levelName.textContent = game.level?.name || LEVELS[game.levelIndex].name;
    ui.sound.textContent = game.sound ? "♪" : "×";
    ui.sound.setAttribute("aria-label", game.sound ? "Ton ausschalten" : "Ton einschalten");
  }

  function renderOutfitShop() {
    ui.outfitGrid.replaceChildren();
    for (const [category, label] of Object.entries(OUTFIT_CATEGORIES)) {
      const section = document.createElement("section");
      section.className = "outfit-category";
      section.innerHTML = `<div class="outfit-category-heading"><h3>${label}</h3><small>Maximal 1 gleichzeitig</small></div><div class="outfit-category-grid"></div>`;
      const grid = section.querySelector(".outfit-category-grid");
      for (const outfit of OUTFITS.filter((item) => item.category === category)) {
        const owned = game.ownedOutfits.has(outfit.id);
        const equipped = game.equippedOutfits.has(outfit.id);
        const card = document.createElement("article");
        card.className = `outfit-card${equipped ? " is-equipped" : ""}`;
        card.style.setProperty("--outfit-bg", outfit.color);
        card.innerHTML = `
          <div class="outfit-card-visual" aria-hidden="true">
            <canvas class="outfit-card-avatar" width="180" height="220"></canvas>
          </div>
          <b>${outfit.name}</b>
          <p>${outfit.description}</p>
          <button type="button"${owned ? " class=\"is-owned\"" : ""}>
            ${owned ? (equipped ? "Ablegen" : "Anziehen") : `Kaufen · ${outfit.price} ◆`}
          </button>`;
        renderOutfitVariantInto(card.querySelector(".outfit-card-avatar"), singleOutfitLoadout(outfit));
        card.querySelector("button").addEventListener("click", () => chooseOutfit(outfit));
        grid.append(card);
      }
      ui.outfitGrid.append(section);
    }
    renderOutfitVariantInto(ui.outfitPreviewCanvas, currentOutfitLoadout());
    ui.previewLoadout.textContent = [...game.equippedOutfits]
      .map((id) => OUTFITS.find((outfit) => outfit.id === id)?.name)
      .filter(Boolean)
      .join(" · ") || "Noch keine Ausrüstung";
    updateHud();
  }

  function chooseOutfit(outfit) {
    if (!game.ownedOutfits.has(outfit.id)) {
      if (game.wallet < outfit.price) {
        showToast(`Noch ${outfit.price - game.wallet} Bergfunken bis zum ${outfit.name}.`);
        return;
      }
      game.wallet -= outfit.price;
      game.ownedOutfits.add(outfit.id);
      unequipCategory(outfit.category);
      game.equippedOutfits.add(outfit.id);
      showToast(`${outfit.name} gekauft und angezogen!`);
      playTone(520, .11, "sine", .04, 180);
    } else if (game.equippedOutfits.has(outfit.id)) {
      game.equippedOutfits.delete(outfit.id);
      showToast(`${outfit.name} abgelegt.`);
    } else {
      unequipCategory(outfit.category);
      game.equippedOutfits.add(outfit.id);
      showToast(`${outfit.name} angezogen.`);
      playTone(440, .08, "sine", .03, 90);
    }
    saveProgress();
    renderOutfitShop();
  }

  function unequipCategory(category) {
    for (const outfit of OUTFITS) {
      if (outfit.category === category) game.equippedOutfits.delete(outfit.id);
    }
  }

  function renderSkillTree() {
    ui.skillTree.replaceChildren();
    for (const talent of TALENTS) {
      const learned = game.ownedTalents.has(talent.id);
      const active = game.talents.has(talent.id);
      const card = document.createElement("article");
      card.className = active ? "is-owned" : learned ? "is-learned" : "";
      card.innerHTML = `
        <span aria-hidden="true">${talent.mark}</span>
        <b>${talent.name}</b>
        <small>${talent.description}</small>
        <button type="button"${active ? " class=\"is-owned\"" : ""}>${active ? "Aktiv · ablegen" : learned ? "Aktivieren" : `Lernen · ${talent.price} ◆`}</button>`;
      card.querySelector("button").addEventListener("click", () => chooseTalent(talent));
      ui.skillTree.append(card);
    }
    ui.skillSlots.textContent = `Aktiv: ${game.talents.size} / ${MAX_ACTIVE_TALENTS}`;
    updateHud();
  }

  function chooseTalent(talent) {
    const learned = game.ownedTalents.has(talent.id);
    const active = game.talents.has(talent.id);
    if (active) {
      game.talents.delete(talent.id);
      saveProgress();
      showToast(`${talent.name} ist im Rucksack und kann später wieder aktiviert werden.`);
      renderSkillTree();
      return;
    }
    if (!learned) {
      if (game.wallet < talent.price) {
        showToast(`Noch ${talent.price - game.wallet} Bergfunken bis zu ${talent.name}.`);
        return;
      }
      game.wallet -= talent.price;
      game.ownedTalents.add(talent.id);
    }
    if (game.talents.size >= MAX_ACTIVE_TALENTS) {
      saveProgress();
      showToast(`Vier Talente sind aktiv. Lege erst eines ab, um ${talent.name} zu aktivieren.`);
      renderSkillTree();
      return;
    }
    game.talents.add(talent.id);
    saveProgress();
    playTone(580, .1, "sine", .035, 220);
    showToast(learned ? `${talent.name} ist wieder aktiv.` : `${talent.name} gelernt und aktiviert!`);
    renderSkillTree();
  }

  function inventoryEntry(entry) {
    const [levelPart, itemId = ""] = entry.split(":");
    const levelIndex = Number(levelPart);
    const level = LEVELS[levelIndex] || LEVELS[0];
    const regional = REGIONAL_ITEMS[level.mood] || REGIONAL_ITEMS.forest;
    if (itemId.startsWith("high-route-")) {
      const index = Number(itemId.slice(-1));
      const names = [`Höhenfund: ${regional.name}`, "Bergkamm-Abzeichen", "Aussichtsstern"];
      return { name: names[index] || "Höhenfund", type: index === 1 ? "badge" : "star", color: index === 1 ? "#d7a84a" : "#f3c95d", where: `${level.short} · Höhenroute` };
    }
    if (itemId === "main-a" || itemId === "main-b" || itemId === "bonus-a") return { ...regional, where: level.short };
    if (itemId === "bonus-b") return { name: "Glückstaler", type: "coin", color: "#e0b54d", where: `${level.short} · Geheimweg` };
    if (itemId === "bonus-c") return { name: "Altes Grubenlicht", type: "lantern", color: "#f2a83d", where: `${level.short} · Geheimweg` };
    if (itemId === "rail-master-ticket") return { name: "Goldene Weichenkarte", type: "ticket", color: "#efc45c", where: `${level.short} · Signalweg` };
    if (itemId === "rail-depot-ticket") return { name: "Bimmelbahn-Fahrkarte", type: "ticket", color: "#b9514d", where: `${level.short} · Zieldepot` };
    if (itemId === "tauch-a") return { ...REGIONAL_ITEMS.underwater, where: level.short };
    if (itemId === "tauch-b") return { name: "Alte Lorenplakette", type: "badge", color: "#d0a55d", where: level.short };
    if (itemId === "tauch-c") return { name: "Türkiser Stollenkristall", type: "star", color: "#58e6df", where: level.short };
    return { ...regional, where: level.short };
  }

  function inventoryMark(type) {
    return ({ star: "✦", badge: "◈", lantern: "☼", coin: "●", key: "⚿", ticket: "▭", heart: "♥", flag: "⚑", candle: "♟", figure: "♙" })[type] || "✦";
  }

  function renderInventory() {
    ui.inventoryGrid.replaceChildren();
    const entries = [...game.foundItems].sort((a, b) => a.localeCompare(b, "de"));
    ui.inventoryCount.textContent = entries.length;
    if (!entries.length) {
      ui.inventoryGrid.innerHTML = `<p class="inventory-empty">Noch ist der Rucksack leer. Folge hohen Pfaden und geheimen Stolleneingängen für besondere Fundstücke.</p>`;
      return;
    }
    for (const entry of entries) {
      const item = inventoryEntry(entry);
      const card = document.createElement("article");
      card.className = "inventory-card";
      card.style.setProperty("--item-color", item.color);
      card.innerHTML = `<span class="inventory-icon" aria-hidden="true">${inventoryMark(item.type)}</span><b>${item.name}</b><small>${item.where}</small>`;
      ui.inventoryGrid.append(card);
    }
  }

  function renderLevelGrid() {
    ui.levelGrid.replaceChildren();
    LEVELS.forEach((level, index) => {
      const button = document.createElement("button");
      const locked = index >= game.unlocked;
      button.type = "button";
      button.className = `level-card${level.bonus ? " is-bonus" : ""}${game.completed.has(index) ? " is-complete" : ""}${index === game.levelIndex ? " is-current" : ""}${locked ? " is-locked" : ""}`;
      button.style.setProperty("--level-color", level.accent);
      button.disabled = locked;
      button.innerHTML = `<span class="level-number">${level.bonus ? "★" : index + 1}</span><b>${level.short}</b><small>${level.subtitle}</small>`;
      button.addEventListener("click", () => startLevel(index));
      ui.levelGrid.append(button);
    });
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
  }

  function ensureAudio() {
    if (!game.sound) return null;
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playRegionalIntro(level) {
    const theme = musicThemeFor(level);
    const introNotes = theme.melody.filter((note) => note !== null).slice(0, 4);
    game.musicStep = 0;
    game.musicBeatAt = game.time + (theme.secret ? .72 : .9);
    playFolkChord(theme.root - 12, theme.mode, theme.secret ? "bell" : "accordion", .006, 0);
    introNotes.forEach((offset, index) => {
      playFolkVoice(theme.root + offset, .2 + index * .025, theme.lead, .016, .08 + index * .12);
    });
    if (theme.secret) playFolkPercussion("chime", .008, .53);
  }

  function updateRegionalMusic(level) {
    if (!game.sound || game.time < game.musicBeatAt) return;
    const theme = musicThemeFor(level);
    const stepLength = 30 / theme.tempo;
    playMusicStep(theme, game.musicStep, stepLength);
    game.musicStep += 1;
    game.musicBeatAt = game.time + stepLength;
  }

  function musicThemeFor(level) {
    const index = Math.max(0, Math.min(LEVELS.length - 1, level.index || 0));
    return level.isBonusRoom ? (SECRET_MUSIC[index] || SECRET_MUSIC[0]) : (LEVEL_MUSIC[index] || LEVEL_MUSIC[0]);
  }

  function playMusicStep(theme, step, stepLength) {
    const position = step % theme.melody.length;
    const beat = step % theme.meter;
    const bar = Math.floor(step / theme.meter);
    const chordOffset = theme.progression[bar % theme.progression.length];
    const chordRoot = theme.root - 12 + chordOffset;
    const melodyOffset = theme.melody[position];

    if (melodyOffset !== null) {
      playFolkVoice(theme.root + melodyOffset, stepLength * (theme.secret ? .82 : 1.05), theme.lead, theme.secret ? .009 : .0115);
    }

    if (theme.rhythm === "waltz" || theme.rhythm === "minuet") {
      if (beat === 0) {
        playFolkVoice(chordRoot - 12, stepLength * 1.65, "bass", .009);
        playFolkPercussion("stomp", .006);
      }
      if (beat === 2 || beat === 4) playFolkChord(chordRoot, theme.mode, "accordion", .0036);
      if (theme.rhythm === "minuet" && beat === 4) playFolkPercussion("wood", .004);
    } else if (theme.rhythm === "polka") {
      if (beat === 0 || beat === 4) {
        playFolkVoice(chordRoot - 12, stepLength * 1.25, "bass", .0095);
        playFolkPercussion("stomp", .007);
      }
      if (beat === 2 || beat === 6) {
        playFolkChord(chordRoot, theme.mode, "accordion", .0038);
        playFolkPercussion("wood", .0045);
      }
    } else if (theme.rhythm === "flow") {
      if (beat === 0) playFolkVoice(chordRoot - 12, stepLength * 2.4, "bass", .008);
      if (beat === 2 || beat === 6) playFolkChord(chordRoot, theme.mode, "strings", .0032);
      if (beat === 4) playFolkVoice(chordRoot + 12, stepLength * 1.8, "bell", .0038);
    } else if (theme.rhythm === "secret") {
      if (beat === 0) {
        playFolkVoice(chordRoot - 12, stepLength * 2.1, "bass", .0068);
        playFolkVoice(chordRoot + 12, stepLength * 1.5, "bell", .0035, .04);
      }
      if (beat === 3 || beat === 6) playFolkChord(chordRoot, theme.mode, "strings", .0028);
      if (beat === theme.meter - 1) playFolkPercussion("chime", .0045);
    } else {
      if (beat === 0 || beat === 4) {
        playFolkVoice(chordRoot - 12, stepLength * 1.5, "bass", .009);
        playFolkPercussion("stomp", .007);
      }
      if (beat === 2 || beat === 6) playFolkChord(chordRoot, theme.mode, theme.lead === "horn" ? "strings" : "accordion", .0034);
      if (beat % 2 === 1) playFolkPercussion("wood", .0032);
    }

    if (!theme.secret && beat === Math.floor(theme.meter / 2)) {
      const answer = chordRoot + (theme.mode === "major" ? 16 : 15);
      playFolkVoice(answer, stepLength * .72, theme.lead === "flute" ? "zither" : "flute", .0036, .025);
    }
  }

  function playFolkChord(rootMidi, mode, voice, volume, delay = 0) {
    const third = mode === "major" ? 4 : 3;
    [0, third, 7].forEach((offset, index) => {
      playFolkVoice(rootMidi + offset, .42, voice, volume * (index === 0 ? 1 : .78), delay + index * .012);
    });
  }

  function playFolkVoice(midi, duration, voice = "zither", volume = .01, delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const profiles = {
      zither: { partials: [["triangle", 1, 1], ["sine", 2, .22]], attack: .004, filter: 3100, pluck: true },
      dulcimer: { partials: [["triangle", 1, 1], ["square", 2, .12], ["sine", 3, .08]], attack: .003, filter: 2600, pluck: true },
      accordion: { partials: [["sawtooth", 1, .56, -6], ["sawtooth", 1, .56, 6]], attack: .045, filter: 1500 },
      flute: { partials: [["sine", 1, 1], ["triangle", 2, .09]], attack: .035, filter: 3600, vibrato: .72 },
      clarinet: { partials: [["square", 1, .46], ["sine", 1, .58], ["sine", 3, .09]], attack: .025, filter: 2100, vibrato: .28 },
      strings: { partials: [["triangle", 1, .72, -4], ["triangle", 1, .72, 4]], attack: .07, filter: 1250, vibrato: .2 },
      bell: { partials: [["sine", 1, 1], ["sine", 2.01, .28], ["sine", 3.98, .1]], attack: .003, filter: 4200, pluck: true },
      horn: { partials: [["sawtooth", 1, .36], ["triangle", 1, .72], ["sine", 2, .12]], attack: .055, filter: 1100, vibrato: .18 },
      bass: { partials: [["triangle", 1, .88], ["sine", 1, .52]], attack: .012, filter: 620, pluck: true },
    };
    const profile = profiles[voice] || profiles.zither;
    const start = audio.currentTime + Math.max(0, delay);
    const end = start + Math.max(.055, duration);
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const envelope = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(profile.filter, start);
    filter.Q.setValueAtTime(voice === "accordion" ? 1.4 : .7, start);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.linearRampToValueAtTime(volume, start + profile.attack);
    if (profile.pluck) envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, volume * .24), start + duration * .48);
    envelope.gain.exponentialRampToValueAtTime(.0001, end);
    filter.connect(envelope).connect(audio.destination);

    const oscillators = [];
    for (const [type, harmonic, level, detune = 0] of profile.partials) {
      const oscillator = audio.createOscillator();
      const partialGain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency * harmonic, start);
      oscillator.detune.setValueAtTime(detune, start);
      partialGain.gain.setValueAtTime(level, start);
      oscillator.connect(partialGain).connect(filter);
      oscillator.start(start);
      oscillator.stop(end + .03);
      oscillators.push(oscillator);
    }

    if (profile.vibrato) {
      const lfo = audio.createOscillator();
      const lfoGain = audio.createGain();
      lfo.frequency.setValueAtTime(5.2, start);
      lfoGain.gain.setValueAtTime(profile.vibrato, start);
      lfo.connect(lfoGain);
      oscillators.forEach((oscillator) => lfoGain.connect(oscillator.frequency));
      lfo.start(start);
      lfo.stop(end + .03);
    }
  }

  function playFolkPercussion(kind, volume = .006, delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + Math.max(0, delay);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind === "stomp" ? "sine" : kind === "chime" ? "triangle" : "square";
    const startFrequency = kind === "stomp" ? 115 : kind === "chime" ? 1250 : 760;
    const endFrequency = kind === "stomp" ? 54 : kind === "chime" ? 720 : 260;
    const duration = kind === "stomp" ? .14 : kind === "chime" ? .11 : .055;
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function playTone(frequency, duration, type = "sine", volume = 0.04, slide = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.linearRampToValueAtTime(Math.max(60, frequency + slide), audio.currentTime + duration);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function playJingle() {
    [0, 110, 220, 360].forEach((delay, index) => {
      window.setTimeout(() => playTone([440, 554, 659, 880][index], .18, "sine", .04, 50), delay);
    });
  }

  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  function getViewWidth() {
    if (!canvas.height) return W;
    return Math.max(320, H * (canvas.width / canvas.height));
  }

  function frame(now) {
    const dt = Math.min(0.033, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function bindControls() {
    // iOS can otherwise treat a two-finger input on the controls as a page-pan
    // gesture.  Only block it while a level is active so overlay panels keep
    // their regular, scrollable touch behavior.
    const preventGameGesture = (event) => {
      if (game.mode === "playing" && event.cancelable) event.preventDefault();
    };
    ["touchstart", "touchmove", "contextmenu", "selectstart", "dragstart"].forEach((eventName) => {
      stage.addEventListener(eventName, preventGameGesture, { passive: false });
    });

    const isTextEntry = (target) => target instanceof HTMLElement
      && (target.matches("input, textarea, select") || target.isContentEditable);

    window.addEventListener("keydown", (event) => {
      // Do not turn letters into game controls while somebody is writing a
      // name or using another form field in an overlay.
      if (isTextEntry(event.target)) return;
      const gameKey = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "KeyA", "KeyD", "KeyW", "KeyS", "Space"];
      if (gameKey.includes(event.code)) event.preventDefault();
      if (!pressed.has(event.code) && ["ArrowUp", "KeyW", "Space"].includes(event.code)) queueJump();
      pressed.add(event.code);
      if (event.code === "Escape" || event.code === "KeyP") {
        if (game.mode === "playing") pauseGame(); else if (game.mode === "paused") resumeGame();
      }
    });
    window.addEventListener("keyup", (event) => pressed.delete(event.code));
    window.addEventListener("blur", () => {
      pressed.clear();
      held.left = held.right = held.jump = held.down = false;
      if (game.mode === "playing") pauseGame();
    });

    document.querySelectorAll("[data-control]").forEach((button) => {
      const control = button.dataset.control;
      const down = (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        held[control] = true;
        if (control === "jump") queueJump();
      };
      const up = (event) => {
        event.preventDefault();
        held[control] = false;
      };
      button.addEventListener("pointerdown", down);
      button.addEventListener("pointerup", up);
      button.addEventListener("pointercancel", up);
      button.addEventListener("pointerleave", up);
    });
  }

  function bindUi() {
    ui.playerName.value = game.playerName;
    document.querySelector("#startButton").addEventListener("click", () => {
      game.playerName = ui.playerName.value.trim() || "Schorsch";
      saveProgress();
      if (game.startReturnMode === "playing") {
        game.startReturnMode = null;
        resumeGame();
        return;
      }
      ensureAudio();
      startLevel(game.levelIndex);
    });
    document.querySelector("#homeButton").addEventListener("click", openStartScreen);
    document.querySelector("#menuSkillsButton").addEventListener("click", () => {
      renderSkillTree();
      openOverlay(ui.skills);
    });
    document.querySelector("#mapButton").addEventListener("click", () => {
      renderLevelGrid();
      openOverlay(ui.map);
    });
    document.querySelector("#skillsQuickButton").addEventListener("click", () => {
      renderSkillTree();
      openOverlay(ui.skills);
    });
    document.querySelector("#inventoryButton").addEventListener("click", () => {
      renderInventory();
      openOverlay(ui.inventory);
    });
    document.querySelector("#outfitButton").addEventListener("click", () => {
      renderOutfitShop();
      openOverlay(ui.outfits);
    });
    document.querySelector("#pauseButton").addEventListener("click", () => {
      if (game.mode === "playing") pauseGame(); else if (game.mode === "paused") resumeGame();
    });
    document.querySelector("#resumeButton").addEventListener("click", resumeGame);
    document.querySelector("#pauseCloseButton").addEventListener("click", resumeGame);
    document.querySelector("#restartButton").addEventListener("click", () => startLevel(game.levelIndex));
    document.querySelector("#skillsButton").addEventListener("click", () => {
      renderSkillTree();
      openOverlay(ui.skills);
    });
    document.querySelector("#nextLevelButton").addEventListener("click", nextLevel);
    document.querySelector("#finishMapButton").addEventListener("click", () => {
      renderLevelGrid();
      openOverlay(ui.map);
    });
    document.querySelector("#finishCloseButton").addEventListener("click", () => {
      renderLevelGrid();
      openOverlay(ui.map);
    });
    document.querySelectorAll("[data-close-panel]").forEach((button) => {
      button.addEventListener("click", closeOverlay);
    });
    ui.sound.addEventListener("click", () => {
      game.sound = !game.sound;
      if (game.sound) {
        game.musicStep = 0;
        game.musicBeatAt = game.time + .2;
        playTone(440, .08, "sine", .03, 120);
      }
      saveProgress();
      updateHud();
    });
  }

  function init() {
    game.equippedOutfits = new Set([...game.equippedOutfits].filter((id) => game.ownedOutfits.has(id)));
    const equippedCategories = new Set();
    game.equippedOutfits = new Set([...game.equippedOutfits].filter((id) => {
      const outfit = OUTFITS.find((item) => item.id === id);
      if (!outfit || equippedCategories.has(outfit.category)) return false;
      equippedCategories.add(outfit.category);
      return true;
    }));
    game.ownedTalents = new Set([...game.ownedTalents].filter((id) => TALENTS.some((talent) => talent.id === id)));
    game.talents = new Set([...game.talents]
      .filter((id) => game.ownedTalents.has(id))
      .slice(0, MAX_ACTIVE_TALENTS));
    bindControls();
    bindUi();
    resizeCanvas();
    updateHud();
    game.level = createLevel(game.levelIndex);
    stage.classList.toggle("is-underwater", Boolean(game.level.underwater));
    game.player = createPlayer(game.level.start, game.level.underwater);
    game.mode = "menu";
    window.addEventListener("resize", resizeCanvas);
    window.setTimeout(() => ui.loading.classList.add("is-hidden"), 550);
    requestAnimationFrame(frame);
  }

  let initialized = false;
  function bootGame() {
    if (initialized) return;
    initialized = true;
    init();
  }

  if (characterImage.complete) bootGame();
  else {
    characterImage.addEventListener("load", bootGame, { once: true });
    characterImage.addEventListener("error", bootGame, { once: true });
    window.setTimeout(bootGame, 900);
  }
})();
