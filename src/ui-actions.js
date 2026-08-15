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
      const bestTime = Number(game.bestTimes[index]);
      button.innerHTML = `<span class="level-number">${level.bonus ? "★" : index + 1}</span><b>${level.short}</b><small>${level.subtitle}</small>${Number.isFinite(bestTime) ? `<small class="level-best">Bestzeit · ${formatTime(bestTime, true)}</small>` : ""}`;
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
      renderLevelGrid,
    };
  }

  Object.assign(window.SchorschGame ||= {}, { createUiActions });
})();
