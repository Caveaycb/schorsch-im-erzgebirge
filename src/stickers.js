(() => {
  "use strict";

  const STICKER_PACK_COST = 20;
  const STICKER_PACK_SIZE = 3;

  const STICKER_CATEGORIES = Object.freeze({
    pv: Object.freeze({ id: "pv", label: "PV", longLabel: "Photovoltaik", mark: "☀", color: "#e9aa27" }),
    heat: Object.freeze({ id: "heat", label: "Wärme", longLabel: "Wärme", mark: "♨", color: "#de6752" }),
    electricity: Object.freeze({ id: "electricity", label: "Strom", longLabel: "Strom", mark: "ϟ", color: "#6274d9" }),
    gas: Object.freeze({ id: "gas", label: "Gas", longLabel: "Gas", mark: "◒", color: "#39916e" }),
    water: Object.freeze({ id: "water", label: "Wasser", longLabel: "Wasser", mark: "●", color: "#338fca" }),
    fiber: Object.freeze({ id: "fiber", label: "Glasfaser", longLabel: "Glasfaser", mark: "✦", color: "#8566c4" }),
    emobility: Object.freeze({ id: "emobility", label: "E-Mobilität", longLabel: "E-Mobilität", mark: "◎", color: "#26a97c" }),
  });

  const RAW_STICKERS = [
    [1, "Solarfuchs", "solarfuchs", "pv", "Ein schlauer Sonnenjäger bewacht sein Solardach."],
    [2, "Sonnenfänger", "sonnenfaenger", "pv", "Ein Kolibri mit leuchtenden Solarflügeln fängt jeden Strahl."],
    [3, "Dachdrache", "dachdrache", "pv", "Der kleine Drache lädt ein Dachmodul mit Sonnenfeuer."],
    [4, "Photon-Skater", "photon-skater", "pv", "Ein Gecko surft auf seinem blitzschnellen Solardeck."],
    [5, "Morgenglanz", "morgenglanz", "pv", "Eine Sonnenblume begrüßt den ersten Ertrag des Tages."],
    [6, "Solar-Salamander", "solar-salamander", "pv", "Ein flinker Salamander flitzt über glänzende Module."],
    [7, "PV-Panda", "pv-panda", "pv", "Der gemütliche Panda richtet sein Modul exakt zur Sonne aus."],
    [8, "Zellen-Zebra", "zellen-zebra", "pv", "Seine Streifen leuchten wie perfekt verschaltete Solarzellen."],
    [9, "Speicher-Hamster", "speicher-hamster", "pv", "Er sammelt Sonnenenergie für die Nacht statt Nüsse."],
    [10, "Wechselrichter-Wizard", "wechselrichter-wizard", "pv", "Der Magier verwandelt Sonnenstrom mit einem Funkenschlag."],
    [11, "Dachdecker-Rakete", "dachdecker-rakete", "pv", "Ein Waschbär montiert Module im raketenschnellen Tempo."],
    [12, "Sonnenbiene", "sonnenbiene", "pv", "Die Biene bestäubt Blumen zwischen den Solarmodulen."],
    [13, "Modul-Manta", "modul-manta", "pv", "Ein eleganter Manta gleitet auf blauen Solarflügeln."],
    [14, "Morgenrot-Roboter", "morgenrot-roboter", "pv", "Der Roboter klappt bei Sonnenaufgang seine Module aus."],
    [15, "Sonnenkönig", "sonnenkoenig", "pv", "Der strahlende Löwe trägt die Krone der Solarenergie."],

    [16, "Heizungs-Igel", "heizungs-igel", "heat", "Seine warmen Stacheln machen jedes Zuhause gemütlich."],
    [17, "Wärmepumpen-Pinguin", "waermepumpen-pinguin", "heat", "Der Pinguin zaubert sogar aus kalter Luft behagliche Wärme."],
    [18, "Thermo-Tiger", "thermo-tiger", "heat", "Mit Wärmespuren hält der Tiger die perfekte Temperatur."],
    [19, "Kuschel-Kessel", "kuschel-kessel", "heat", "Ein freundlicher Kessel verteilt wohlige Wärme."],
    [20, "Heizkreis-Krake", "heizkreis-krake", "heat", "Acht Arme regeln acht Heizkreise gleichzeitig."],
    [21, "Fußboden-Maulwurf", "fussboden-maulwurf", "heat", "Der Maulwurf verlegt warme Schlaufen unter dem Boden."],
    [22, "Wärme-Wal", "waerme-wal", "heat", "Ein sanfter Wal trägt einen riesigen Wärmespeicher."],
    [23, "Thermostat-Eule", "thermostat-eule", "heat", "Die kluge Eule kennt für jeden Raum die richtige Stufe."],
    [24, "Fernwärme-Flitzer", "fernwaerme-flitzer", "heat", "Der flinke Hase bringt Wärme durch ein langes Leitungsnetz."],
    [25, "Kamin-Kobold", "kamin-kobold", "heat", "Ein funkelnder Kobold bewacht das sichere Kaminfeuer."],
    [26, "Warmwasser-Otter", "warmwasser-otter", "heat", "Die Otterin planscht in einer perfekt temperierten Welle."],
    [27, "Isolier-Alpaka", "isolier-alpaka", "heat", "Seine flauschige Wolle zeigt, wie gute Dämmung wirkt."],
    [28, "Energieberater-Eisbär", "energieberater-eisbaer", "heat", "Der Eisbär findet mit der Wärmebildkamera jedes Leck."],
    [29, "Speicher-Schildkröte", "speicher-schildkroete", "heat", "Ihr Panzer bewahrt Wärme besonders lange."],
    [30, "Hitzewellen-Drache", "hitzewellen-drache", "heat", "Der rote Drache reitet auf einer kontrollierten Wärmewelle."],

    [31, "Blitz-Biber", "blitz-biber", "electricity", "Der Biber baut ein starkes Stromnetz aus leuchtenden Leitungen."],
    [32, "Volt-Vogel", "volt-vogel", "electricity", "Ein schneller Vogel trägt einen sicheren blauen Blitz."],
    [33, "Kabel-Kater", "kabel-kater", "electricity", "Der Kater entwirrt jedes Kabelknäuel mit einem Pfotengriff."],
    [34, "Transformator-Titan", "transformator-titan", "electricity", "Ein freundlicher Riese passt Spannungen sicher an."],
    [35, "Netz-Ninja", "netz-ninja", "electricity", "Lautlos hält der Ninja das Stromnetz im Gleichgewicht."],
    [36, "Steckdosen-Geist", "steckdosen-geist", "electricity", "Der kleine Geist lässt Steckdosen fröhlich funkeln."],
    [37, "Speicher-Roboter", "speicher-roboter", "electricity", "Seine Akkuzellen warten auf den richtigen Einsatzmoment."],
    [38, "Ampere-Axolotl", "ampere-axolotl", "electricity", "Der Axolotl schwimmt durch leuchtende Stromlinien."],
    [39, "Leiterplatten-Luchs", "leiterplatten-luchs", "electricity", "Mit scharfem Blick prüft der Luchs jede Leiterbahn."],
    [40, "Energie-Magier", "energie-magier", "electricity", "Er dirigiert Blitze wie ein leuchtendes Orchester."],
    [41, "Schorsch unter Strom", "schorsch-unter-strom", "electricity", "Schorsch surft mutig auf einer elektrischen Energiewelle."],
    [42, "Sicherungs-Sheriff", "sicherungs-sheriff", "electricity", "Der Sheriff schützt das Netz vor jeder Überlastung."],
    [43, "Frequenz-Frosch", "frequenz-frosch", "electricity", "Der Frosch hält mit jedem Sprung exakt den richtigen Takt."],
    [44, "Lichtbogen-Löwe", "lichtbogen-loewe", "electricity", "Der Löwe trägt eine majestätische Mähne aus Licht."],

    [45, "Flammen-Frettchen", "flammen-frettchen", "gas", "Das wendige Frettchen bewacht eine saubere blaue Flamme."],
    [46, "Rohrnetz-Robbe", "rohrnetz-robbe", "gas", "Die Robbe gleitet durch ein sicher verbundenes Rohrnetz."],
    [47, "Gaszähler-Gürteltier", "gaszaehler-guerteltier", "gas", "Sein Panzer zeigt den Verbrauch ganz genau an."],
    [48, "Methan-Maulwurf", "methan-maulwurf", "gas", "Der Maulwurf spürt unterirdische Leitungen zuverlässig auf."],
    [49, "Brennwert-Bär", "brennwert-baer", "gas", "Der Bär holt noch das letzte bisschen Wärme heraus."],
    [50, "Pipeline-Pilot", "pipeline-pilot", "gas", "Ein mutiger Dachs kontrolliert die große Energieleitung."],
    [51, "Gasdruck-Gorilla", "gasdruck-gorilla", "gas", "Mit Fingerspitzengefühl hält er den Druck stabil."],
    [52, "Sicherheits-Salamander", "sicherheits-salamander", "gas", "Der Salamander prüft jede Verbindung besonders gründlich."],
    [53, "Kocher-Koala", "kocher-koala", "gas", "Der Koala kocht Kakao über einer kleinen blauen Flamme."],
    [54, "Energie-Erdmännchen", "energie-erdmaennchen", "gas", "Das wachsame Erdmännchen bewacht die Gasstation."],
    [55, "Speicher-Spatz", "speicher-spatz", "gas", "Der Spatz sitzt auf einem sicheren Energiespeicher."],
    [56, "Rohrpost-Rakete", "rohrpost-rakete", "gas", "Eine Rakete saust spielerisch entlang der Pipeline."],
    [57, "Flammen-Phönix", "flammen-phoenix", "gas", "Der Phönix erhebt sich aus einer kontrollierten blauen Flamme."],
    [58, "Gasnetz-Guardian", "gasnetz-guardian", "gas", "Ein gepanzerter Wolf schützt das gesamte Leitungsnetz."],

    [59, "Wellen-Waschbär", "wellen-waschbaer", "water", "Der Waschbär reitet auf einer glasklaren Trinkwasserwelle."],
    [60, "Hydranten-Hund", "hydranten-hund", "water", "Der treue Hund bewacht den roten Hydranten."],
    [61, "Wasserwerk-Wal", "wasserwerk-wal", "water", "Der Wal trägt ein kleines Wasserwerk auf seinem Rücken."],
    [62, "Tropfen-Tänzer", "tropfen-taenzer", "water", "Ein fröhlicher Tropfen wirbelt durch die Luft."],
    [63, "Rohrnetz-Rochen", "rohrnetz-rochen", "water", "Der Rochen gleitet durch blaue Versorgungsleitungen."],
    [64, "Klärwerk-Krake", "klaerwerk-krake", "water", "Die Krake reinigt Wasser in mehreren Stufen gleichzeitig."],
    [65, "Quell-Qualle", "quell-qualle", "water", "Die Qualle schwebt über einer kristallklaren Quelle."],
    [66, "Regenretter-Frosch", "regenretter-frosch", "water", "Der Frosch sammelt jeden Regentropfen im Fass."],
    [67, "Pumpen-Pelikan", "pumpen-pelikan", "water", "Der Pelikan hebt Wasser mit einer starken Pumpe."],
    [68, "Aqua-Axolotl", "aqua-axolotl", "water", "Ein türkiser Axolotl beschützt sauberes Wasser."],
    [69, "Wasserzähler-Wiesel", "wasserzaehler-wiesel", "water", "Das Wiesel liest den Verbrauch blitzschnell ab."],
    [70, "Kanal-Kapitän", "kanal-kapitaen", "water", "Ein Otter steuert sein Boot sicher durch den Kanal."],
    [71, "Trinkwasser-Drache", "trinkwasser-drache", "water", "Der blaue Drache bewacht einen kostbaren Wassertropfen."],
    [72, "Turbinen-Taucher", "turbinen-taucher", "water", "Der Taucher entdeckt Energie in einer Wasserströmung."],

    [73, "Fiber-Falke", "fiber-falke", "fiber", "Der Falke trägt einen Lichtimpuls schneller als der Wind."],
    [74, "Lichtleiter-Luchs", "lichtleiter-luchs", "fiber", "Sein leuchtender Schweif besteht aus feinen Glasfasern."],
    [75, "Gigabit-Gepard", "gigabit-gepard", "fiber", "Der Gepard sprintet auf einer rasanten Datenbahn."],
    [76, "Router-Roboter", "router-roboter", "fiber", "Der Roboter verteilt Daten an alle Geräte."],
    [77, "Daten-Dachs", "daten-dachs", "fiber", "Der Dachs verlegt Glasfaser sicher unter der Erde."],
    [78, "Laser-Libelle", "laser-libelle", "fiber", "Ihre Flügel senden regenbogenfarbene Lichtsignale."],
    [79, "Netz-Narwal", "netz-narwal", "fiber", "Sein Horn bündelt ein starkes Lichtsignal."],
    [80, "Spleiß-Spinne", "spleiss-spinne", "fiber", "Die Spinne verbindet feinste Fasern im Handumdrehen."],
    [81, "WLAN-Waschbär", "wlan-waschbaer", "fiber", "Der Waschbär verteilt das Glasfasertempo im ganzen Haus."],
    [82, "Download-Drache", "download-drache", "fiber", "Der Drache fängt einen riesigen leuchtenden Datenstrom."],
    [83, "Upload-Uhu", "upload-uhu", "fiber", "Der Uhu schickt Dateien mit einem Flügelschlag los."],
    [84, "Pixel-Panda", "pixel-panda", "fiber", "Der Panda jongliert mit bunten Datenpaketen."],
    [85, "Glasfaser-Galaxie", "glasfaser-galaxie", "fiber", "Ein kosmischer Hase surft durch ein leuchtendes Fasernetz."],
    [86, "Daten-Delfin", "daten-delfin", "fiber", "Der Delfin springt durch eine ultraschnelle Datenwelle."],

    [87, "Lade-Luchs", "lade-luchs", "emobility", "Der Luchs lädt seinen Elektroflitzer an der Wallbox."],
    [88, "E-Flitzer-Fuchs", "e-flitzer-fuchs", "emobility", "Der Fuchs fährt leise und schnell durch eine grüne Kurve."],
    [89, "Akku-Ameise", "akku-ameise", "emobility", "Die starke Ameise trägt eine volle Fahrzeugbatterie."],
    [90, "Stromer-Schildkröte", "stromer-schildkroete", "emobility", "Ihre elektrische Fahrt ist ruhig, ausdauernd und sicher."],
    [91, "Ladepark-Löwe", "ladepark-loewe", "emobility", "Der Löwe bewacht einen ganzen Park aus Ladesäulen."],
    [92, "Wallbox-Wiesel", "wallbox-wiesel", "emobility", "Das flinke Wiesel steckt den Ladestecker ein."],
    [93, "E-Bike-Biber", "e-bike-biber", "emobility", "Der Biber radelt mit elektrischer Unterstützung bergauf."],
    [94, "E-Bus-Bär", "e-bus-baer", "emobility", "Der freundliche Bär fährt alle leise durch die Stadt."],
    [95, "Schnelllade-Gepard", "schnelllade-gepard", "emobility", "Der Gepard macht nur einen blitzkurzen Ladestopp."],
    [96, "Kabel-Känguru", "kabel-kaenguru", "emobility", "Im Beutel steckt immer das passende Ladekabel."],
    [97, "E-Roller-Rakete", "e-roller-rakete", "emobility", "Ein Hamster saust auf seinem elektrischen Roller los."],
    [98, "Reichweiten-Roboter", "reichweiten-roboter", "emobility", "Der Roboter plant die perfekte Route zur nächsten Säule."],
    [99, "Elektro-Eule", "elektro-eule", "emobility", "Die Eule lädt nachts besonders clever."],
    [100, "Zukunfts-Schorsch", "zukunfts-schorsch", "emobility", "Schorsch führt die große Energieparade im Elektroauto an."],
  ];

  function rarityFor(number) {
    if (number === 100) return "legendary";
    if (number % 10 === 0) return "holo";
    if (number % 5 === 0) return "shiny";
    return "standard";
  }

  function stickerPrice(number, rarity = rarityFor(number)) {
    if (rarity === "legendary") return 25;
    if (rarity === "holo") return 22;
    if (rarity === "shiny") return 16;
    return 7 + ((number - 1) % 4) * 2;
  }

  const STICKERS = Object.freeze(RAW_STICKERS.map(([number, name, slug, category, description]) => {
    const rarity = rarityFor(number);
    return Object.freeze({
      id: `sticker-${String(number).padStart(3, "0")}`,
      number,
      name,
      slug,
      category,
      description,
      rarity,
      price: stickerPrice(number, rarity),
      image: `assets/stickers/sticker-${String(number).padStart(3, "0")}-${slug}.png`,
    });
  }));

  const STICKER_BY_ID = Object.freeze(Object.fromEntries(STICKERS.map((sticker) => [sticker.id, sticker])));
  const categoryOrder = Object.keys(STICKER_CATEGORIES);
  const grouped = Object.fromEntries(categoryOrder.map((category) => [category, STICKERS.filter((sticker) => sticker.category === category)]));
  const maxCategorySize = Math.max(...Object.values(grouped).map((stickers) => stickers.length));
  const STICKER_REWARD_ORDER = Object.freeze(Array.from({ length: maxCategorySize }, (_, index) => (
    categoryOrder.map((category) => grouped[category][index]).filter(Boolean)
  )).flat());

  function normalizeStickerIds(value) {
    const source = Array.isArray(value) ? value : [];
    return [...new Set(source.map(String).filter((id) => STICKER_BY_ID[id]))];
  }

  function nextStickerRewards(ownedStickerIds, count = 1) {
    const owned = new Set(normalizeStickerIds(ownedStickerIds));
    const limit = Math.max(0, Math.floor(Number(count) || 0));
    return STICKER_REWARD_ORDER.filter((sticker) => !owned.has(sticker.id)).slice(0, limit);
  }

  function stickerCategoryCounts(ownedStickerIds) {
    const owned = new Set(normalizeStickerIds(ownedStickerIds));
    return Object.fromEntries(categoryOrder.map((category) => [category, {
      owned: grouped[category].filter((sticker) => owned.has(sticker.id)).length,
      total: grouped[category].length,
    }]));
  }

  Object.assign(window.SchorschGame ||= {}, {
    STICKER_PACK_COST,
    STICKER_PACK_SIZE,
    STICKER_CATEGORIES,
    STICKERS,
    STICKER_BY_ID,
    STICKER_REWARD_ORDER,
    stickerPrice,
    normalizeStickerIds,
    nextStickerRewards,
    stickerCategoryCounts,
  });
})();
