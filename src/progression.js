(() => {
  "use strict";

  const MEDAL_KEYS = Object.freeze(["time", "collector", "flawless"]);
  const MEDAL_DEFINITIONS = Object.freeze([
    Object.freeze({ key: "time", mark: "◆", title: "Meisterzeit", description: "Erreiche das Ziel innerhalb der Richtzeit." }),
    Object.freeze({ key: "collector", mark: "✦", title: "Andenken", description: "Finde alle Andenken dieser Region." }),
    Object.freeze({ key: "flawless", mark: "♥", title: "Trittsicher", description: "Schließe das Level ohne verlorenes Leben ab." }),
  ]);

  const CHAPTER_REWARDS = Object.freeze([
    Object.freeze({
      id: "forest-master",
      title: "Waldmeister-Abzeichen",
      subtitle: "Kapitel 1 · Level 1–4",
      mark: "♣",
      color: "#3f8a65",
      levelIndexes: Object.freeze([0, 1, 2, 3]),
      sparkBonus: 20,
    }),
    Object.freeze({
      id: "light-master",
      title: "Lichtmeister-Abzeichen",
      subtitle: "Kapitel 2 · Level 5–8",
      mark: "✹",
      color: "#d39a38",
      levelIndexes: Object.freeze([4, 5, 6, 7]),
      sparkBonus: 30,
    }),
    Object.freeze({
      id: "summit-master",
      title: "Gipfelmeister-Abzeichen",
      subtitle: "Kapitel 3 · Level 9–12",
      mark: "▲",
      color: "#7c659c",
      levelIndexes: Object.freeze([8, 9, 10, 11]),
      sparkBonus: 40,
    }),
  ]);

  function emptyMedalRecord() {
    return { time: false, collector: false, flawless: false };
  }

  function normalizeMedalRecord(record) {
    const normalized = emptyMedalRecord();
    if (!record || typeof record !== "object") return normalized;
    MEDAL_KEYS.forEach((key) => { normalized[key] = Boolean(record[key]); });
    return normalized;
  }

  function normalizeLevelMedals(records, levelCount = 12) {
    const normalized = {};
    if (!records || typeof records !== "object") return normalized;
    for (let index = 0; index < levelCount; index += 1) {
      const record = records[index];
      if (!record || typeof record !== "object") continue;
      const medal = normalizeMedalRecord(record);
      if (MEDAL_KEYS.some((key) => medal[key])) normalized[index] = medal;
    }
    return normalized;
  }

  function calculateLevelMedals({ elapsedSeconds, masteryTime, foundItems, totalItems, mistakes }) {
    return {
      time: Number.isFinite(elapsedSeconds)
        && Number.isFinite(masteryTime)
        && masteryTime > 0
        && elapsedSeconds <= masteryTime,
      collector: Number.isFinite(totalItems) && totalItems > 0 && Number(foundItems) >= totalItems,
      flawless: Number(mistakes) === 0,
    };
  }

  function mergeLevelMedals(records, levelIndex, earned) {
    const merged = { ...(records || {}) };
    const previous = normalizeMedalRecord(merged[levelIndex]);
    const current = normalizeMedalRecord(earned);
    merged[levelIndex] = Object.fromEntries(MEDAL_KEYS.map((key) => [key, previous[key] || current[key]]));
    return merged;
  }

  function medalCount(records, indexes = null) {
    const selected = indexes || Object.keys(records || {}).map(Number);
    return selected.reduce((total, index) => {
      const medal = normalizeMedalRecord(records?.[index]);
      return total + MEDAL_KEYS.filter((key) => medal[key]).length;
    }, 0);
  }

  function chapterRewardStatuses(records, claimedRewards = []) {
    const claimed = new Set(claimedRewards || []);
    return CHAPTER_REWARDS.map((reward) => {
      const earnedMedals = medalCount(records, reward.levelIndexes);
      const requiredMedals = reward.levelIndexes.length * MEDAL_KEYS.length;
      return {
        ...reward,
        earnedMedals,
        requiredMedals,
        unlocked: earnedMedals >= requiredMedals,
        claimed: claimed.has(reward.id),
      };
    });
  }

  function newlyUnlockedChapterRewards(records, claimedRewards = []) {
    return chapterRewardStatuses(records, claimedRewards)
      .filter((reward) => reward.unlocked && !reward.claimed);
  }

  function expectedLevelItemCount(level) {
    if (!level) return 0;
    return level.items?.length || 0;
  }

  function countFoundLevelItems(foundItems, levelIndex) {
    const prefix = `${levelIndex}:`;
    return [...(foundItems || [])].filter((entry) => String(entry).startsWith(prefix)).length;
  }

  function canonicalSouvenirId(levelIndex, level) {
    if (level?.underwater) return `${levelIndex}:tauch-a`;
    if (level?.mood === "solar") return `${levelIndex}:solar-a`;
    return `${levelIndex}:main-a`;
  }

  function normalizeFoundItems(foundItems, levels = []) {
    const normalized = new Set();
    for (const entry of foundItems || []) {
      const value = String(entry);
      if (value.startsWith("reward:")) {
        normalized.add(value);
        continue;
      }
      const levelIndex = Number(value.split(":", 1)[0]);
      if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= levels.length) continue;
      normalized.add(canonicalSouvenirId(levelIndex, levels[levelIndex]));
    }
    return [...normalized];
  }

  Object.assign(window.SchorschGame ||= {}, {
    MEDAL_KEYS,
    MEDAL_DEFINITIONS,
    CHAPTER_REWARDS,
    normalizeMedalRecord,
    normalizeLevelMedals,
    calculateLevelMedals,
    mergeLevelMedals,
    medalCount,
    chapterRewardStatuses,
    newlyUnlockedChapterRewards,
    expectedLevelItemCount,
    countFoundLevelItems,
    canonicalSouvenirId,
    normalizeFoundItems,
  });
})();
