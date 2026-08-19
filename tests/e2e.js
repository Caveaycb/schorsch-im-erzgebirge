(() => {
  "use strict";

  const results = document.querySelector("#results");
  const summary = document.querySelector("#summary");
  const frame = document.querySelector("#gameFrame");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) throw new Error(message);
  }

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

  async function waitForGame() {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Spielstart überschritt 6 Sekunden")), 6000);
      const poll = () => {
        if (frame.contentWindow?.__SCHORSCH_TEST_API__) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(poll, 40);
        }
      };
      frame.addEventListener("load", poll, { once: true });
      poll();
    });
    return frame.contentWindow.__SCHORSCH_TEST_API__;
  }

  async function run() {
    let api;
    await test("Isolierte Spielinstanz startet mit Test-API", async () => {
      api = await waitForGame();
      assert(api.levelCount === 12, "Kampagne besitzt nicht zwölf Level");
    });

    if (api) {
      for (let index = 0; index < api.levelCount; index += 1) {
        await test(`Level ${index + 1} erreicht Auswertung und drei Medaillen`, () => {
          const state = api.finishLevel(index);
          const medal = state.levelMedals[index];
          assert(state.mode === "finished", "Auswertungsmodus wurde nicht erreicht");
          assert(medal?.time && medal?.collector && medal?.flawless, "Nicht alle Medaillen wurden verbucht");
          assert(state.finishMedals.length === 3, "Auswertung zeigt nicht drei Medaillenkarten");
          assert(state.finishMedals.every((entry) => entry.className.includes("is-earned")), "Verdiente Medaille bleibt visuell offen");
          assert(!state.finishStickerShop.hidden && state.finishStickerShop.images === 0, "Auswertung zeigt weiterhin kostenlose Sticker");
          assert(state.finishStickerShop.text.includes("Bergfunken gegen Wunschmotive"), "Auswertung verweist nicht auf den reinen Stickerkauf");
        });
      }

      await test("Gesamtreise schaltet alle drei Kapitelbelohnungen frei", () => {
        const state = api.snapshot();
        assert(state.completed.length === 12, "Nicht alle Level sind abgeschlossen");
        assert(state.claimedChapterRewards.length === 3, "Kapitelbelohnungen sind unvollständig");
        assert(state.souvenirs === 12, `Erwartet werden 12 einzigartige Reiseandenken, gezählt wurden ${state.souvenirs}`);
        assert(state.wallet === 90, "Kapitelprämien ergeben nicht 90 Bergfunken");
        assert(state.ownedStickers.length === 0, `Die Kampagne hat unerlaubt ${state.ownedStickers.length} kostenlose Sticker vergeben`);
      });

      await test("Einzelne Sticker lassen sich zu unterschiedlichen Preisen bis 25 Bergfunken kaufen", () => {
        const premium = api.buySticker("sticker-100");
        assert(premium.purchased && premium.price === 25, "Legendärer Sticker wurde nicht für 25 Bergfunken gekauft");
        assert(premium.beforeWallet - premium.afterWallet === premium.price, "Stickerpreis wurde nicht korrekt abgezogen");
        assert(premium.afterCount === premium.beforeCount + 1, "Gekaufter Sticker fehlt im Album");
        const duplicate = api.buySticker("sticker-100");
        assert(!duplicate.purchased && duplicate.afterWallet === duplicate.beforeWallet, "Bereits vorhandener Sticker wurde doppelt berechnet");
      });

      await test("Stickerpacks liefern drei neue Motive ohne Duplikate", () => {
        const pack = api.openStickerPack();
        assert(pack.beforeWallet - pack.afterWallet === 20, "Stickerpack kostet nicht 20 Bergfunken");
        assert(pack.afterCount - pack.beforeCount === 3, "Stickerpack enthält nicht drei neue Sticker");
        assert(pack.rewards.length === 3 && new Set(pack.rewards).size === 3, "Stickerpack enthält Duplikate");
      });

      await test("Bergfunken erhöhen das Konto auch bei erneutem Einsammeln", () => {
        const first = api.collectSpark(0);
        const repeated = api.collectSpark(0);
        assert(first.after - first.before === 1, "Erster Bergfunke wurde nicht gutgeschrieben");
        assert(repeated.after - repeated.before === 1, "Bereits entdeckter Bergfunke wurde nicht erneut gutgeschrieben");
        assert(first.firstDiscovery && !repeated.firstDiscovery, "Entdeckungsstatus und Punktevergabe sind nicht getrennt");
      });

      await test("Tauchbonus vergibt weiterhin fünf Bergfunken", () => {
        const bonus = api.collectSpark(10);
        assert(bonus.after - bonus.before === 5 && bonus.collectionMultiplier === 5, "Tauchbonus zählt nicht fünffach");
      });

      await test("Sammelobjekte sind in allen Regionen sauber voneinander getrennt", () => {
        const enemyKinds = [];
        for (let index = 0; index < api.levelCount; index += 1) {
          const layout = api.collectionLayout(index);
          assert(layout.objects > 0, `Level ${index + 1} besitzt keine Sammelobjekte`);
          assert(layout.overlaps === 0, `Level ${index + 1} enthält ${layout.overlaps} überlagerte Sammelobjekte: ${JSON.stringify(layout.overlapDetails)}`);
          assert(layout.hearts === 2, `Level ${index + 1} besitzt nicht genau zwei Wanderherzen im Hauptabschnitt`);
          assert(layout.secretHearts <= 1, `Level ${index + 1} enthält zu viele Wanderherzen im Geheimabschnitt`);
          assert(layout.enemies === 4, `Level ${index + 1} besitzt nicht genau vier neu platzierte Fantasiewesen`);
          assert(layout.secretEnemies <= 2, `Level ${index + 1} besitzt zu viele Gegner im Geheimabschnitt`);
          assert(layout.enemyKinds.length === 1, `Level ${index + 1} mischt mehrere Gegnerarten`);
          assert(layout.sparks <= 26 && layout.secretSparks <= 10, `Level ${index + 1} enthält weiterhin zu dichte Bergfunkenspuren`);
          enemyKinds.push(layout.enemyKinds[0]);
        }
        assert(new Set(enemyKinds).size === api.levelCount, "Nicht jedes Level besitzt eine einzigartige Gegnerart");
      });

      await test("Jede Region besitzt genau ein einzigartiges Reiseandenken", () => {
        const souvenirNames = [];
        for (let index = 0; index < api.levelCount; index += 1) {
          const souvenirs = api.collectionLayout(index).souvenirs;
          assert(souvenirs.length === 1, `Level ${index + 1} besitzt ${souvenirs.length} Reiseandenken`);
          souvenirNames.push(souvenirs[0]);
        }
        assert(new Set(souvenirNames).size === api.levelCount, "Reiseandenken-Namen wiederholen sich zwischen Regionen");
      });

      await test("Wanderherzen bleiben global und sind bei Wiederholungen erneut sammelbar", () => {
        const first = api.collectHeart(0);
        assert(first.gained === 1 && first.after === first.before + 1, "Wanderherz erhöht den globalen Vorrat nicht");
        const nextLevel = api.visitLevel(1);
        assert(nextLevel.hearts === first.after, "Levelwechsel setzt die gesammelten Leben zurück");
        const repeated = api.collectHeart(0);
        assert(repeated.gained === 1 && repeated.after === first.after + 1, "Wanderherz lässt sich im neuen Durchlauf nicht erneut sammeln");
        assert(first.firstDiscovery && !repeated.firstDiscovery, "Entdeckungshistorie und erneute Herzgutschrift sind nicht getrennt");
        const diveHeart = api.collectHeart(10);
        assert(diveHeart.gained === 1, "Bonuslevel verändert die Herzgutschrift unerwartet");
        assert(api.snapshot().claimedHearts.length === 2, "Herzfunde wurden nicht dauerhaft registriert");
      });

      await test("Bei 0 Herzen startet Schorsch mit fünf Herzen ohne Fortschrittsverlust neu", () => {
        const rescue = api.rescueAtZero(5);
        assert(rescue.after.mode === "restarting", "Sanfter Levelneustart wurde nicht ausgelöst");
        assert(rescue.after.hearts === 5 && rescue.saved.hearts === 5, "Rettung stellt nicht fünf gespeicherte Herzen her");
        assert(JSON.stringify(rescue.after.completed) === JSON.stringify(rescue.before.completed), "Levelabschlüsse gingen bei der Rettung verloren");
        assert(rescue.after.wallet === rescue.before.wallet, "Bergfunken gingen bei der Rettung verloren");
        assert(rescue.after.ownedStickers.length === rescue.before.ownedStickers.length, "Sticker gingen bei der Rettung verloren");
        assert(rescue.after.claimedHearts.length === rescue.before.claimedHearts.length, "Herzentdeckungen gingen bei der Rettung verloren");
      });

      for (const index of api.bossLevelIndexes) {
        await test(`Endgegner in Level ${index + 1} wechselt vollständig in den Besiegt-Zustand`, () => {
          const boss = api.defeatBoss(index);
          assert(boss.hp === 0 && boss.defeated, `${boss.name} bleibt aktiv`);
          assert(boss.finale === "complete", `${boss.name} öffnet den Ausgang nicht`);
        });
      }
    }

    summary.textContent = failed
      ? `${failed} fehlgeschlagen · ${passed} bestanden`
      : `${passed} Tests bestanden · keine Fehler`;
    document.documentElement.dataset.e2eStatus = failed ? "failed" : "passed";
    window.__SCHORSCH_E2E__ = { passed, failed };
  }

  run();
})();
