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
        "GAME_VERSION",
        "CAMPAIGN_CHAPTERS",
        "movementTuning",
        "landingFeedback",
        "damageBoss",
        "isBossStomp",
        "canCompleteEscapeAtGoal",
        "collectUi",
        "createUiActions",
        "createAudioEngine",
        "createRenderer",
        "computeCanvasMetrics",
        "createDebugTools",
      ]
        .forEach((key) => assert(api[key], `${key} fehlt`));
    });

    await test("Zwölf Level besitzen zwölf Reiseaufträge", () => {
      assert(api.LEVELS.length === 12, "Levelanzahl ist nicht 12");
      assert(api.CAMPAIGN_CHAPTERS.length === api.LEVELS.length, "Aufträge und Level sind nicht vollständig");
    });

    await test("Die sichtbare Spielversion folgt SemVer", () => {
      assert(/^\d+\.\d+\.\d+$/.test(api.GAME_VERSION), "Spielversion ist nicht im Format x.y.z");
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
      assert(metrics.width * metrics.height <= 2310000, "Vollbild-Canvas ist weiterhin zu groß");
      assert(metrics.width / metrics.height > 1.7, "Seitenverhältnis wurde beschädigt");
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
