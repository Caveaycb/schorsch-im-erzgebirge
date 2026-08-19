(() => {
  "use strict";

  const SAVE_SCHEMA_VERSION = 4;
  const SAVE_STORAGE_KEY = "schorsch-progress";

  function uniqueArray(value) {
    return Array.isArray(value) ? [...new Set(value)] : [];
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function sanitizeBestTimes(bestTimes, levelCount) {
    if (!bestTimes || typeof bestTimes !== "object") return {};
    const sanitized = {};
    for (let index = 0; index < levelCount; index += 1) {
      const time = Number(bestTimes[index]);
      if (Number.isFinite(time) && time >= 0) sanitized[index] = time;
    }
    return sanitized;
  }

  function defaultProgress() {
    return {
      schemaVersion: SAVE_SCHEMA_VERSION,
      currentLevel: 0,
      unlocked: 1,
      completed: [],
      playerName: "Schorsch",
      sound: true,
      wallet: 0,
      hearts: 5,
      claimedSparks: [],
      claimedHearts: [],
      ownedOutfits: [],
      equippedOutfits: [],
      ownedItems: [],
      equippedItems: [],
      itemLoadoutSaved: false,
      itemOnlyMigrationDone: false,
      talents: [],
      ownedTalents: [],
      equippedTalents: [],
      talentLoadoutSaved: false,
      foundItems: [],
      bestTimes: {},
      tutorialsSeen: [],
      levelMedals: {},
      claimedChapterRewards: [],
      ownedStickers: [],
      savedWithVersion: "",
      savedAt: "",
    };
  }

  function migrateProgress(source, levelCount = 12) {
    const raw = source && typeof source === "object" && !Array.isArray(source) ? source : {};
    const progress = { ...defaultProgress(), ...raw };
    progress.schemaVersion = SAVE_SCHEMA_VERSION;
    progress.currentLevel = Math.max(0, Math.min(levelCount - 1, Math.floor(finiteNumber(progress.currentLevel, 0))));
    progress.unlocked = Math.max(1, Math.min(levelCount, Math.floor(finiteNumber(progress.unlocked, 1))));
    progress.completed = uniqueArray(progress.completed)
      .map(Number)
      .filter((index) => Number.isInteger(index) && index >= 0 && index < levelCount);
    progress.playerName = String(progress.playerName || "Schorsch").trim().slice(0, 16) || "Schorsch";
    progress.sound = progress.sound !== false;
    progress.wallet = Math.max(0, Math.floor(finiteNumber(progress.wallet, 0)));
    progress.hearts = Math.max(1, Math.min(99, Math.floor(finiteNumber(progress.hearts, 5))));
    [
      "claimedSparks", "claimedHearts", "ownedOutfits", "equippedOutfits", "ownedItems", "equippedItems",
      "talents", "ownedTalents", "equippedTalents", "foundItems", "tutorialsSeen",
      "claimedChapterRewards",
      "ownedStickers",
    ].forEach((key) => { progress[key] = uniqueArray(progress[key]); });
    if (window.SchorschGame.normalizeStickerIds) progress.ownedStickers = window.SchorschGame.normalizeStickerIds(progress.ownedStickers);
    progress.bestTimes = sanitizeBestTimes(progress.bestTimes, levelCount);
    progress.levelMedals = window.SchorschGame.normalizeLevelMedals(progress.levelMedals, levelCount);
    progress.savedWithVersion = String(progress.savedWithVersion || "");
    progress.savedAt = String(progress.savedAt || "");
    return progress;
  }

  function createSaveSystem({ storage = localStorage, gameVersion = "", levelCount = 12, memoryOnly = false } = {}) {
    let memoryProgress = null;

    function readRaw() {
      if (memoryOnly) return memoryProgress;
      try {
        return JSON.parse(storage.getItem(SAVE_STORAGE_KEY) || "null");
      } catch {
        return null;
      }
    }

    function load() {
      return migrateProgress(readRaw(), levelCount);
    }

    function save(snapshot) {
      const progress = migrateProgress({
        ...snapshot,
        schemaVersion: SAVE_SCHEMA_VERSION,
        savedWithVersion: gameVersion,
        savedAt: new Date().toISOString(),
      }, levelCount);
      if (memoryOnly) memoryProgress = progress;
      else storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(progress));
      return progress;
    }

    function exportText(snapshot) {
      const progress = migrateProgress({
        ...snapshot,
        schemaVersion: SAVE_SCHEMA_VERSION,
        savedWithVersion: gameVersion,
        savedAt: new Date().toISOString(),
      }, levelCount);
      return JSON.stringify(progress, null, 2);
    }

    function importText(text) {
      let parsed;
      try {
        parsed = JSON.parse(String(text || ""));
      } catch {
        throw new Error("Die Datei enthält keinen gültigen Schorsch-Spielstand.");
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Der Spielstand besitzt ein ungültiges Format.");
      }
      if (Number(parsed.schemaVersion) > SAVE_SCHEMA_VERSION) {
        throw new Error("Dieser Spielstand stammt aus einer neueren Spielversion und kann hier nicht sicher geladen werden.");
      }
      return save(migrateProgress(parsed, levelCount));
    }

    return { load, save, exportText, importText };
  }

  Object.assign(window.SchorschGame ||= {}, {
    SAVE_SCHEMA_VERSION,
    SAVE_STORAGE_KEY,
    defaultProgress,
    migrateProgress,
    createSaveSystem,
  });
})();
