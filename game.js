(() => {
  "use strict";

  const {
    GAME_VERSION,
    LEVELS,
    ENEMY_PROFILES,
    ITEM_CATEGORIES,
    HAND_ITEMS,
    LEGACY_OUTFIT_REFUNDS,
    TALENTS,
    CAMPAIGN_CHAPTERS,
    MEDAL_DEFINITIONS,
    CHAPTER_REWARDS,
    STICKERS,
    STICKER_CATEGORIES,
    STICKER_PACK_COST,
    STICKER_PACK_SIZE,
    nextStickerRewards,
    normalizeStickerIds,
    stickerCategoryCounts,
    LEVEL_MUSIC,
    SECRET_MUSIC,
    REGIONAL_ITEMS,
    SECRET_ROOM_LAYOUTS,
    collectUi,
    formatTime,
    createAudioEngine,
    createRenderer,
    createUiActions,
    createDebugTools,
    groundAt,
    applyRegionalMechanics,
    rectsOverlap,
    movementTuning,
    landingFeedback,
    damageBoss,
    isBossStomp,
    canCompleteEscapeAtGoal,
    calculateLevelMedals,
    mergeLevelMedals,
    normalizeMedalRecord,
    medalCount,
    chapterRewardStatuses,
    newlyUnlockedChapterRewards,
    expectedLevelItemCount,
    countFoundLevelItems,
    normalizeFoundItems,
    createSaveSystem,
  } = window.SchorschGame;

  const canvas = document.querySelector("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const stage = document.querySelector("#stage");
  const ui = collectUi(document);

  const W = 1280;
  const H = 720;
  const TAU = Math.PI * 2;
  const START_LIVES = 5;
  const MAX_LIVES = 99;
  const MAX_ACTIVE_TALENTS = 4;
  const TEST_MODE = new URLSearchParams(location.search).has("e2e");
  const BOSS_PROFILES = Object.freeze({
    stormCrow: {
      width: 104, height: 68, yOffset: 112, hoverX: 42, hoverY: 19,
      attackInterval: 1.45, attackDuration: .38, attackRange: 300, attackStrength: 690,
      tone: 205,
    },
    crystalGuardian: {
      width: 116, height: 82, yOffset: 108, hoverX: 32, hoverY: 13,
      attackInterval: 1.72, attackDuration: .5, attackRange: 285, attackStrength: 610,
      tone: 285,
    },
    cloudTitan: {
      width: 132, height: 92, yOffset: 125, hoverX: 54, hoverY: 24,
      attackInterval: 1.28, attackDuration: .46, attackRange: 335, attackStrength: 820,
      tone: 155,
    },
  });

  const characterImage = new Image();
  characterImage.src = "assets/characters/schorsch.svg";
  const divingCharacterImage = new Image();
  divingCharacterImage.src = "assets/characters/schorsch-diving.svg";
  const cvagLogoImage = new Image();
  cvagLogoImage.src = "assets/branding/cvag-logo.png";

  const backdropSources = {
    day: "assets/backgrounds/erzgebirge-day-v2.png",
    mine: "assets/backgrounds/silberstollen-v2.png",
    night: "assets/backgrounds/erzgebirge-night-v2.png",
    "level-01": "assets/backgrounds/level-01-seiffen-v4.png",
    "level-02": "assets/backgrounds/level-02-lichterdorf-v4.png",
    "level-03": "assets/backgrounds/level-03-silberstollen-v4.png",
    "level-04": "assets/backgrounds/level-04-zschopautal-v4.png",
    "level-05": "assets/backgrounds/level-05-bimmelbahn-v5.png",
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
  let frameAccumulator = 0;
  let restartTimer = 0;
  let resizeFrame = 0;
  let stageResizeObserver = null;

  const saveSystem = createSaveSystem({
    gameVersion: GAME_VERSION,
    levelCount: LEVELS.length,
    memoryOnly: TEST_MODE,
  });
  const storage = saveSystem.load();
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
    claimedHearts: new Set(Array.isArray(storage.claimedHearts) ? storage.claimedHearts : []),
    ownedItems: new Set(storage.itemLoadoutSaved && Array.isArray(storage.ownedItems) ? storage.ownedItems : (Array.isArray(storage.ownedOutfits) ? storage.ownedOutfits : [])),
    equippedItems: new Set(storage.itemLoadoutSaved && Array.isArray(storage.equippedItems) ? storage.equippedItems : (Array.isArray(storage.equippedOutfits) ? storage.equippedOutfits : [])),
    itemOnlyMigrationDone: Boolean(storage.itemOnlyMigrationDone),
    ownedTalents: new Set(storedOwnedTalents),
    talents: new Set(storedEquippedTalents.slice(0, MAX_ACTIVE_TALENTS)),
    foundItems: new Set(Array.isArray(storage.foundItems) ? storage.foundItems : []),
    bestTimes: storage.bestTimes && typeof storage.bestTimes === "object" ? { ...storage.bestTimes } : {},
    tutorialsSeen: new Set(Array.isArray(storage.tutorialsSeen) ? storage.tutorialsSeen : []),
    levelMedals: storage.levelMedals && typeof storage.levelMedals === "object" ? { ...storage.levelMedals } : {},
    claimedChapterRewards: new Set(Array.isArray(storage.claimedChapterRewards) ? storage.claimedChapterRewards : []),
    ownedStickers: new Set(normalizeStickerIds(storage.ownedStickers)),
    recentStickerIds: new Set(),
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
    hearts: Math.max(1, Math.min(MAX_LIVES, Number(storage.hearts) || START_LIVES)),
    lifeTalentUsed: false,
    safetyNetUsed: false,
    runMistakes: 0,
    sparks: 0,
    runStartedAt: 0,
    pausedAt: 0,
    particles: [],
    time: 0,
    shake: 0,
    musicBeatAt: 0,
    musicStep: 0,
    startReturnMode: null,
    chapterBannerTimer: 0,
  };

  const audioEngine = createAudioEngine({ game, LEVELS, LEVEL_MUSIC, SECRET_MUSIC });
  const { ensureAudio, playRegionalIntro, updateRegionalMusic, playTone, playJingle } = audioEngine;
  const renderer = createRenderer({
    canvas,
    ctx,
    stage,
    game,
    H,
    TAU,
    HAND_ITEMS,
    characterImage,
    divingCharacterImage,
    cvagLogoImage,
    getBackdropImage,
    createLevel,
  });
  const { draw, resizeCanvas, sampleRenderPerformance, getViewWidth, getRenderProfile, currentOutfitLoadout, singleOutfitLoadout, renderOutfitVariantInto } = renderer;
  const debugTools = createDebugTools({ canvas, ctx, game, H, getViewWidth });
  const uiActions = createUiActions({
    ui,
    game,
    LEVELS,
    ITEM_CATEGORIES,
    HAND_ITEMS,
    TALENTS,
    REGIONAL_ITEMS,
    MEDAL_DEFINITIONS,
    CHAPTER_REWARDS,
    STICKERS,
    STICKER_CATEGORIES,
    STICKER_PACK_COST,
    STICKER_PACK_SIZE,
    nextStickerRewards,
    stickerCategoryCounts,
    normalizeMedalRecord,
    medalCount,
    chapterRewardStatuses,
    MAX_LIVES,
    MAX_ACTIVE_TALENTS,
    formatTime,
    saveProgress,
    startLevel,
    playTone,
    renderOutfitVariantInto,
    currentOutfitLoadout,
    singleOutfitLoadout,
  });
  const { showToast, updateHud, updateMissionHud, renderOutfitShop, renderSkillTree, renderInventory, renderStickerAlbum, buySticker, openStickerPack, renderFinishStickerShop, renderLevelGrid } = uiActions;

  function progressSnapshot() {
    return {
      currentLevel: game.levelIndex,
      unlocked: game.unlocked,
      completed: [...game.completed],
      playerName: game.playerName,
      sound: game.sound,
      wallet: game.wallet,
      claimedSparks: [...game.claimedSparks],
      hearts: game.hearts,
      claimedHearts: [...game.claimedHearts],
      ownedItems: [...game.ownedItems],
      equippedItems: [...game.equippedItems],
      itemLoadoutSaved: true,
      itemOnlyMigrationDone: game.itemOnlyMigrationDone,
      talents: [...game.talents],
      ownedTalents: [...game.ownedTalents],
      equippedTalents: [...game.talents],
      talentLoadoutSaved: true,
      foundItems: [...game.foundItems],
      bestTimes: game.bestTimes,
      tutorialsSeen: [...game.tutorialsSeen],
      levelMedals: game.levelMedals,
      claimedChapterRewards: [...game.claimedChapterRewards],
      ownedStickers: [...game.ownedStickers],
    };
  }

  function saveProgress() {
    return saveSystem.save(progressSnapshot());
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
      // 1. Anfahrt: sichere Einführung und eine erste bewegliche Holzplattform.
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
      ledge("rail-start-2", 565, 415, 190, "wood", { axis: "x", range: 58, speed: .52, phase: .4 }),
      ledge("rail-gap-car", 856, 510, 104, "stone", { axis: "x", range: 32, speed: .76, phase: 1.2 }),

      ledge("rail-dash-1", 1165, 470, 250, "wood", { axis: "x", range: 88, speed: .48, phase: .8 }),
      ledge("rail-dash-2", 1510, 370, 180, "wood"),
      ledge("rail-dash-3", 1745, 460, 170, "stone", { axis: "y", range: 32, speed: .66, phase: 2.1 }),

      ledge("rail-lookout-1", 2250, 500, 180, "stone"),
      ledge("rail-lookout-2", 2470, 400, 185, "wood", { axis: "y", range: 30, speed: .62, phase: .9 }),
      ledge("rail-lookout-3", 2700, 295, 220, "wood"),
      ledge("rail-lookout-down", 2880, 430, 145, "stone"),

      ledge("rail-switch-1", 3270, 465, 190, "wood"),
      ledge("rail-switch-2", 3485, 375, 180, "stone", { axis: "x", range: 58, speed: .54, phase: 2.5 }),
      ledge("rail-switch-3", 3950, 455, 165, "wood"),

      ledge("rail-valley-1", 4350, 495, 185, "stone"),
      ledge("rail-valley-2", 4600, 390, 205, "wood", { axis: "x", range: 76, speed: .5, phase: .6 }),
      ledge("rail-valley-3", 4860, 500, 150, "wood"),
      ledge("rail-tunnel-1", 5270, 465, 220, "stone", { axis: "x", range: 82, speed: .46, phase: 1.7 }),
      ledge("rail-tunnel-2", 5545, 365, 175, "wood"),
      ledge("rail-tunnel-3", 5785, 460, 165, "stone"),

      ledge("rail-final-1", 6315, 475, 190, "wood"),
      ledge("rail-final-2", 6575, 365, 205, "wood", { axis: "y", range: 36, speed: .58, phase: 2.7 }),
      ledge("rail-final-3", 6850, 455, 175, "stone"),
      ledge("rail-depot-1", 7360, 445, 185, "wood"),
      ledge("rail-depot-2", 7605, 350, 195, "stone", { axis: "x", range: 44, speed: .48, phase: .1 }),
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
      mechanic: "Schnelle Plattformen, ein Höhenweg und ein Weichensignal",
      currents: [{ x: 5170, w: 700, push: 185 }],
      windZones: [],
      handcrafted: true,
      railAdventure: true,
      railBoostZones: [{ x: 5170, y: 600, w: 700 }],
      puzzleKind: "railSignal",
      puzzleAnchorIndex: 3,
      secretAnchorId: "rail-lookout-3",
      hints: [
        { x: 430, y: 620, text: "BEWEGLICHE PLATTFORM – DANN HOCHSPRINGEN" },
        { x: 2765, y: 620, text: "HÖHENWEG: SELTENER FUND & GEHEIMGANG" },
        { x: 3605, y: 595, text: "WEICHE: DAS ROTE SIGNAL BERÜHREN" },
        { x: 6460, y: 615, text: "SCHNELLE TALSTRECKE – FEDERN NUTZEN" },
      ],
      decorations: [],
    };

    addPuzzleChallenge(level);
    addNextStageFeatures(level);
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
      ],
      lifePickups: [
        { id: "tauch-life-0", x: 1850, y: 235, collected: false, phase: 1.2 },
        { id: "tauch-life-1", x: 3900, y: 205, collected: false, phase: 3.4 },
      ],
      secret: { found: true },
      secretEntrance: null,
      handcrafted: false,
    };
  }

  function createSolarRailBonusLevel() {
    const index = LEVELS.findIndex((entry) => entry.mood === "solar");
    const meta = LEVELS[index];
    const itemMeta = REGIONAL_ITEMS.solar;
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
        { id: "solar-a", x: 1840, y: 266, name: itemMeta.name, type: itemMeta.type, color: itemMeta.color, collected: game.foundItems.has(`${index}:solar-a`) },
      ],
      lifePickups: [
        { id: "solar-life-0", x: 1300, y: 382, collected: false, phase: 1.1 },
        { id: "solar-life-1", x: 5280, y: 377, collected: false, phase: 3.8 },
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
      addCampaignPolish(floodedMine);
      removeGoalApproachCollectibles(floodedMine);
      return floodedMine;
    }
    if (LEVELS[index]?.mood === "solar") {
      const solarRail = createSolarRailBonusLevel();
      addCampaignPolish(solarRail);
      removeGoalApproachCollectibles(solarRail);
      return solarRail;
    }
    if (index === 0) {
      const seiffen = createSeiffenLevel();
      addPuzzleChallenge(seiffen);
      addNextStageFeatures(seiffen);
      addCampaignPolish(seiffen);
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
    addCampaignPolish(level);
    removeGoalApproachCollectibles(level);
    return level;
  }

  function removeGoalApproachCollectibles(level) {
    if (level.goal && level.collectibles) {
      const clearZoneStart = level.goal.x - 300;
      level.collectibles = level.collectibles.filter((collectible) => collectible.x < clearZoneStart);
    }
    limitLevelBergfunken(level);
    placeLevelEnemies(level);
    separateCollectionObjects(level);
  }

  function evenlySpacedEntries(entries, count) {
    if (entries.length <= count) return entries;
    if (count <= 1) return entries.slice(0, Math.max(0, count));
    const selected = [];
    const used = new Set();
    for (let slot = 0; slot < count; slot += 1) {
      const index = Math.round(slot * (entries.length - 1) / (count - 1));
      if (!used.has(index)) {
        used.add(index);
        selected.push(entries[index]);
      }
    }
    return selected;
  }

  function limitLevelBergfunken(level) {
    const collectibles = [...(level.collectibles || [])].sort((first, second) => first.x - second.x);
    const limit = level.isBonusRoom ? 10 : level.underwater ? 18 : level.mood === "solar" ? 20 : 26;
    if (collectibles.length <= limit) return;
    const puzzleRewards = collectibles.filter((collectible) => String(collectible.id).startsWith("puzzle-reward-"));
    const regular = collectibles.filter((collectible) => !String(collectible.id).startsWith("puzzle-reward-"));
    level.collectibles = [...evenlySpacedEntries(regular, Math.max(0, limit - puzzleRewards.length)), ...puzzleRewards]
      .sort((first, second) => first.x - second.x);
  }

  function levelEnemyBlockers(level) {
    return [
      ...(level.checkpoints || [level.checkpoint]).filter(Boolean).map((checkpoint, index) => ({
        object: { id: `checkpoint-${index}`, x: checkpoint.x + 28, y: checkpoint.y + 42 }, kind: "checkpoint", radiusX: 68, radiusY: 72, fixed: true,
      })),
      ...(level.springs || []).map((spring, index) => ({
        object: { id: `spring-${index}`, x: spring.x + spring.w * .5, y: spring.y }, kind: "spring", radiusX: 55, radiusY: 34, fixed: true,
      })),
      ...(level.secretEntrance ? [{
        object: { id: "secret-entrance", x: level.secretEntrance.x + level.secretEntrance.w * .5, y: level.secretEntrance.y + level.secretEntrance.h * .5 },
        kind: "secretEntrance", radiusX: 72, radiusY: 92, fixed: true,
      }] : []),
      ...(level.goal ? [{
        object: { id: "level-goal", x: level.goal.x + level.goal.w * .5, y: level.goal.y + level.goal.h * .5 },
        kind: "goal", radiusX: 92, radiusY: 82, fixed: true,
      }] : []),
      ...(level.puzzle?.nodes || []).map((node, index) => ({ object: { ...node, id: `puzzle-${index}` }, kind: "puzzle", radiusX: 50, radiusY: 50, fixed: true })),
      ...(level.chapter?.task?.nodes || []).map((node, index) => ({ object: { ...node, id: `task-${index}` }, kind: "task", radiusX: 54, radiusY: 54, fixed: true })),
      ...(level.decorations || []).map((decoration, index) => ({
        object: { id: `decoration-${index}`, x: decoration.x, y: decoration.y - 52 }, kind: "decoration",
        radiusX: 82 * (decoration.scale || 1), radiusY: 76 * (decoration.scale || 1), fixed: true,
      })),
    ];
  }

  function placeLevelEnemies(level) {
    const boosts = (level.hazards || []).filter((hazard) => hazard.kind === "sunBoost");
    const profile = ENEMY_PROFILES[level.index % ENEMY_PROFILES.length];
    const count = level.isBonusRoom ? 2 : 4;
    const ratios = level.isBonusRoom ? [.34, .7] : [.2, .4, .61, .79];
    const grounds = (level.platforms || [])
      .filter((platform) => platform.ground && platform.w >= 230)
      .sort((first, second) => first.x - second.x);
    level.enemyProfile = profile;
    const blockers = levelEnemyBlockers(level);
    const enemies = [];
    ratios.slice(0, count).forEach((ratio, enemyIndex) => {
      const desiredX = level.worldWidth * ratio;
      const radius = profile.radius || 25;
      const aquatic = Boolean(profile.aquatic || level.underwater);
      const candidateGrounds = aquatic ? [null] : grounds;
      const candidates = [];
      for (const ground of candidateGrounds) {
        const range = aquatic ? 70 : Math.min(78, Math.max(30, (ground?.w || 420) * .1));
        const safeLeft = ground ? ground.x + radius + range + 24 : radius + range + 24;
        const safeRight = ground ? ground.x + ground.w - radius - range - 24 : level.worldWidth - radius - range - 24;
        const maxX = Math.max(safeLeft, safeRight);
        const groundY = ground?.y || H - 90;
        const baseY = aquatic
          ? 210 + (enemyIndex % 2) * 225
          : groundY - radius - (profile.airborne ? 72 + (enemyIndex % 2) * 18 : 9);
        const candidateXs = aquatic
          ? [0, 175, -175, 310, -310, 445, -445].map((offset) => desiredX + offset)
          : [desiredX, ground.x + ground.w * .32, ground.x + ground.w * .5, ground.x + ground.w * .68];
        for (const candidateX of candidateXs) {
          const x = Math.max(safeLeft, Math.min(maxX, candidateX));
          const enemyCollisionCount = enemies.filter((enemy) => (
            Math.abs(x - enemy.baseX) < radius + range + enemy.r + enemy.range + 42
            && Math.abs(baseY - enemy.baseY) < radius + enemy.r + 48
          )).length;
          const blockerCollisionCount = blockers.filter((blocker) => (
            Math.abs(x - blocker.object.x) < radius + range + blocker.radiusX + 26
            && Math.abs(baseY - blocker.object.y) < radius + blocker.radiusY + 42
          )).length;
          candidates.push({
            x,
            baseY,
            range,
            collisionCount: enemyCollisionCount + blockerCollisionCount,
            distance: Math.abs(x - desiredX),
          });
        }
      }
      candidates.sort((first, second) => first.collisionCount - second.collisionCount || first.distance - second.distance);
      const selected = candidates[0] || { x: desiredX, baseY: H - 100, range: 40 };
      const enemy = {
        id: `enemy-${level.index}-${level.isBonusRoom ? "secret" : "main"}-${enemyIndex}`,
        kind: "enemy",
        enemyKind: profile.kind,
        enemyName: profile.name,
        palette: profile,
        x: selected.x,
        y: selected.baseY,
        baseX: selected.x,
        baseY: selected.baseY,
        r: radius,
        range: selected.range,
        verticalRange: aquatic || profile.airborne ? 20 : 8,
        speed: .62 + enemyIndex * .075 + (level.index % 3) * .025,
        phase: level.index * .71 + enemyIndex * 1.43,
        motionKind: profile.motion,
        aquatic,
        collected: false,
      };
      enemies.push(enemy);
    });
    level.hazards = [...enemies, ...boosts];
  }

  function heartClaimId(level, life) {
    return `${level.index}:${level.isBonusRoom ? "secret" : "main"}:${life.id}`;
  }

  function collectionObjects(level) {
    return [
      ...levelEnemyBlockers(level),
      ...(level.hazards || [])
        .map((object) => object.kind === "sunBoost"
          ? { object, kind: "sunBoost", radiusX: object.r + 8, radiusY: object.r + 8, fixed: true }
          : { object, kind: "enemy", radiusX: object.r + object.range + 18, radiusY: object.r + 34, fixed: true }),
      ...(level.items || [])
        .map((object) => ({ object, kind: "item", radiusX: 27, radiusY: 31, fixed: false })),
      ...(level.lifePickups || [])
        .map((object) => ({ object, kind: "heart", radiusX: 29, radiusY: 31, fixed: false })),
      ...(level.collectibles || [])
        .map((object) => ({ object, kind: "spark", radiusX: 23, radiusY: 28, fixed: false })),
    ];
  }

  function collectionObjectsOverlap(first, second, padding = 8) {
    return Math.abs(first.object.x - second.object.x) < first.radiusX + second.radiusX + padding
      && Math.abs(first.object.y - second.object.y) < first.radiusY + second.radiusY + padding;
  }

  function collectionOverlapPairs(level) {
    const entries = collectionObjects(level);
    const overlaps = [];
    for (let first = 0; first < entries.length; first += 1) {
      for (let second = first + 1; second < entries.length; second += 1) {
        const bothAreStaticScenery = entries[first].fixed && entries[second].fixed
          && entries[first].kind !== "enemy" && entries[second].kind !== "enemy";
        if (bothAreStaticScenery) continue;
        if (collectionObjectsOverlap(entries[first], entries[second])) {
          overlaps.push({
            first: `${entries[first].kind}:${entries[first].object.id || first}`,
            second: `${entries[second].kind}:${entries[second].object.id || second}`,
            firstPosition: [Math.round(entries[first].object.x), Math.round(entries[first].object.y)],
            secondPosition: [Math.round(entries[second].object.x), Math.round(entries[second].object.y)],
          });
        }
      }
    }
    return overlaps;
  }

  function collectionOverlapCount(level) {
    return collectionOverlapPairs(level).length;
  }

  function pickupSupport(level, object) {
    return (level.platforms || [])
      .filter((platform) => object.x >= platform.x - 24 && object.x <= platform.x + platform.w + 24)
      .filter((platform) => platform.y >= object.y + 18 && platform.y - object.y <= 155)
      .sort((first, second) => Math.abs(first.y - object.y) - Math.abs(second.y - object.y))[0] || null;
  }

  function separateCollectionObjects(level) {
    const entries = collectionObjects(level);
    const placed = [
      ...entries.filter((entry) => entry.fixed),
    ];
    const xOffsets = [0, 64, -64, 104, -104, 148, -148, 196, -196];
    const yOffsets = [0, -62, -104, 62, -148];

    for (const entry of entries.filter((candidate) => !candidate.fixed)) {
      const originX = entry.object.x;
      const originY = entry.object.y;
      const support = pickupSupport(level, entry.object);
      let selected = null;

      for (const yOffset of yOffsets) {
        for (const xOffset of xOffsets) {
          const margin = entry.radiusX + 7;
          const minX = support && support.w >= margin * 2 ? support.x + margin : margin;
          const maxX = support && support.w >= margin * 2 ? support.x + support.w - margin : level.worldWidth - margin;
          const candidate = {
            ...entry,
            object: {
              x: Math.max(minX, Math.min(maxX, originX + xOffset)),
              y: Math.max(70, Math.min(H - 52, originY + yOffset)),
            },
          };
          if (placed.every((other) => !collectionObjectsOverlap(candidate, other))) {
            selected = candidate.object;
            break;
          }
        }
        if (selected) break;
      }

      if (!selected) {
        const fallbackOffsets = Array.from({ length: 20 }, (_, index) => (index % 2 ? -1 : 1) * Math.ceil((index + 1) / 2) * 48);
        for (const xOffset of fallbackOffsets) {
          const candidate = {
            ...entry,
            object: {
              x: Math.max(entry.radiusX + 7, Math.min(level.worldWidth - entry.radiusX - 7, originX + xOffset)),
              y: Math.max(70, Math.min(H - 52, originY)),
            },
          };
          if (placed.every((other) => !collectionObjectsOverlap(candidate, other))) {
            selected = candidate.object;
            break;
          }
        }
      }

      if (selected) {
        entry.object.x = selected.x;
        entry.object.y = selected.y;
      }
      placed.push(entry);
    }

    level.collectionOverlapCount = collectionOverlapCount(level);
  }

  function levelPlatformType(levelIndex, segmentIndex, ledgeIndex) {
    if (LEVELS[levelIndex]?.mood === "rail") return (segmentIndex + ledgeIndex) % 2 === 0 ? "wood" : "stone";
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
      type: kind.id === "solarRelay" ? "stone" : "wood",
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
      rail: "Bewegliche Holz- und Steinplattformen",
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
          id: `rail-platform-${i}`,
          x: ground.x + 55,
          y: ground.y - 145,
          baseX: ground.x + 55,
          baseY: ground.y - 145,
          w: Math.min(245, ground.w - 70), h: 30, ground: false, type: i % 4 === 1 ? "wood" : "stone",
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
    const highRouteCandidates = ledges
      .filter((platform) => platform.y < 455)
      .sort((a, b) => a.x - b.x);
    const highRouteLedges = highRouteCandidates
      .filter((platform, index) => index % Math.max(1, Math.ceil(highRouteCandidates.length / 3)) === 0)
      .slice(0, 3);
    const itemIdA = `${level.index}:main-a`;
    level.items = [
      {
        id: "main-a", x: firstGround.x + Math.min(firstGround.w - 70, 250), y: firstGround.y - 39,
        name: itemMeta.name, type: itemMeta.type, color: itemMeta.color, collected: game.foundItems.has(itemIdA),
      },
    ];

    const fallbackHeartAnchor = highRouteLedges[1]
      || highRouteLedges[0]
      || ledges[Math.floor(ledges.length * .42)]
      || safeAnchor;
    const lifeAnchors = [.34, .68].map((ratio) => (
      grounds[Math.min(grounds.length - 1, Math.max(0, Math.floor(grounds.length * ratio)))]
      || fallbackHeartAnchor
    ));
    level.lifePickups = lifeAnchors.map((lifeAnchor, heartIndex) => ({
      id: `main-life-${heartIndex}`,
      x: lifeAnchor.x + Math.max(34, Math.min(lifeAnchor.w - 34, lifeAnchor.w * (heartIndex ? .38 : .64))),
      y: lifeAnchor.y - 48,
      collected: false,
      phase: level.index * .43 + heartIndex * 1.7,
    }));
  }

  function groundAtX(level, x) {
    const grounds = level.platforms.filter((platform) => platform.ground);
    return grounds.find((ground) => x >= ground.x + 24 && x <= ground.x + ground.w - 24)
      || grounds.reduce((best, ground) => (
        Math.abs((ground.x + ground.w * .5) - x) < Math.abs((best.x + best.w * .5) - x) ? ground : best
      ));
  }

  function chapterGroundPoint(level, desiredX, inset = 80) {
    const ground = groundAtX(level, desiredX);
    const x = Math.max(ground.x + inset, Math.min(ground.x + ground.w - inset, desiredX));
    return { x, y: ground.y - 48, groundY: ground.y };
  }

  function chapterWorldPoint(level, desiredX, yRatio, inset = 80) {
    if (!Number.isFinite(yRatio)) return chapterGroundPoint(level, desiredX, inset);
    const x = Math.max(inset, Math.min(level.worldWidth - inset, desiredX));
    const y = Math.max(90, Math.min(H - 90, H * yRatio));
    return { x, y, groundY: y + 48 };
  }

  function prepareChapterBossArena(level) {
    const goalCenter = level.goal.x + level.goal.w * .5;
    const ground = groundAtX(level, goalCenter) || groundAtX(level, level.goal.x - 120);
    const x = Math.max(
      ground.x + 145,
      Math.min(ground.x + ground.w - 145, level.goal.x - 265),
    );
    const startX = Math.max(ground.x + 20, x - 205);
    const endX = Math.min(ground.x + ground.w - 20, level.goal.x - 18);
    const overlapsArena = (item, padding = 0) => {
      const itemStart = item.x - (item.r || 0) - padding;
      const itemEnd = item.x + (item.w || (item.r || 0) * 2) + padding;
      return itemEnd > startX && itemStart < endX;
    };

    // Der Boss braucht eine reproduzierbare, freie Landefläche. Zufällig
    // erzeugte Dachkanten oder Gegner dürfen den Trefferbereich nicht verdecken.
    level.platforms = level.platforms.filter((platform) => platform.ground || !overlapsArena(platform, 18));
    level.hazards = level.hazards.filter((hazard) => !overlapsArena(hazard, 45));
    level.springs = level.springs.filter((spring) => !overlapsArena(spring, 25));
    return { x, groundY: ground.y, startX, endX };
  }

  function addCampaignPolish(level) {
    const config = CAMPAIGN_CHAPTERS[level.index];
    if (!config || level.isBonusRoom) return;
    const taskNodes = config.nodeRatios.map((ratio, index) => ({
      ...chapterWorldPoint(level, level.worldWidth * ratio, config.nodeYRatios?.[index]),
      index,
      name: config.nodeNames[index],
      active: false,
      pulse: index * 1.17,
    }));
    const startX = Math.max(level.worldWidth * .72, level.goal.x - config.finalDistance);
    const startPoint = chapterGroundPoint(level, startX, 105);
    const finale = {
      type: config.finaleType,
      style: config.finaleStyle,
      title: config.finalTitle,
      hint: config.finalHint,
      activeLabel: config.finalActive,
      doneLabel: config.finalDone,
      state: "locked",
      startX: startPoint.x,
      startY: startPoint.groundY,
      duration: config.duration || 0,
      remaining: config.duration || 0,
      progress: 0,
      charge: 0,
      reminded: false,
      nodes: [],
    };

    if (finale.type === "charge") {
      const station = chapterGroundPoint(level, level.goal.x - 330, 120);
      finale.station = { ...station, radius: 64 };
    } else if (finale.type === "sequence") {
      const distance = Math.max(500, level.goal.x - finale.startX - 150);
      finale.nodes = [.28, .57, .84].map((ratio, index) => ({
        ...chapterWorldPoint(level, finale.startX + distance * ratio, config.finaleYRatios?.[index], 70),
        index,
        active: false,
      }));
    }

    if (Number(config.bossHits) > 0) {
      const arena = prepareChapterBossArena(level);
      const kind = BOSS_PROFILES[config.bossKind] ? config.bossKind : "stormCrow";
      const profile = BOSS_PROFILES[kind];
      finale.boss = {
        name: config.bossName || "Sturmgeist",
        kind,
        x: arena.x,
        y: arena.groundY - profile.yOffset,
        baseX: arena.x,
        baseY: arena.groundY - profile.yOffset,
        arenaStartX: arena.startX,
        arenaEndX: arena.endX,
        w: profile.width,
        h: profile.height,
        hoverX: profile.hoverX,
        hoverY: profile.hoverY,
        attackInterval: profile.attackInterval,
        attackDuration: profile.attackDuration,
        attackRange: profile.attackRange,
        attackStrength: profile.attackStrength,
        attackTone: profile.tone,
        afterMechanic: Boolean(config.bossAfterMechanic),
        hp: config.bossHits,
        maxHp: config.bossHits,
        invincible: 0,
        gustCooldown: .9,
        gusting: 0,
        engaged: false,
        active: false,
        defeated: false,
      };
    }

    level.chapter = {
      config,
      task: {
        title: config.objective,
        doneTitle: config.objectiveDone,
        nodes: taskNodes,
        progress: 0,
        complete: false,
        sequential: Boolean(config.sequential),
      },
      finale,
      goalReminderAt: 0,
    };
  }

  function chapterPlayerCenter(player) {
    return { x: player.x + player.w * .5, y: player.y + player.h * .5 };
  }

  function nearChapterPoint(player, point, radius = 49) {
    const center = chapterPlayerCenter(player);
    return Math.hypot(center.x - point.x, center.y - point.y) < radius;
  }

  function resetChapterBoss(finale) {
    const boss = finale?.boss;
    if (!boss) return;
    boss.x = boss.baseX;
    boss.y = boss.baseY;
    boss.hp = boss.maxHp;
    boss.invincible = 0;
    boss.gustCooldown = .9;
    boss.gusting = 0;
    boss.engaged = false;
    boss.active = finale.state === "active" && !boss.afterMechanic;
    boss.defeated = false;
  }

  function activateChapterBoss(level) {
    const finale = level.chapter?.finale;
    const boss = finale?.boss;
    if (!boss || boss.active || boss.defeated) return false;
    boss.active = true;
    boss.engaged = false;
    boss.gustCooldown = .55;
    boss.gusting = 0;
    finale.remaining = Math.max(finale.remaining, 12);
    updateMissionHud(level);
    return true;
  }

  function pulseMissionHud() {
    ui.missionHud.classList.remove("is-pulsing");
    void ui.missionHud.offsetWidth;
    ui.missionHud.classList.add("is-pulsing");
  }

  function flashFeedback(kind = "success") {
    ui.feedbackFlash.classList.remove("is-active", "is-danger");
    void ui.feedbackFlash.offsetWidth;
    if (kind === "danger") ui.feedbackFlash.classList.add("is-danger");
    ui.feedbackFlash.classList.add("is-active");
  }

  function showChapterBanner(kicker, message, kind = "success") {
    clearTimeout(game.chapterBannerTimer);
    ui.chapterBanner.hidden = false;
    ui.chapterBannerKicker.textContent = kicker;
    ui.chapterBannerText.textContent = message;
    ui.chapterBanner.classList.remove("is-visible");
    void ui.chapterBanner.offsetWidth;
    ui.chapterBanner.classList.add("is-visible");
    flashFeedback(kind);
    game.chapterBannerTimer = window.setTimeout(() => {
      ui.chapterBanner.hidden = true;
      ui.chapterBanner.classList.remove("is-visible");
    }, 2300);
  }

  function completeChapterTask(level) {
    const { chapter } = level;
    if (!chapter || chapter.task.complete) return;
    chapter.task.complete = true;
    chapter.finale.state = "ready";
    game.shake = Math.max(game.shake, .12);
    pulseMissionHud();
    showChapterBanner("Aufgabe geschafft", chapter.config.objectiveDone);
    playTone(520, .12, "triangle", .045, 210);
    window.setTimeout(() => playTone(690, .13, "sine", .035, 170), 85);
    window.setTimeout(() => playTone(860, .18, "sine", .03, 100), 170);
    showToast(`${chapter.config.objectiveDone} – das ${chapter.finale.title} ist bereit!`);
    updateMissionHud(level);
  }

  function startChapterFinale(level) {
    const finale = level.chapter?.finale;
    if (!finale || finale.state !== "ready") return;
    finale.state = "active";
    finale.remaining = finale.duration;
    finale.progress = 0;
    finale.charge = 0;
    finale.nodes.forEach((node) => { node.active = false; });
    resetChapterBoss(finale);
    game.shake = Math.max(game.shake, .16);
    showChapterBanner("Finale", finale.title, finale.type === "escape" ? "danger" : "success");
    playTone(finale.type === "escape" ? 180 : 430, .17, finale.type === "escape" ? "sawtooth" : "triangle", .04, 180);
    updateMissionHud(level);
  }

  function completeChapterFinale(level) {
    const finale = level.chapter?.finale;
    if (!finale || finale.state === "complete") return;
    finale.state = "complete";
    finale.remaining = Math.max(0, finale.remaining);
    if (finale.boss) {
      finale.boss.active = false;
      finale.boss.defeated = true;
    }
    burst(level.goal.x + level.goal.w * .5, level.goal.y + 35, level.chapter.config.accent, 42, 310);
    game.shake = Math.max(game.shake, .22);
    showChapterBanner("Finale geschafft", finale.doneLabel);
    playTone(560, .13, "triangle", .045, 230);
    window.setTimeout(() => playTone(760, .16, "sine", .04, 170), 85);
    window.setTimeout(() => playTone(980, .2, "sine", .03, 80), 175);
    updateMissionHud(level);
  }

  function resetTimedChapterFinale(level, message, loseLife = false) {
    const finale = level.chapter.finale;
    finale.state = "ready";
    finale.remaining = finale.duration;
    finale.progress = 0;
    finale.nodes.forEach((node) => { node.active = false; });
    resetChapterBoss(finale);
    flashFeedback("danger");
    if (loseLife) {
      loseHeart(message);
    } else {
      const point = chapterGroundPoint(level, finale.startX - 55, 95);
      game.player.x = Math.max(0, point.x - game.player.w * .5);
      game.player.y = point.groundY - game.player.h;
      game.player.prevY = game.player.y;
      game.player.vx = 0;
      game.player.vy = 0;
      game.player.invincible = 1;
      game.cameraX = Math.max(0, game.player.x - 260);
      showToast(message);
      playTone(150, .18, "triangle", .035, -60);
    }
    updateMissionHud(level);
  }

  function updateChapterBoss(level, player, dt) {
    const finale = level.chapter?.finale;
    const boss = finale?.boss;
    if (!boss?.active || boss.defeated) return;

    boss.invincible = Math.max(0, boss.invincible - dt);
    const playerCenterX = player.x + player.w * .5;
    const distanceFromBoss = Math.abs(playerCenterX - boss.x);
    if (!boss.engaged && distanceFromBoss < 430) {
      boss.engaged = true;
      finale.remaining = Math.max(finale.remaining, 12);
      showChapterBanner("Endgegner", `${boss.name} · ${boss.maxHp} Sprünge von oben`, "danger");
      showToast(`Bosskampf: Der Fluchttimer pausiert – springe ${boss.maxHp} Mal auf ${boss.name}!`);
    }

    boss.gustCooldown -= boss.engaged ? dt : 0;
    boss.gusting = Math.max(0, boss.gusting - dt);
    if (boss.engaged && boss.gustCooldown <= 0) {
      boss.gustCooldown = boss.attackInterval + Math.sin(game.time * .7) * .16;
      boss.gusting = boss.attackDuration;
      playTone(boss.attackTone, .09, boss.kind === "crystalGuardian" ? "triangle" : "sawtooth", .018, -70);
    }

    const chase = boss.engaged ? Math.max(-72, Math.min(42, (player.x - boss.baseX) * .1)) : 0;
    const desiredX = boss.baseX + chase + Math.sin(game.time * 1.75) * (boss.engaged ? boss.hoverX : boss.hoverX * .42);
    boss.x = Math.max(boss.arenaStartX + boss.w * .5, Math.min(boss.arenaEndX - boss.w * .5, desiredX));
    boss.y = boss.baseY + Math.sin(game.time * (boss.kind === "cloudTitan" ? 1.75 : 2.35)) * boss.hoverY;

    const distance = Math.hypot(playerCenterX - boss.x, player.y + player.h * .5 - boss.y);
    if (boss.engaged && boss.gusting > 0 && distance < boss.attackRange) {
      const direction = playerCenterX < boss.x ? -1 : 1;
      player.vx += direction * boss.attackStrength * dt;
      if (boss.kind === "crystalGuardian") player.vy -= 95 * dt;
      if (boss.kind === "cloudTitan") player.vy += 70 * dt;
      game.cameraKick = Math.max(game.cameraKick, boss.kind === "cloudTitan" ? 1.8 : 1.2);
    }

    const bounds = {
      x: boss.x - boss.w * .5,
      y: boss.y - boss.h * .5,
      w: boss.w,
      h: boss.h,
    };
    const stompedFromAbove = isBossStomp(player, bounds);
    if (stompedFromAbove && boss.invincible <= 0) {
      const hit = damageBoss(boss);
      if (!hit.hit) return;
      boss.gusting = 0;
      player.y = bounds.y - player.h;
      player.vy = -590;
      player.onGround = false;
      finale.remaining = Math.min(finale.duration, finale.remaining + 2.5);
      burst(boss.x, boss.y, boss.hp ? "#dcefe8" : level.chapter.config.accent, boss.hp ? 24 : 42, boss.hp ? 245 : 330);
      game.shake = Math.max(game.shake, boss.hp ? .16 : .24);
      flashFeedback();
      playTone(boss.hp ? 330 : 520, .12, "square", .035, boss.hp ? 160 : 310);
      if (hit.defeated) {
        completeChapterFinale(level);
        showToast(boss.name + " besiegt – der Ausgang ist frei!");
      } else {
        showToast(boss.name + " getroffen · noch " + boss.hp + " Treffer");
      }
      return;
    }

    if (rectsOverlap(player, bounds) && player.invincible <= 0 && boss.invincible <= 0) {
      const direction = playerCenterX < boss.x ? -1 : 1;
      player.vx = direction * 470;
      player.vy = -370;
      player.invincible = .85;
      game.shake = Math.max(game.shake, .12);
      flashFeedback("danger");
      playTone(145, .11, "sawtooth", .025, -55);
      showToast(boss.name + " drängt Schorsch zurück – von oben springen!");
    }
  }

  function updateChapterChallenge(level, player, dt) {
    const chapter = level.chapter;
    if (!chapter) return;
    const { task, finale } = chapter;

    if (!task.complete) {
      for (const node of task.nodes) {
        if (node.active || !nearChapterPoint(player, node, 54)) continue;
        if (task.sequential && node.index !== task.progress) {
          if (game.time > (node.reminderAt || 0)) {
            node.reminderAt = game.time + 1.4;
            showToast((chapter.config.sequenceReminder || "Zuerst Ziel {next} aktivieren.").replace("{next}", task.progress + 1));
            playTone(170, .08, "square", .02, -30);
          }
          continue;
        }
        node.active = true;
        task.progress += 1;
        burst(node.x, node.y, chapter.config.accent, 24, 230);
        game.cameraKick = -5;
        pulseMissionHud();
        flashFeedback();
        playTone(480 + node.index * 120, .11, "triangle", .04, 140);
        showToast(`${node.name} · ${task.progress}/${task.nodes.length}`);
        if (task.progress >= task.nodes.length) completeChapterTask(level);
        updateMissionHud(level);
        break;
      }
    }

    if (!task.complete) return;
    if (finale.state === "ready" && player.x + player.w * .5 >= finale.startX) startChapterFinale(level);
    if (finale.state !== "active") return;

    if (finale.type === "charge") {
      if (nearChapterPoint(player, finale.station, finale.station.radius)) {
        finale.charge = Math.min(1.65, finale.charge + dt);
        if (finale.charge >= 1.6) completeChapterFinale(level);
      } else {
        finale.charge = Math.max(0, finale.charge - dt * .55);
      }
    } else if (finale.type === "sequence") {
      const bossFightRunning = Boolean(finale.boss?.active && !finale.boss.defeated);
      if (!bossFightRunning) finale.remaining = Math.max(0, finale.remaining - dt);
      const next = finale.nodes[finale.progress];
      if (next && nearChapterPoint(player, next, 58)) {
        next.active = true;
        finale.progress += 1;
        burst(next.x, next.y, "#ffe37a", 27, 255);
        pulseMissionHud();
        flashFeedback();
        playTone(560 + next.index * 150, .1, "sine", .045, 120);
        if (finale.progress >= finale.nodes.length && !activateChapterBoss(level)) completeChapterFinale(level);
      }
      if (finale.boss?.active) updateChapterBoss(level, player, dt);
      if (finale.state === "active" && !finale.boss?.active && finale.remaining <= 0) {
        resetTimedChapterFinale(level, chapter.config.failureMessage || "Die Zeit ist abgelaufen – das Finale startet noch einmal.");
      }
    } else if (finale.type === "escape") {
      updateChapterBoss(level, player, dt);
      if (finale.state !== "active") {
        updateMissionHud(level);
        return;
      }
      const bossFightRunning = Boolean(finale.boss?.engaged && !finale.boss.defeated);
      if (!bossFightRunning) finale.remaining = Math.max(0, finale.remaining - dt);
      if (finale.remaining <= 0) {
        resetTimedChapterFinale(
          level,
          chapter.config.failureMessage || "Die Verfolgung war schneller – starte das Finale erneut.",
          Boolean(chapter.config.retryCostsLife),
        );
      }
    }
    updateMissionHud(level);
  }

  function chapterGoalIsOpen(level) {
    return !level.chapter || level.chapter.finale.state === "complete";
  }

  function handleLockedChapterGoal(level, player) {
    const chapter = level.chapter;
    if (!chapter || chapterGoalIsOpen(level)) return false;
    if (canCompleteEscapeAtGoal(chapter.finale)) {
      completeChapterFinale(level);
      return false;
    }
    player.x = Math.max(0, level.goal.x - player.w - 20);
    player.vx = Math.min(0, player.vx) - 90;
    if (game.time >= chapter.goalReminderAt) {
      chapter.goalReminderAt = game.time + 1.5;
      flashFeedback("danger");
      const boss = chapter.finale.boss;
      showToast(boss?.active && !boss.defeated
        ? "Besiege zuerst die " + boss.name + " · noch " + boss.hp + " Treffer"
        : chapter.task.complete ? chapter.finale.hint : `Noch offen: ${chapter.config.objective}`);
      playTone(145, .1, "square", .025, -35);
    }
    return true;
  }

  function createSecretRoom(parentLevel) {
    const roomId = parentLevel.index;
    const layout = SECRET_ROOM_LAYOUTS[roomId] || SECRET_ROOM_LAYOUTS[0];
    const grounds = layout.grounds.map(([x, y, w], index) => bonusGround(`b-g${index}`, x, y, w, layout.groundType));
    const ledges = layout.ledges.map(([x, y, w, type, movement, extra], index) => (
      bonusLedge(`b-l${index}`, x, y, w, type || layout.ledgeType, movement, extra)
    ));
    const platforms = [...grounds, ...ledges];
    const lastGround = grounds[grounds.length - 1];
    const checkpoints = createCheckpointRoute(grounds, [.34, .68]);
    const sparkSpots = [
      ...ledges.slice(0, 8).map((platform) => [platform.x + platform.w * .5, platform.y - 54]),
      ...grounds.slice(1, 4).map((platform) => [platform.x + platform.w * .52, platform.y - 62]),
    ];
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
      chapter: null,
      handcrafted: false,
      worldWidth: layout.worldWidth,
      platforms,
      springs: layout.springs.map(([x, y]) => ({ x, y, w: 54, h: 18 })),
      hazards: layout.hazards.map(([x, y, range, speed], index) => ({ x, y, baseX: x, r: 24, range, speed, phase: index * 1.37 + .4 })),
      collectibles: sparkSpots.map(([x, y], index) => ({ id: `bonus-c-${index}`, x, y, collected: false, phase: index * .57 })),
      items: [],
      lifePickups: [
        { id: "bonus-life-a", x: ledges[Math.floor(ledges.length * .5)].x + ledges[Math.floor(ledges.length * .5)].w * .5, y: ledges[Math.floor(ledges.length * .5)].y - 48, collected: false, phase: 2.4 },
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

  function startLevel(index) {
    clearTimeout(restartTimer);
    restartTimer = 0;
    clearTimeout(game.chapterBannerTimer);
    game.chapterBannerTimer = 0;
    ui.chapterBanner.hidden = true;
    ui.chapterBanner.classList.remove("is-visible");
    ui.feedbackFlash.classList.remove("is-active", "is-danger");
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
    game.lifeTalentUsed = false;
    game.safetyNetUsed = false;
    game.runMistakes = 0;
    game.musicBeatAt = 0;
    game.musicStep = 0;
    closeAllPanels();
    canvas.focus({ preventScroll: true });
    updateHud();
    saveProgress();
    playTone(340, 0.09, "sine", 0.04);
    playRegionalIntro(game.level);
    if (game.level.chapter && !game.tutorialsSeen.has(game.levelIndex)) {
      openChapterTutorial(game.level);
    } else {
      showToast(game.level.underwater
        ? "Bonuslevel: Tauchstollen · alles Eingesammelte zählt ×5!"
        : game.level.mood === "solar"
          ? "Bonuslevel: Sonnenbahn · lade die ruhige Bergbahn für die Heimfahrt!"
        : game.level.chapter
          ? `Reiseauftrag: ${game.level.chapter.config.objective}`
          : `Level ${game.levelIndex + 1}: ${game.level.short} · ${game.level.mechanic || "Wanderfreude"}`);
    }
  }

  function openChapterTutorial(level) {
    const chapter = level.chapter;
    if (!chapter) return;
    game.mode = "paused";
    game.pausedAt = performance.now();
    ui.tutorial.style.setProperty("--chapter-accent", chapter.config.accent);
    ui.tutorialKicker.textContent = `Reiseauftrag · Level ${level.index + 1}`;
    ui.tutorialMark.textContent = chapter.config.mark;
    ui.tutorialTitle.textContent = chapter.config.title;
    ui.tutorialText.textContent = chapter.config.tutorial;
    ui.tutorialFinal.textContent = chapter.config.finalHint;
    ui.tutorialControls.textContent = chapter.config.controls;
    openPanel(ui.tutorial);
  }

  function closeChapterTutorial() {
    if (!game.level?.chapter) return;
    game.tutorialsSeen.add(game.levelIndex);
    saveProgress();
    resumeGame();
    showToast(`Auftrag: ${game.level.chapter.config.objective}`);
    pulseMissionHud();
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
    [ui.start, ui.map, ui.pause, ui.options, ui.skills, ui.outfits, ui.inventory, ui.stickers, ui.finish, ui.tutorial].forEach((panel) => { panel.hidden = true; });
  }

  function openPanel(panel) {
    [ui.map, ui.pause, ui.options, ui.skills, ui.outfits, ui.inventory, ui.stickers, ui.finish, ui.tutorial].forEach((item) => {
      if (item !== panel) item.hidden = true;
    });
    panel.hidden = false;
  }

  function updateOptionsPanel() {
    const profile = getRenderProfile();
    ui.versionValue.textContent = `v${GAME_VERSION}`;
    ui.renderModeValue.textContent = profile.performanceMode
      ? `Flüssig · ${profile.width} × ${profile.height}`
      : `Scharf · ${profile.width} × ${profile.height}`;
  }

  function exportProgress() {
    const blob = new Blob([saveSystem.exportText(progressSnapshot())], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schorsch-spielstand-v${GAME_VERSION}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    showToast("Spielstand exportiert – die JSON-Datei kann sicher aufbewahrt werden.");
  }

  async function importProgressFile(event) {
    const [file] = event.target.files || [];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      if (!window.confirm("Soll der aktuelle Spielstand durch diese Datei ersetzt werden?")) return;
      saveSystem.importText(text);
      location.reload();
    } catch (error) {
      showToast(error?.message || "Der Spielstand konnte nicht importiert werden.");
    }
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

  function claimNewChapterRewards() {
    const rewards = newlyUnlockedChapterRewards(game.levelMedals, [...game.claimedChapterRewards]);
    for (const reward of rewards) {
      game.claimedChapterRewards.add(reward.id);
      game.wallet += reward.sparkBonus;
      game.foundItems.add(`reward:${reward.id}`);
    }
    return rewards;
  }

  function renderFinishMedals(earned, previous, elapsedSeconds, foundItems, totalItems) {
    ui.finishMedals.replaceChildren();
    const details = {
      time: `${formatTime(elapsedSeconds, true)} · Ziel ${formatTime(game.level.masteryTime, true)}`,
      collector: `${foundItems}/${totalItems} Andenken entdeckt`,
      flawless: game.runMistakes === 0 ? "Kein Leben verloren" : `${game.runMistakes} Leben verloren`,
    };
    for (const medal of MEDAL_DEFINITIONS) {
      const earnedNow = Boolean(earned[medal.key]);
      const ownedBefore = Boolean(previous?.[medal.key]);
      const card = document.createElement("article");
      card.className = `finish-medal${earnedNow ? " is-earned" : ""}${!ownedBefore && earnedNow ? " is-new" : ""}${ownedBefore && !earnedNow ? " is-owned" : ""}`;
      card.innerHTML = `<span aria-hidden="true">${medal.mark}</span><b>${medal.title}</b><small>${details[medal.key]}</small><em>${!ownedBefore && earnedNow ? "Neu verdient" : earnedNow ? "Geschafft" : ownedBefore ? "Bereits erhalten" : "Noch offen"}</em>`;
      ui.finishMedals.append(card);
    }
  }

  function completeLevel() {
    if (game.mode !== "playing") return;
    game.mode = "finished";
    const elapsedSeconds = Math.max(0, (performance.now() - game.runStartedAt) / 1000);
    const previousBest = Number(game.bestTimes[game.levelIndex]);
    const isNewBest = !Number.isFinite(previousBest) || elapsedSeconds < previousBest;
    if (isNewBest) game.bestTimes[game.levelIndex] = elapsedSeconds;
    game.completed.add(game.levelIndex);
    game.unlocked = Math.max(game.unlocked, Math.min(LEVELS.length, game.levelIndex + 2));
    const bonusRoom = game.level.secretRoom;
    const totalSparks = game.level.collectibles.length + (bonusRoom?.collectibles.length || 0);
    const foundSparks = game.level.collectibles.filter((item) => item.collected).length
      + (bonusRoom?.collectibles.filter((item) => item.collected).length || 0);
    const totalItems = expectedLevelItemCount(game.level);
    const foundItems = countFoundLevelItems(game.foundItems, game.levelIndex);
    const previousMedals = game.levelMedals[game.levelIndex] || {};
    const earnedMedals = calculateLevelMedals({
      elapsedSeconds,
      masteryTime: game.level.masteryTime,
      foundItems,
      totalItems,
      mistakes: game.runMistakes,
    });
    game.levelMedals = mergeLevelMedals(game.levelMedals, game.levelIndex, earnedMedals);
    const newMedalCount = MEDAL_DEFINITIONS.filter((medal) => earnedMedals[medal.key] && !previousMedals[medal.key]).length;
    const chapterRewards = claimNewChapterRewards();
    saveProgress();
    updateHud();
    playJingle();
    ui.finishSparkCount.textContent = `${foundSparks}/${totalSparks}`;
    ui.finishItemCount.textContent = `${foundItems}/${totalItems}`;
    ui.finishTime.textContent = formatTime(elapsedSeconds, true);
    ui.finishBestTime.textContent = formatTime(Number(game.bestTimes[game.levelIndex]), true);
    ui.finishBestTime.parentElement?.classList.toggle("is-record", isNewBest);
    renderFinishMedals(earnedMedals, previousMedals, elapsedSeconds, foundItems, totalItems);
    renderFinishStickerShop();
    ui.finishReward.hidden = chapterRewards.length === 0;
    if (chapterRewards.length) {
      const reward = chapterRewards[0];
      ui.finishReward.textContent = `${reward.mark} Kapitel gemeistert: ${reward.title} und ${reward.sparkBonus} Bergfunken freigeschaltet!`;
    }
    if (game.level.chapter) {
      ui.finishMission.hidden = false;
      const highlights = [
        isNewBest ? "★ Neuer Rekord" : "✓ Reiseauftrag erfüllt",
        newMedalCount ? `${newMedalCount} neue ${newMedalCount === 1 ? "Medaille" : "Medaillen"}` : "Meisterschaft aktualisiert",
        game.level.chapter.finale.doneLabel,
      ];
      ui.finishMission.textContent = highlights.join(" · ");
    } else {
      ui.finishMission.hidden = true;
    }
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

  function creditBergfunke(level, crystal) {
    const collectionMultiplier = Math.max(1, Number(level.bonusMultiplier) || 1);
    const claimId = `${level.index}:${crystal.id}`;
    const firstDiscovery = !game.claimedSparks.has(claimId);
    if (firstDiscovery) game.claimedSparks.add(claimId);
    game.wallet += collectionMultiplier;
    saveProgress();
    return { collectionMultiplier, firstDiscovery };
  }

  function creditWanderherz(level, life) {
    const claimId = heartClaimId(level, life);
    const firstDiscovery = !game.claimedHearts.has(claimId);
    life.collected = true;
    if (firstDiscovery) game.claimedHearts.add(claimId);
    const talentBonus = game.talents.has("extraHeart") && !game.lifeTalentUsed;
    const gained = Math.min(MAX_LIVES - game.hearts, talentBonus ? 2 : 1);
    game.hearts = Math.min(MAX_LIVES, game.hearts + gained);
    if (talentBonus) game.lifeTalentUsed = true;
    saveProgress();
    return { firstDiscovery, gained, claimId, talentBonus };
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
    const tuning = movementTuning({ underwater, onGround: player.onGround, icy, sprintTalent, sunPowered });
    if (move) {
      player.vx += move * tuning.acceleration * dt;
      player.direction = move;
    } else {
      player.vx *= Math.pow(tuning.idleDrag, dt);
    }
    player.vx = Math.max(-tuning.maxSpeed, Math.min(tuning.maxSpeed, player.vx));
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
          const feedback = landingFeedback(impact);
          player.landing = feedback.duration;
          emitSurfaceEffect(level, landingPlatform, player.x + player.w / 2, landingPlatform.y, "landing", impact);
          game.cameraKick = Math.max(game.cameraKick, feedback.cameraKick);
          game.shake = Math.max(game.shake, feedback.shake);
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
    updateChapterChallenge(level, player, dt);

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
        const { collectionMultiplier, firstDiscovery } = creditBergfunke(level, crystal);
        game.sparks += collectionMultiplier;
        level.collected += 1;
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
      const { gained, talentBonus } = creditWanderherz(level, life);
      if (gained === 0) showToast(`${MAX_LIVES} Leben – mehr passen nicht in Schorschs Rucksack!`);
      else if (talentBonus) showToast(`Wanderherz verstärkt – ${gained} Leben dazu!`);
      else showToast("Wanderherz gesammelt – ein Leben dazu!");
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
          loseHeart(`Hoppla – ${hazard.enemyName || "das Fantasiewesen"} kugelt in den Weg!`);
          return;
        }
      }
    }

    if (rectsOverlap(player, level.goal)) {
      if (level.isBonusRoom) leaveSecretRoom();
      else if (!handleLockedChapterGoal(level, player)) completeLevel();
      return;
    }
    if (player.y > H + 180) {
      if (game.talents.has("safetyNet") && !game.safetyNetUsed) {
        game.safetyNetUsed = true;
        game.runMistakes += 1;
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
    game.runMistakes += 1;
    game.hearts = Math.max(0, game.hearts - 1);
    game.shake = 0.45;
    burst(player.x + player.w / 2, player.y + player.h / 2, "#ffffff", 14, 220);
    playTone(180, 0.16, "sawtooth", 0.03, -90);
    if (game.hearts <= 0) {
      game.hearts = START_LIVES;
      saveProgress();
      game.mode = "restarting";
      updateHud();
      showToast(`Kurze Verschnaufpause – mit ${START_LIVES} Herzen beginnt das Level neu. Dein Fortschritt bleibt erhalten!`);
      playTone(120, .42, "triangle", .045, -50);
      restartTimer = window.setTimeout(() => startLevel(game.levelIndex), 950);
      return true;
    }
    saveProgress();
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
    const particleLimit = game.performanceMode ? 170 : 300;
    if (game.particles.length >= particleLimit) {
      game.particles.splice(0, game.particles.length - particleLimit + 1);
    }
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

  function isJumpHeld() {
    return held.jump || pressed.has("ArrowUp") || pressed.has("KeyW") || pressed.has("Space");
  }

  function queueJump() {
    if (game.player) game.player.jumpBuffer = 0.14;
  }

  function scheduleCanvasResize() {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
      updateOptionsPanel();
    });
  }

  function frame(now) {
    const dt = Math.min(0.1, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    debugTools.sample(dt);
    sampleRenderPerformance(dt);
    frameAccumulator = Math.min(.12, frameAccumulator + dt);
    const fixedStep = 1 / 60;
    let steps = 0;
    while (frameAccumulator >= fixedStep && steps < 6) {
      update(fixedStep);
      frameAccumulator -= fixedStep;
      steps += 1;
    }
    draw();
    debugTools.draw();
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
      if (event.code === "F3") {
        event.preventDefault();
        const enabled = debugTools.toggle();
        showToast(enabled ? "Debug-Overlay aktiv · F4 springt zum nächsten Checkpoint." : "Debug-Overlay ausgeschaltet.");
        return;
      }
      if (event.code === "F4") {
        event.preventDefault();
        if (!debugTools.state().enabled) {
          showToast("Aktiviere zuerst das Debug-Overlay mit F3.");
          return;
        }
        const label = debugTools.jumpToNextCheckpoint();
        if (label) showToast(`Debug-Sprung: ${label}`);
        return;
      }
      if (event.code === "F5") {
        event.preventDefault();
        if (!debugTools.state().enabled) {
          showToast("Aktiviere zuerst das Debug-Overlay mit F3.");
          return;
        }
        const label = debugTools.jumpToNextObjective();
        if (label) showToast(`Debug-Auftragssprung: ${label}`);
        return;
      }
      if (!pressed.has(event.code) && ["ArrowUp", "KeyW", "Space"].includes(event.code)) queueJump();
      pressed.add(event.code);
      if (event.code === "Escape" || event.code === "KeyP") {
        if (game.mode === "playing") pauseGame();
        else if (game.mode === "paused" && !ui.tutorial.hidden) closeChapterTutorial();
        else if (game.mode === "paused") resumeGame();
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
    document.querySelector("#stickerButton").addEventListener("click", () => {
      renderStickerAlbum();
      openOverlay(ui.stickers);
    });
    document.querySelector("#menuStickerButton").addEventListener("click", () => {
      renderStickerAlbum();
      openOverlay(ui.stickers);
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
      if (game.mode === "playing") pauseGame();
      else if (game.mode === "paused" && !ui.tutorial.hidden) closeChapterTutorial();
      else if (game.mode === "paused") resumeGame();
    });
    ui.optionsButton.addEventListener("click", () => {
      updateOptionsPanel();
      openOverlay(ui.options);
    });
    ui.exportSaveButton.addEventListener("click", exportProgress);
    ui.importSaveButton.addEventListener("click", () => ui.importSaveInput.click());
    ui.importSaveInput.addEventListener("change", importProgressFile);
    ui.stickerPackButton.addEventListener("click", openStickerPack);
    ui.stickerBuyButton.addEventListener("click", () => buySticker());
    ui.finishStickerAlbumButton.addEventListener("click", () => {
      renderStickerAlbum([...game.recentStickerIds][0]);
      openOverlay(ui.stickers);
    });
    ui.tutorialButton.addEventListener("click", closeChapterTutorial);
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

  function validateCampaignChapters() {
    if (CAMPAIGN_CHAPTERS.length !== LEVELS.length) {
      throw new Error(`Reiseaufträge unvollständig: ${CAMPAIGN_CHAPTERS.length}/${LEVELS.length}`);
    }
    const finaleTypes = new Set(["charge", "sequence", "escape"]);
    CAMPAIGN_CHAPTERS.forEach((config, index) => {
      const hasThreeNodes = config.nodeRatios?.length === 3 && config.nodeNames?.length === 3;
      const hasText = [config.title, config.objective, config.objectiveDone, config.finalTitle, config.finalHint, config.finalDone]
        .every((value) => typeof value === "string" && value.trim());
      const timedFinaleIsValid = config.finaleType === "charge" || Number(config.duration) > 0;
      const bossIsValid = config.bossHits == null
        || (["sequence", "escape"].includes(config.finaleType)
          && Number.isInteger(config.bossHits)
          && config.bossHits > 0
          && String(config.bossName || "").trim()
          && Boolean(BOSS_PROFILES[config.bossKind]));
      if (!hasThreeNodes || !hasText || !finaleTypes.has(config.finaleType) || !timedFinaleIsValid || !bossIsValid) {
        throw new Error(`Ungültiger Reiseauftrag für Level ${index + 1}: ${LEVELS[index]?.name || "Unbekannt"}`);
      }
    });
  }

  function installTestApi() {
    if (!TEST_MODE) return;

    function collectEverything(level) {
      for (const collectible of level.collectibles || []) collectible.collected = true;
      for (const item of level.items || []) {
        item.collected = true;
        game.foundItems.add(`${level.index}:${item.id}`);
      }
      if (level.secretEntrance) {
        level.secret.found = true;
        level.secretRoom ||= createSecretRoom(level);
        for (const collectible of level.secretRoom.collectibles || []) collectible.collected = true;
        for (const item of level.secretRoom.items || []) {
          item.collected = true;
          game.foundItems.add(`${level.index}:${item.id}`);
        }
      }
    }

    function prepareLevel(index) {
      game.tutorialsSeen.add(index);
      startLevel(index);
      if (game.level.chapter) {
        game.level.chapter.task.nodes.forEach((node) => { node.active = true; });
        game.level.chapter.task.progress = game.level.chapter.task.nodes.length;
        game.level.chapter.task.complete = true;
        game.level.chapter.finale.state = "complete";
      }
      game.mode = "playing";
      return game.level;
    }

    window.__SCHORSCH_TEST_API__ = {
      levelCount: LEVELS.length,
      bossLevelIndexes: CAMPAIGN_CHAPTERS
        .map((chapter, index) => chapter.bossHits ? index : -1)
        .filter((index) => index >= 0),
      finishLevel(index, { elapsedSeconds = LEVELS[index].masteryTime - 1, collectAll = true, mistakes = 0 } = {}) {
        const level = prepareLevel(index);
        if (collectAll) collectEverything(level);
        game.runMistakes = mistakes;
        game.runStartedAt = performance.now() - elapsedSeconds * 1000;
        completeLevel();
        return this.snapshot();
      },
      defeatBoss(index) {
        const level = prepareLevel(index);
        const finale = level.chapter?.finale;
        const boss = finale?.boss;
        if (!boss) throw new Error(`Level ${index + 1} besitzt keinen Endgegner.`);
        finale.state = "active";
        resetChapterBoss(finale);
        boss.active = true;
        for (let hit = 0; hit < boss.maxHp; hit += 1) {
          damageBoss(boss);
          boss.invincible = 0;
        }
        if (boss.defeated) completeChapterFinale(level);
        return { name: boss.name, hp: boss.hp, defeated: boss.defeated, finale: finale.state };
      },
      collectSpark(index) {
        const level = prepareLevel(index);
        const crystal = level.collectibles[0];
        const before = game.wallet;
        crystal.collected = true;
        const result = creditBergfunke(level, crystal);
        updateHud();
        return { before, after: game.wallet, ...result };
      },
      collectHeart(index) {
        const level = prepareLevel(index);
        const life = (level.lifePickups || []).find((pickup) => !pickup.collected);
        const before = game.hearts;
        if (!life) return { before, after: game.hearts, firstDiscovery: false, gained: 0 };
        const result = creditWanderherz(level, life);
        updateHud();
        return { before, after: game.hearts, ...result };
      },
      rescueAtZero(index) {
        prepareLevel(index);
        const before = this.snapshot();
        game.hearts = 1;
        game.player.invincible = 0;
        loseHeart("Testtreffer.");
        const after = this.snapshot();
        const saved = saveSystem.load();
        clearTimeout(restartTimer);
        restartTimer = 0;
        return { before, after, saved };
      },
      openStickerPack() {
        const beforeWallet = game.wallet;
        const beforeCount = game.ownedStickers.size;
        const rewards = openStickerPack();
        return {
          beforeWallet,
          afterWallet: game.wallet,
          beforeCount,
          afterCount: game.ownedStickers.size,
          rewards: rewards.map((sticker) => sticker.id),
        };
      },
      buySticker(stickerId = null) {
        const target = stickerId
          ? STICKERS.find((sticker) => sticker.id === stickerId)
          : STICKERS.find((sticker) => !game.ownedStickers.has(sticker.id));
        if (!target) return null;
        const beforeWallet = game.wallet;
        const beforeCount = game.ownedStickers.size;
        const purchased = buySticker(target.id);
        return {
          id: target.id,
          price: target.price,
          rarity: target.rarity,
          beforeWallet,
          afterWallet: game.wallet,
          beforeCount,
          afterCount: game.ownedStickers.size,
          purchased: Boolean(purchased),
        };
      },
      visitLevel(index) {
        prepareLevel(index);
        return this.snapshot();
      },
      collectionLayout(index) {
        const level = createLevel(index);
        const secretRoom = level.secretEntrance ? createSecretRoom(level) : null;
        return {
          overlaps: collectionOverlapCount(level) + (secretRoom ? collectionOverlapCount(secretRoom) : 0),
          overlapDetails: [...collectionOverlapPairs(level), ...(secretRoom ? collectionOverlapPairs(secretRoom) : [])],
          hearts: (level.lifePickups || []).length,
          secretHearts: (secretRoom?.lifePickups || []).length,
          sparks: (level.collectibles || []).length,
          secretSparks: (secretRoom?.collectibles || []).length,
          enemyKinds: [...new Set([...(level.hazards || []), ...(secretRoom?.hazards || [])]
            .filter((hazard) => hazard.kind !== "sunBoost")
            .map((hazard) => hazard.enemyKind))],
          enemies: (level.hazards || []).filter((hazard) => hazard.kind !== "sunBoost").length,
          secretEnemies: (secretRoom?.hazards || []).filter((hazard) => hazard.kind !== "sunBoost").length,
          objects: collectionObjects(level).length + (secretRoom ? collectionObjects(secretRoom).length : 0),
          souvenirs: [...(level.items || []), ...(secretRoom?.items || [])].map((item) => item.name),
        };
      },
      snapshot() {
        return {
          mode: game.mode,
          levelIndex: game.levelIndex,
          unlocked: game.unlocked,
          completed: [...game.completed],
          levelMedals: JSON.parse(JSON.stringify(game.levelMedals)),
          claimedChapterRewards: [...game.claimedChapterRewards],
          ownedStickers: [...game.ownedStickers],
          wallet: game.wallet,
          hearts: game.hearts,
          claimedHearts: [...game.claimedHearts],
          souvenirs: [...game.foundItems].filter((entry) => !String(entry).startsWith("reward:")).length,
          finishMedals: [...ui.finishMedals.children].map((element) => ({
            className: element.className,
            text: element.textContent,
          })),
          finishStickerShop: {
            hidden: ui.finishStickers.hidden,
            images: ui.finishStickerGrid.querySelectorAll("img").length,
            text: ui.finishStickers.textContent,
          },
        };
      },
    };
  }

  function init() {
    validateCampaignChapters();
    if (!game.itemOnlyMigrationDone) {
      for (const [id, refund] of Object.entries(LEGACY_OUTFIT_REFUNDS)) {
        if (game.ownedItems.delete(id)) game.wallet += refund;
        game.equippedItems.delete(id);
      }
      game.itemOnlyMigrationDone = true;
    }
    game.ownedItems = new Set([...game.ownedItems].filter((id) => HAND_ITEMS.some((item) => item.id === id)));
    game.equippedItems = new Set([...game.equippedItems]
      .filter((id) => game.ownedItems.has(id) && HAND_ITEMS.some((item) => item.id === id))
      .slice(0, 1));
    game.ownedTalents = new Set([...game.ownedTalents].filter((id) => TALENTS.some((talent) => talent.id === id)));
    game.talents = new Set([...game.talents]
      .filter((id) => game.ownedTalents.has(id))
      .slice(0, MAX_ACTIVE_TALENTS));
    game.claimedChapterRewards = new Set([...game.claimedChapterRewards]
      .filter((id) => CHAPTER_REWARDS.some((reward) => reward.id === id)));
    game.foundItems = new Set(normalizeFoundItems([...game.foundItems], LEVELS));
    game.ownedStickers = new Set(normalizeStickerIds([...game.ownedStickers]));
    for (const rewardId of game.claimedChapterRewards) game.foundItems.add(`reward:${rewardId}`);
    claimNewChapterRewards();
    bindControls();
    bindUi();
    resizeCanvas();
    updateOptionsPanel();
    updateHud();
    game.level = createLevel(game.levelIndex);
    stage.classList.toggle("is-underwater", Boolean(game.level.underwater));
    game.player = createPlayer(game.level.start, game.level.underwater);
    game.mode = "menu";
    saveProgress();
    installTestApi();
    window.addEventListener("resize", scheduleCanvasResize, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleCanvasResize, { passive: true });
    document.addEventListener("fullscreenchange", scheduleCanvasResize);
    document.addEventListener("webkitfullscreenchange", scheduleCanvasResize);
    if ("ResizeObserver" in window) {
      stageResizeObserver = new ResizeObserver(scheduleCanvasResize);
      stageResizeObserver.observe(stage);
    }
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
