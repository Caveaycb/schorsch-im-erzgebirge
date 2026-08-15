(() => {
  "use strict";

  function collectUi(doc = document) {
    return {
    loading: doc.querySelector("#loadingScreen"),
    start: doc.querySelector("#startPanel"),
    map: doc.querySelector("#mapPanel"),
    pause: doc.querySelector("#pausePanel"),
    skills: doc.querySelector("#skillsPanel"),
    outfits: doc.querySelector("#outfitPanel"),
    finish: doc.querySelector("#finishPanel"),
    levelGrid: doc.querySelector("#levelGrid"),
    sparkCount: doc.querySelector("#sparkCount"),
    itemCount: doc.querySelector("#itemCount"),
    heartCount: doc.querySelector("#heartCount"),
    levelName: doc.querySelector("#levelName"),
    finishSparkCount: doc.querySelector("#finishSparkCount"),
    finishItemCount: doc.querySelector("#finishItemCount"),
    finishTime: doc.querySelector("#finishTime"),
    finishBestTime: doc.querySelector("#finishBestTime"),
    finishMission: doc.querySelector("#finishMission"),
    finishText: doc.querySelector("#finishText"),
    nextLevel: doc.querySelector("#nextLevelButton"),
    toast: doc.querySelector("#toast"),
    playerName: doc.querySelector("#playerName"),
    characterPreview: doc.querySelector("#characterPreview"),
    outfitGrid: doc.querySelector("#outfitGrid"),
    outfitPreviewCanvas: doc.querySelector("#outfitPreviewCanvas"),
    shopWallet: doc.querySelector("#shopWallet"),
    previewLoadout: doc.querySelector("#previewLoadout"),
    skillTree: doc.querySelector("#skillTree"),
    skillSlots: doc.querySelector("#skillSlots"),
    skillsWallet: doc.querySelector("#skillsWallet"),
    inventory: doc.querySelector("#inventoryPanel"),
    inventoryGrid: doc.querySelector("#inventoryGrid"),
    inventoryCount: doc.querySelector("#inventoryCount"),
    sound: doc.querySelector("#soundButton"),
    startButton: doc.querySelector("#startButton"),
    missionHud: doc.querySelector("#missionHud"),
    missionKicker: doc.querySelector("#missionKicker"),
    missionTitle: doc.querySelector("#missionTitle"),
    missionStatus: doc.querySelector("#missionStatus"),
    missionProgress: doc.querySelector("#missionProgress"),
    chapterBanner: doc.querySelector("#chapterBanner"),
    chapterBannerKicker: doc.querySelector("#chapterBannerKicker"),
    chapterBannerText: doc.querySelector("#chapterBannerText"),
    feedbackFlash: doc.querySelector("#feedbackFlash"),
    tutorial: doc.querySelector("#tutorialPanel"),
    tutorialKicker: doc.querySelector("#tutorialKicker"),
    tutorialMark: doc.querySelector("#tutorialMark"),
    tutorialTitle: doc.querySelector("#tutorialTitle"),
    tutorialText: doc.querySelector("#tutorialText"),
    tutorialFinal: doc.querySelector("#tutorialFinal"),
    tutorialControls: doc.querySelector("#tutorialControls"),
    tutorialButton: doc.querySelector("#tutorialButton"),
    };
  }

  function formatTime(seconds, precise = false) {
    if (!Number.isFinite(seconds)) return "–";
    const minutes = Math.floor(seconds / 60);
    const wholeSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    const tenths = Math.floor((seconds % 1) * 10);
    return precise ? `${minutes}:${wholeSeconds},${tenths}` : `${minutes}:${wholeSeconds}`;
  }

  Object.assign(window.SchorschGame ||= {}, { collectUi, formatTime });
})();
