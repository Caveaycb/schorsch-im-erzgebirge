(() => {
  "use strict";

  const results = document.querySelector("#results");
  const summary = document.querySelector("#summary");
  let passed = 0;
  let failed = 0;

  function report(name, error = null) {
    const row = document.createElement("li");
    row.className = error ? "fail" : "pass";
    row.textContent = error ? `${name}: ${error.message}` : name;
    results.append(row);
    if (error) failed += 1; else passed += 1;
  }

  async function test(name, callback) {
    try {
      await callback();
      report(name);
    } catch (error) {
      report(name, error);
    }
  }

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

  function nearlyEqual(actual, expected, epsilon = .0001) {
    assert(Math.abs(actual - expected) <= epsilon, `${actual} ist nicht ${expected}`);
  }

  async function run() {
    const api = window.SchorschGame;

    await test("Alle Kernmodule sind geladen", () => {
      [
        "LEVELS",
        "ENEMY_PROFILES",
        "GAME_VERSION",
        "STICKERS",
        "STICKER_CATEGORIES",
        "stickerPrice",
        "nextStickerRewards",
        "CAMPAIGN_CHAPTERS",
        "MEDAL_DEFINITIONS",
        "CHAPTER_REWARDS",
        "calculateLevelMedals",
        "normalizeFoundItems",
        "migrateProgress",
        "movementTuning",
        "landingFeedback",
        "damageBoss",
        "isBossStomp",
        "canCompleteEscapeAtGoal",
        "collectUi",
        "createUiActions",
        "createAudioEngine",
        "createRenderer",
        "createPlayerRenderer",
        "computeCanvasMetrics",
        "createDebugTools",
      ]
        .forEach((key) => assert(api[key], `${key} fehlt`));
    });

    await test("Zwölf Level besitzen zwölf Reiseaufträge", () => {
      assert(api.LEVELS.length === 12, "Levelanzahl ist nicht 12");
      assert(api.CAMPAIGN_CHAPTERS.length === api.LEVELS.length, "Aufträge und Level sind nicht vollständig");
    });

    await test("Das Stickeralbum enthält exakt 100 Motive aus sieben Energiewelten", () => {
      assert(api.STICKERS.length === 100, `Stickeranzahl ist ${api.STICKERS.length} statt 100`);
      assert(new Set(api.STICKERS.map((sticker) => sticker.id)).size === 100, "Sticker-IDs wiederholen sich");
      assert(new Set(api.STICKERS.map((sticker) => sticker.image)).size === 100, "Stickerbilder wiederholen sich");
      const counts = api.STICKERS.reduce((result, sticker) => ({ ...result, [sticker.category]: (result[sticker.category] || 0) + 1 }), {});
      assert(Object.keys(api.STICKER_CATEGORIES).length === 7, "Es existieren nicht sieben Energiewelten");
      assert(counts.pv === 15 && counts.heat === 15, "PV und Wärme besitzen nicht jeweils 15 Motive");
      ["electricity", "gas", "water", "fiber", "emobility"].forEach((category) => assert(counts[category] === 14, `${category} besitzt nicht 14 Motive`));
      const rewards = api.nextStickerRewards(["sticker-001"], 5);
      assert(rewards.length === 5 && rewards.every((sticker) => sticker.id !== "sticker-001"), "Stickerbelohnungen enthalten Duplikate");
      const prices = api.STICKERS.map((sticker) => sticker.price);
      assert(Math.max(...prices) === 25 && Math.min(...prices) >= 1, "Stickerpreise liegen nicht zwischen 1 und 25 Bergfunken");
      assert(new Set(prices).size >= 6, "Stickerpreise besitzen zu wenig Abstufungen");
      assert(api.STICKERS.find((sticker) => sticker.id === "sticker-100")?.price === 25, "Legendärer Sticker ist nicht die wertvollste Karte");
      assert(api.STICKERS.filter((sticker) => sticker.price >= 22).every((sticker) => ["holo", "legendary"].includes(sticker.rarity)), "Premiumpreise und Seltenheiten passen nicht zusammen");
    });

    await test("Jedes Level besitzt eine eigene niedliche Fantasie-Gegnerart", () => {
      assert(api.ENEMY_PROFILES.length === api.LEVELS.length, "Gegnerprofile und Levelzahl stimmen nicht überein");
      assert(new Set(api.ENEMY_PROFILES.map((enemy) => enemy.kind)).size === api.LEVELS.length, "Gegnerarten wiederholen sich");
      assert(new Set(api.ENEMY_PROFILES.map((enemy) => enemy.name)).size === api.LEVELS.length, "Gegnernamen wiederholen sich");
      api.ENEMY_PROFILES.forEach((enemy) => {
        assert(enemy.body && enemy.accent && enemy.highlight && enemy.outline, `${enemy.name} besitzt keine vollständige Farbwelt`);
        assert(["hop", "loop", "drift", "float", "swim"].includes(enemy.motion), `${enemy.name} besitzt keine eigene gültige Bewegung`);
      });
    });

    await test("Die sichtbare Spielversion folgt SemVer", () => {
      assert(/^\d+\.\d+\.\d+$/.test(api.GAME_VERSION), "Spielversion ist nicht im Format x.y.z");
    });

    await test("Alle Level besitzen eine erreichbare Meisterzeit", () => {
      const expectedTimes = [84, 100, 100, 104, 108, 116, 112, 116, 120, 128, 100, 104];
      api.LEVELS.forEach((level, index) => {
        assert(Number.isFinite(level.masteryTime) && level.masteryTime >= 60, `Level ${index + 1}: Meisterzeit fehlt`);
        assert(level.masteryTime === expectedTimes[index], `Level ${index + 1}: Meisterzeit wurde nicht exakt um 20 % reduziert`);
      });
    });

    await test("Drei Medaillen werden unabhängig und dauerhaft bewertet", () => {
      const earned = api.calculateLevelMedals({ elapsedSeconds: 89, masteryTime: 90, foundItems: 7, totalItems: 7, mistakes: 1 });
      assert(earned.time && earned.collector && !earned.flawless, "Medaillenkriterien sind nicht unabhängig");
      const merged = api.mergeLevelMedals({ 0: { flawless: true } }, 0, earned);
      assert(merged[0].time && merged[0].collector && merged[0].flawless, "Frühere Medaillen gehen beim Zusammenführen verloren");
    });

    await test("Alte Spielstände migrieren verlustfrei auf Schema 4", () => {
      const migrated = api.migrateProgress({ currentLevel: 4, unlocked: 6, completed: [0, 1], wallet: 37, bestTimes: { 0: 82.4 } }, 12);
      assert(migrated.schemaVersion === 4, "Speicherschema wurde nicht aktualisiert");
      assert(migrated.currentLevel === 4 && migrated.unlocked === 6, "Reisefortschritt ging bei der Migration verloren");
      assert(migrated.wallet === 37 && migrated.bestTimes[0] === 82.4, "Werte gingen bei der Migration verloren");
      assert(migrated.hearts === 5 && migrated.claimedHearts.length === 0, "Fünf Startleben oder Wanderherz-Historie fehlen");
      assert(migrated.levelMedals && migrated.claimedChapterRewards.length === 0, "Fortschrittsfelder fehlen");
      assert(Array.isArray(migrated.ownedStickers) && migrated.ownedStickers.length === 0, "Stickersammlung fehlt");
    });

    await test("Spielstände lassen sich als JSON exportieren und wieder importieren", () => {
      const entries = new Map();
      const storage = {
        getItem: (key) => entries.get(key) || null,
        setItem: (key, value) => entries.set(key, value),
      };
      const saves = api.createSaveSystem({ storage, gameVersion: api.GAME_VERSION, levelCount: 12 });
      const text = saves.exportText({ currentLevel: 3, unlocked: 5, wallet: 42, hearts: 7, claimedHearts: ["0:main:main-life-0"], ownedStickers: ["sticker-001", "sticker-001", "ungueltig"], levelMedals: { 0: { time: true } } });
      const imported = saves.importText(text);
      assert(imported.currentLevel === 3 && imported.unlocked === 5 && imported.wallet === 42, "Import verändert den Fortschritt");
      assert(imported.hearts === 7 && imported.claimedHearts.length === 1, "Gesammelte Wanderherzen fehlen nach dem Import");
      assert(imported.ownedStickers.length === 1 && imported.ownedStickers[0] === "sticker-001", "Sticker werden nicht sicher gespeichert");
      assert(imported.levelMedals[0].time, "Medaillen fehlen nach dem Import");
      assert(entries.has(api.SAVE_STORAGE_KEY), "Import wurde nicht im Ziel-Speicher abgelegt");
    });

    await test("Doppelte alte Reiseandenken werden pro Region zusammengeführt", () => {
      const normalized = api.normalizeFoundItems([
        "0:main-a", "0:main-b", "0:bonus-a", "1:high-route-1", "1:bonus-c", "reward:forest-master",
      ], api.LEVELS);
      assert(normalized.length === 3, `Erwartet werden 2 Andenken und 1 Kapitelbelohnung, gefunden wurden ${normalized.length}`);
      assert(normalized.includes("0:main-a") && normalized.includes("1:main-a"), "Kanonische Regionsandenken fehlen");
      assert(normalized.includes("reward:forest-master"), "Kapitelbelohnung ging bei der Bereinigung verloren");
    });

    await test("Jeder Reiseauftrag enthält drei Ziele und ein gültiges Finale", () => {
      const allowed = new Set(["charge", "sequence", "escape"]);
      api.CAMPAIGN_CHAPTERS.forEach((chapter, index) => {
        assert(chapter.nodeRatios.length === 3, `Level ${index + 1}: Zielpositionen fehlen`);
        assert(chapter.nodeNames.length === 3, `Level ${index + 1}: Zielnamen fehlen`);
        assert(allowed.has(chapter.finaleType), `Level ${index + 1}: Finaltyp ist ungültig`);
        assert(chapter.finaleType === "charge" || chapter.duration > 0, `Level ${index + 1}: Zeitlimit fehlt`);
      });
    });

    await test("Kollisionen erkennen Überlappung und Trennung", () => {
      assert(api.rectsOverlap({ x: 0, y: 0, w: 20, h: 20 }, { x: 10, y: 10, w: 20, h: 20 }), "Überlappung nicht erkannt");
      assert(!api.rectsOverlap({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 5, h: 5 }), "Trennung nicht erkannt");
    });

    await test("Bewegungstuning reagiert auf Talente und Sonnenkraft", () => {
      const base = api.movementTuning({ underwater: false, onGround: true, icy: false, sprintTalent: false, sunPowered: false });
      const boosted = api.movementTuning({ underwater: false, onGround: true, icy: false, sprintTalent: true, sunPowered: true });
      assert(boosted.maxSpeed > base.maxSpeed, "Maximaltempo steigt nicht");
      assert(boosted.acceleration > base.acceleration, "Beschleunigung steigt nicht");
    });

    await test("Regionale Strömung verändert die Geschwindigkeit deterministisch", () => {
      const player = { x: 20, y: 450, w: 40, h: 80, vx: 10, vy: 0 };
      api.applyRegionalMechanics({ currents: [{ x: 0, w: 200, push: 100 }], windZones: [] }, player, .5);
      nearlyEqual(player.vx, 60);
    });

    await test("Reduziertes Landungsfeedback bleibt innerhalb sicherer Grenzen", () => {
      const feedback = api.landingFeedback(900);
      assert(feedback.shake <= .028, "Landungserschütterung ist zu stark");
      assert(feedback.cameraKick <= 2.8, "Kameraimpuls ist zu stark");
    });

    await test("Drei einzigartige Endbosse sind gleichmäßig über die Hauptreise verteilt", () => {
      const bosses = api.CAMPAIGN_CHAPTERS
        .map((chapter, index) => ({ ...chapter, level: index + 1 }))
        .filter((chapter) => chapter.bossHits > 0);
      const positions = bosses.map((boss) => boss.level);
      const distances = positions.slice(1).map((position, index) => position - positions[index]);
      assert(bosses.length === 3, `Erwartet werden 3 Endbosse, gefunden wurden ${bosses.length}`);
      assert(positions.join(",") === "2,6,10", "Endbosse sind nicht sinnvoll über die Hauptreise verteilt");
      assert(distances.every((distance) => distance === 4), "Endbosse stehen nicht exakt vier Level auseinander");
      assert(new Set(bosses.map((boss) => boss.bossKind)).size === bosses.length, "Endbosse verwenden nicht drei eigene Animationstypen");
      assert(bosses.map((boss) => boss.bossName).join(",") === "Kristallwächter,Sturmkrähe,Wolkentitan", "Endboss-Besetzung ist unvollständig");
      bosses.forEach((config) => {
        assert(config.duration >= 24, `${config.bossName} hat zu wenig Anlaufzeit`);
        const boss = { hp: config.bossHits, maxHp: config.bossHits, invincible: 0, active: true, defeated: false };
        for (let hit = 0; hit < config.bossHits; hit += 1) {
          const result = api.damageBoss(boss);
          boss.invincible = 0;
          assert(result.hit, `${config.bossName} ignoriert Treffer ${hit + 1}`);
        }
        assert(boss.hp === 0 && !boss.active && boss.defeated, `${config.bossName} bleibt nach allen Treffern aktiv`);
      });
      assert(api.isBossStomp(
        { x: 90, y: 75, prevY: 28, w: 44, h: 92, vy: 520 },
        { x: 100, y: 150, w: 104, h: 68 },
      ), "Ein schneller Sprung von oben wird vom Boss nicht erkannt");
      assert(!api.isBossStomp(
        { x: 20, y: 155, prevY: 150, w: 44, h: 92, vy: 0 },
        { x: 100, y: 150, w: 104, h: 68 },
      ), "Seitlicher Kontakt zählt fälschlich als Sprungtreffer");
      assert(!api.canCompleteEscapeAtGoal({ type: "escape", state: "active", boss: {} }), "Boss-Finale wird am Ziel vorzeitig abgeschlossen");
      assert(api.canCompleteEscapeAtGoal({ type: "escape", state: "active" }), "Normales Fluchtfinale schließt am Ziel nicht mehr ab");
      const mineEscape = api.CAMPAIGN_CHAPTERS[2];
      assert(mineEscape.finaleStyle === "cart" && mineEscape.bossHits == null, "Lorenflucht wird weiterhin von einem Boss blockiert");
    });

    await test("Vollbild-Canvas hält sein Pixelbudget ein", () => {
      const metrics = api.computeCanvasMetrics(3840, 2160, 2, true);
      assert(metrics.performanceMode, "Leistungsmodus wird im Vollbild nicht aktiv");
      assert(metrics.width * metrics.height <= 930000, "Vollbild-Canvas ist weiterhin zu groß");
      assert(metrics.width / metrics.height > 1.7, "Seitenverhältnis wurde beschädigt");
      const reduced = api.computeCanvasMetrics(3840, 2160, 2, true, .76);
      assert(reduced.width * reduced.height < metrics.width * metrics.height, "Adaptive Qualität senkt die Renderlast nicht");
      assert(reduced.adaptiveScale === .76, "Adaptive Qualitätsstufe geht verloren");
    });

    await test("Zeitformatierung unterstützt Zehntelsekunden", () => {
      assert(api.formatTime(65.49, true) === "1:05,4", "Bestzeitformat ist falsch");
    });

    if (location.protocol !== "file:") {
      await test("Spieloberfläche startet vollständig im Browser", async () => {
        const frame = document.createElement("iframe");
        frame.hidden = true;
        frame.src = "../index.html?smoke=1";
        document.body.append(frame);
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error("Spielstart überschritt 4 Sekunden")), 4000);
          frame.addEventListener("load", () => { clearTimeout(timeout); resolve(); }, { once: true });
        });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const doc = frame.contentDocument;
        assert(doc.querySelector("#gameCanvas")?.width > 0, "Canvas wurde nicht initialisiert");
        assert(doc.querySelector("#startPanel") && !doc.querySelector("#startPanel").hidden, "Startmenü fehlt");
        assert(doc.querySelectorAll(".control-row").length === 4, "Steuerung ist nicht vollständig untereinander aufgebaut");
        assert(doc.querySelectorAll(".hero-spark").length >= 5 && doc.querySelector(".hero-pedestal"), "Schorschs Startbühne ist unvollständig");
        assert(doc.querySelector("#stickerPanel") && doc.querySelector("#stickerGrid"), "Stickeralbum fehlt in der Oberfläche");
        assert(doc.querySelector("#versionValue")?.textContent === `v${api.GAME_VERSION}`, "Versionsanzeige fehlt");
        assert(doc.querySelector("#loadingScreen")?.classList.contains("is-hidden"), "Ladebildschirm bleibt aktiv");
      });
    } else {
      report("Spieloberflächen-Test unter file:// übersprungen (unter HTTP vollständig aktiv)");
    }

    summary.textContent = failed
      ? `${failed} fehlgeschlagen · ${passed} bestanden`
      : `${passed} Tests bestanden · keine Fehler`;
    document.documentElement.dataset.smokeStatus = failed ? "failed" : "passed";
    window.__SCHORSCH_SMOKE__ = { passed, failed };
  }

  run();
})();
