(() => {
  "use strict";

  function createUiActions(runtime) {
    const {
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
    } = runtime;
    let toastTimer = 0;
    let activeStickerFilter = "all";
    let activeStickerSelectionId = null;

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ui.toast.classList.remove("is-visible"), 2400);
  }

  function travelSouvenirEntries(foundItems) {
    return [...(foundItems || [])].filter((entry) => !String(entry).startsWith("reward:"));
  }

  function updateHud() {
    ui.sparkCount.textContent = game.wallet;
    ui.itemCount.textContent = travelSouvenirEntries(game.foundItems).length;
    ui.shopWallet.textContent = game.wallet;
    ui.skillsWallet.textContent = game.wallet;
    game.hearts = Math.max(0, Math.min(MAX_LIVES, game.hearts));
    ui.heartCount.textContent = game.hearts;
    ui.heartCount.parentElement?.setAttribute("aria-label", `${game.hearts} von maximal ${MAX_LIVES} Leben`);
    ui.levelName.textContent = game.level?.name || LEVELS[game.levelIndex].name;
    ui.sound.textContent = game.sound ? "♪" : "×";
    ui.sound.setAttribute("aria-label", game.sound ? "Ton ausschalten" : "Ton einschalten");
    updateMissionHud(game.level);
  }

  function updateMissionHud(level) {
    const chapter = level?.chapter;
    if (!chapter || level.isBonusRoom || game.mode === "menu") {
      ui.missionHud.hidden = true;
      return;
    }
    const { task, finale, config } = chapter;
    ui.missionHud.hidden = false;
    ui.missionHud.style.setProperty("--chapter-accent", config.accent);
    ui.missionHud.classList.toggle("is-finale", task.complete && finale.state !== "complete");

    let progress = task.nodes.length ? task.progress / task.nodes.length : 0;
    if (!task.complete) {
      ui.missionKicker.textContent = `Reiseauftrag · Level ${level.index + 1}`;
      ui.missionTitle.textContent = config.shortTitle;
      ui.missionStatus.textContent = `${task.progress} / ${task.nodes.length}`;
    } else if (finale.state === "complete") {
      progress = 1;
      ui.missionKicker.textContent = "Auftrag vollständig";
      ui.missionTitle.textContent = finale.doneLabel;
      ui.missionStatus.textContent = "✓";
    } else if (finale.state === "active") {
      ui.missionKicker.textContent = `Finale · ${finale.title}`;
      ui.missionTitle.textContent = finale.activeLabel;
      if (finale.boss?.active && !finale.boss.defeated) {
        progress = finale.boss.maxHp ? (finale.boss.maxHp - finale.boss.hp) / finale.boss.maxHp : 0;
        ui.missionStatus.textContent = finale.boss.engaged
          ? `♥ ${finale.boss.hp} · Kampf`
          : `♥ ${finale.boss.hp} · ${Math.ceil(finale.remaining)} s`;
      } else if (finale.type === "charge") {
        progress = finale.charge / 1.6;
        ui.missionStatus.textContent = `${Math.round(progress * 100)} %`;
      } else if (finale.type === "sequence") {
        progress = finale.nodes.length ? finale.progress / finale.nodes.length : 0;
        ui.missionStatus.textContent = `${finale.progress}/${finale.nodes.length} · ${Math.ceil(finale.remaining)} s`;
      } else {
        progress = finale.duration ? 1 - finale.remaining / finale.duration : 0;
        ui.missionStatus.textContent = `${Math.ceil(finale.remaining)} s`;
      }
    } else {
      progress = 1;
      ui.missionKicker.textContent = "Finale bereit";
      ui.missionTitle.textContent = finale.title;
      ui.missionStatus.textContent = "→";
    }
    ui.missionProgress.style.setProperty("--mission-progress", `${Math.max(0, Math.min(1, progress)) * 100}%`);
  }

  function renderOutfitShop() {
    ui.outfitGrid.replaceChildren();
    for (const [category, label] of Object.entries(ITEM_CATEGORIES)) {
      const section = document.createElement("section");
      section.className = "outfit-category";
      section.innerHTML = `<div class="outfit-category-heading"><h3>${label}</h3><small>Maximal 1 in der Hand</small></div><div class="outfit-category-grid"></div>`;
      const grid = section.querySelector(".outfit-category-grid");
      for (const outfit of HAND_ITEMS.filter((item) => item.category === category)) {
        const owned = game.ownedItems.has(outfit.id);
        const equipped = game.equippedItems.has(outfit.id);
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
            ${owned ? (equipped ? "Weglegen" : "In die Hand nehmen") : `Kaufen · ${outfit.price} ◆`}
          </button>`;
        renderOutfitVariantInto(card.querySelector(".outfit-card-avatar"), singleOutfitLoadout(outfit));
        card.querySelector("button").addEventListener("click", () => chooseOutfit(outfit));
        grid.append(card);
      }
      ui.outfitGrid.append(section);
    }
    renderOutfitVariantInto(ui.outfitPreviewCanvas, currentOutfitLoadout());
    ui.previewLoadout.textContent = [...game.equippedItems]
      .map((id) => HAND_ITEMS.find((item) => item.id === id)?.name)
      .filter(Boolean)
      .join(" · ") || "Kein Item ausgewählt";
    updateHud();
  }

  function chooseOutfit(outfit) {
    if (!game.ownedItems.has(outfit.id)) {
      if (game.wallet < outfit.price) {
        showToast(`Noch ${outfit.price - game.wallet} Bergfunken bis zum ${outfit.name}.`);
        return;
      }
      game.wallet -= outfit.price;
      game.ownedItems.add(outfit.id);
      unequipCategory(outfit.category);
      game.equippedItems.add(outfit.id);
      showToast(`${outfit.name} gekauft und in die Hand genommen!`);
      playTone(520, .11, "sine", .04, 180);
    } else if (game.equippedItems.has(outfit.id)) {
      game.equippedItems.delete(outfit.id);
      showToast(`${outfit.name} weggelegt.`);
    } else {
      unequipCategory(outfit.category);
      game.equippedItems.add(outfit.id);
      showToast(`${outfit.name} in die Hand genommen.`);
      playTone(440, .08, "sine", .03, 90);
    }
    saveProgress();
    renderOutfitShop();
  }

  function unequipCategory(category) {
    for (const item of HAND_ITEMS) {
      if (item.category === category) game.equippedItems.delete(item.id);
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
    if (entry.startsWith("reward:")) {
      const reward = CHAPTER_REWARDS.find((item) => item.id === entry.slice("reward:".length));
      if (reward) return { name: reward.title, type: "mastery", mark: reward.mark, color: reward.color, where: `${reward.subtitle} · alle Medaillen` };
    }
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
    const entries = travelSouvenirEntries(game.foundItems).sort((a, b) => a.localeCompare(b, "de"));
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
      card.innerHTML = `<span class="inventory-icon" aria-hidden="true">${item.mark || inventoryMark(item.type)}</span><b>${item.name}</b><small>${item.where}</small>`;
      ui.inventoryGrid.append(card);
    }
  }

  function showStickerPreview(sticker) {
    if (!sticker) return;
    const owned = game.ownedStickers.has(sticker.id);
    const category = STICKER_CATEGORIES[sticker.category];
    activeStickerSelectionId = sticker.id;
    const placeholder = ui.stickerPreviewCard.querySelector(".sticker-preview-art > span");
    placeholder.hidden = true;
    ui.stickerPreviewImage.hidden = false;
    ui.stickerPreviewImage.src = sticker.image;
    ui.stickerPreviewImage.alt = `${sticker.name}, Sticker aus ${category.longLabel}`;
    ui.stickerPreviewNumber.textContent = `Nr. ${String(sticker.number).padStart(3, "0")} · ${sticker.rarity === "legendary" ? "Legendär" : sticker.rarity === "holo" ? "Holo" : sticker.rarity === "shiny" ? "Glitzer" : "Sammlung"}`;
    ui.stickerPreviewName.textContent = sticker.name;
    ui.stickerPreviewCategory.textContent = `${category.mark} ${category.longLabel}`;
    ui.stickerPreviewDescription.textContent = sticker.description;
    ui.stickerPreviewCard.classList.toggle("is-premium", sticker.price >= 22);
    ui.stickerPreviewCard.classList.toggle("is-legendary", sticker.rarity === "legendary");
    ui.stickerBuyButton.disabled = owned;
    ui.stickerBuyButton.textContent = owned ? "Gesammelt ✓" : `Kaufen · ${sticker.price} ◆`;
  }

  function renderStickerFilters(counts) {
    ui.stickerFilters.replaceChildren();
    const filters = [
      { id: "all", label: "Alle", mark: "★", color: "#b44859", owned: game.ownedStickers.size, total: STICKERS.length },
      ...Object.values(STICKER_CATEGORIES).map((category) => ({ ...category, ...counts[category.id] })),
    ];
    for (const filter of filters) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `sticker-filter${activeStickerFilter === filter.id ? " is-active" : ""}`;
      button.style.setProperty("--filter-color", filter.color);
      button.innerHTML = `<i aria-hidden="true">${filter.mark}</i>${filter.label} <small>${filter.owned}/${filter.total}</small>`;
      button.addEventListener("click", () => {
        activeStickerFilter = filter.id;
        renderStickerAlbum();
      });
      ui.stickerFilters.append(button);
    }
  }

  function renderStickerAlbum(selectedStickerId = null) {
    const ownedCount = game.ownedStickers.size;
    const remaining = STICKERS.length - ownedCount;
    const counts = stickerCategoryCounts([...game.ownedStickers]);
    ui.stickerCount.textContent = ownedCount;
    ui.stickerWallet.textContent = game.wallet;
    ui.stickerProgressBar.style.width = `${ownedCount / STICKERS.length * 100}%`;
    ui.stickerProgressText.textContent = remaining
      ? `Noch ${remaining} ${remaining === 1 ? "Motiv" : "Motive"} bis zum vollständigen Album`
      : "Album vollständig · alle 100 Energie-Sticker gesammelt!";
    ui.stickerPackButton.disabled = remaining === 0;
    ui.stickerPackButton.textContent = remaining === 0 ? "Album vollständig ✓" : `3er-Pack · ${STICKER_PACK_COST} ◆`;
    renderStickerFilters(counts);

    ui.stickerGrid.replaceChildren();
    const stickers = activeStickerFilter === "all"
      ? STICKERS
      : STICKERS.filter((sticker) => sticker.category === activeStickerFilter);
    for (const sticker of stickers) {
      const owned = game.ownedStickers.has(sticker.id);
      const category = STICKER_CATEGORIES[sticker.category];
      const button = document.createElement("button");
      button.type = "button";
      button.className = `sticker-card${owned ? "" : " is-locked"}${sticker.rarity !== "standard" ? " is-shiny" : ""}${sticker.price >= 22 ? " is-premium" : ""}${sticker.rarity === "legendary" ? " is-legendary" : ""}${game.recentStickerIds?.has(sticker.id) ? " is-new" : ""}`;
      button.style.setProperty("--sticker-color", category.color);
      button.setAttribute("aria-label", owned ? `${sticker.name} ansehen` : `${sticker.name} für ${sticker.price} Bergfunken auswählen`);
      button.innerHTML = `<span>${String(sticker.number).padStart(3, "0")}</span><img src="${sticker.image}" alt="" loading="lazy" decoding="async" /><b>${sticker.name}</b><em>${owned ? "Gesammelt" : `${sticker.price} ◆`}</em>`;
      button.addEventListener("click", () => showStickerPreview(sticker));
      ui.stickerGrid.append(button);
    }

    const selected = STICKERS.find((sticker) => sticker.id === selectedStickerId)
      || STICKERS.find((sticker) => sticker.id === activeStickerSelectionId)
      || STICKERS.find((sticker) => game.ownedStickers.has(sticker.id))
      || stickers[0];
    if (selected) showStickerPreview(selected);
  }

  function buySticker(stickerId = activeStickerSelectionId) {
    const sticker = STICKERS.find((entry) => entry.id === stickerId);
    if (!sticker) return null;
    if (game.ownedStickers.has(sticker.id)) {
      showToast(`${sticker.name} ist bereits in deinem Album.`);
      return null;
    }
    if (game.wallet < sticker.price) {
      showToast(`Noch ${sticker.price - game.wallet} Bergfunken bis zu ${sticker.name}.`);
      return null;
    }
    game.wallet -= sticker.price;
    game.ownedStickers.add(sticker.id);
    game.recentStickerIds = new Set([sticker.id]);
    saveProgress();
    updateHud();
    playTone(sticker.price >= 22 ? 760 : 620, .16, "sine", .045, sticker.price >= 22 ? 360 : 220);
    renderStickerAlbum(sticker.id);
    showToast(`${sticker.name} gekauft · ${sticker.price} Bergfunken.`);
    return sticker;
  }

  function openStickerPack() {
    const rewards = nextStickerRewards([...game.ownedStickers], STICKER_PACK_SIZE);
    if (!rewards.length) {
      showToast("Dein Stickeralbum ist bereits vollständig!");
      return [];
    }
    if (game.wallet < STICKER_PACK_COST) {
      showToast(`Noch ${STICKER_PACK_COST - game.wallet} Bergfunken bis zum nächsten Stickerpack.`);
      return [];
    }
    game.wallet -= STICKER_PACK_COST;
    rewards.forEach((sticker) => game.ownedStickers.add(sticker.id));
    game.recentStickerIds = new Set(rewards.map((sticker) => sticker.id));
    saveProgress();
    updateHud();
    ui.stickerPackButton.closest(".sticker-pack-card")?.classList.remove("is-opening");
    requestAnimationFrame(() => ui.stickerPackButton.closest(".sticker-pack-card")?.classList.add("is-opening"));
    playTone(620, .14, "sine", .045, 300);
    renderStickerAlbum(rewards[0].id);
    showToast(`${rewards.length} neue Sticker: ${rewards.map((sticker) => sticker.name).join(", ")}!`);
    return rewards;
  }

  function renderFinishStickerShop() {
    ui.finishStickerGrid.replaceChildren();
    ui.finishStickers.hidden = false;
    ui.finishStickerTitle.textContent = "Bergfunken gegen Wunschmotive";
    const wallet = document.createElement("strong");
    wallet.className = "finish-sticker-wallet";
    wallet.textContent = `${game.wallet} ◆`;
    wallet.setAttribute("aria-label", `${game.wallet} Bergfunken verfügbar`);
    ui.finishStickerGrid.append(wallet);
  }

  function renderChapterRewards() {
    ui.chapterRewards.replaceChildren();
    for (const reward of chapterRewardStatuses(game.levelMedals, [...game.claimedChapterRewards])) {
      const card = document.createElement("article");
      card.className = `chapter-reward${reward.claimed ? " is-claimed" : ""}`;
      card.style.setProperty("--reward-color", reward.color);
      card.innerHTML = `<span aria-hidden="true">${reward.mark}</span><div><b>${reward.title}</b><small>${reward.earnedMedals}/${reward.requiredMedals} Medaillen · ${reward.sparkBonus} ◆</small></div><em>${reward.claimed ? "Freigeschaltet" : "Noch offen"}</em>`;
      ui.chapterRewards.append(card);
    }
  }

  function renderLevelGrid() {
    ui.levelGrid.replaceChildren();
    const totalPossible = LEVELS.length * MEDAL_DEFINITIONS.length;
    const totalEarned = medalCount(game.levelMedals, LEVELS.map((_, index) => index));
    ui.totalMedalCount.textContent = totalEarned;
    ui.totalMedalProgress.style.width = `${totalPossible ? totalEarned / totalPossible * 100 : 0}%`;
    renderChapterRewards();
    LEVELS.forEach((level, index) => {
      const button = document.createElement("button");
      const locked = index >= game.unlocked;
      button.type = "button";
      button.className = `level-card${level.bonus ? " is-bonus" : ""}${game.completed.has(index) ? " is-complete" : ""}${index === game.levelIndex ? " is-current" : ""}${locked ? " is-locked" : ""}`;
      button.style.setProperty("--level-color", level.accent);
      button.disabled = locked;
      const bestTime = Number(game.bestTimes[index]);
      const medals = normalizeMedalRecord(game.levelMedals[index]);
      const medalMarks = MEDAL_DEFINITIONS.map((medal) => `<i class="${medals[medal.key] ? "is-earned" : ""}" title="${medal.title}" aria-label="${medal.title}: ${medals[medal.key] ? "verdient" : "offen"}">${medal.mark}</i>`).join("");
      button.innerHTML = `<span class="level-number">${level.bonus ? "★" : index + 1}</span><b>${level.short}</b><small>${level.subtitle}</small><span class="level-medals">${medalMarks}</span><small class="level-target">Meisterzeit · ${formatTime(level.masteryTime, true)}</small>${Number.isFinite(bestTime) ? `<small class="level-best">Bestzeit · ${formatTime(bestTime, true)}</small>` : ""}`;
      button.addEventListener("click", () => startLevel(index));
      ui.levelGrid.append(button);
    });
  }


    return {
      showToast,
      updateHud,
      updateMissionHud,
      renderOutfitShop,
      renderSkillTree,
      renderInventory,
      renderStickerAlbum,
      buySticker,
      openStickerPack,
      renderFinishStickerShop,
      renderLevelGrid,
    };
  }

  Object.assign(window.SchorschGame ||= {}, { createUiActions });
})();
