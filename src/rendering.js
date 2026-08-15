(() => {
  "use strict";

  const { groundAt, hash, wrap } = window.SchorschGame;

  function computeCanvasMetrics(width, height, deviceDpr = 1, fullscreen = false) {
    const cssWidth = Math.max(1, Number(width) || 1);
    const cssHeight = Math.max(1, Number(height) || 1);
    const sourceDpr = Math.max(1, Number(deviceDpr) || 1);
    const dprLimit = fullscreen ? 1.25 : 1.75;
    const pixelBudget = fullscreen ? 2300000 : 3200000;
    const budgetDpr = Math.sqrt(pixelBudget / (cssWidth * cssHeight));
    const dpr = Math.max(.45, Math.min(sourceDpr, dprLimit, budgetDpr));
    return {
      width: Math.max(1, Math.round(cssWidth * dpr)),
      height: Math.max(1, Math.round(cssHeight * dpr)),
      dpr,
      fullscreen,
      performanceMode: fullscreen || dpr + .04 < Math.min(sourceDpr, 1.75),
    };
  }

  function createRenderer(runtime) {
    const {
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
    } = runtime;
    let renderProfile = computeCanvasMetrics(canvas.width, canvas.height, 1, false);

    function groundAtOrNearest(level, x) {
      const directGround = groundAt(level, x);
      if (directGround) return directGround;
      const grounds = level.platforms.filter((platform) => platform.ground);
      return grounds.reduce((nearest, candidate) => {
        const candidateDistance = Math.abs(candidate.x + candidate.w * .5 - x);
        const nearestDistance = Math.abs(nearest.x + nearest.w * .5 - x);
        return candidateDistance < nearestDistance ? candidate : nearest;
      });
    }

  function draw() {
    ctx.save();
    const scale = canvas.height / H;
    const visibleWidth = getViewWidth();
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, visibleWidth, H);

    const shakeX = game.shake ? Math.sin(game.time * 70) * game.shake * 12 : 0;
    const shakeY = game.shake ? Math.cos(game.time * 55) * game.shake * 7 : 0;
    ctx.translate(shakeX, shakeY - game.cameraY - game.cameraKick);
    const level = game.level || createLevel(game.levelIndex);
    drawBackground(level);
    drawWorld(level);
    drawForegroundDepth(level);
    ctx.restore();
  }

  function drawBackground(level) {
    const visibleWidth = getViewWidth();
    const night = level.mood === "night";
    const backdropKey = level.backdrop || (level.mood === "mine" ? "mine" : night ? "night" : "day");
    const backdrop = getBackdropImage(backdropKey) || getBackdropImage("day");

    if (backdrop.complete && backdrop.naturalWidth) {
      drawGeneratedBackdrop(backdrop, level, visibleWidth);
      if (level.underwater) drawUnderwaterAtmosphere(level);
      else drawAtmosphere(level, night);
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, level.sky[0]);
    gradient.addColorStop(1, level.sky[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(-20, -20, visibleWidth + 40, H + 40);

    const sunX = visibleWidth * 0.8 - game.cameraX * 0.018;
    const sunY = night ? 105 : 92;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 86);
    sunGlow.addColorStop(0, night ? "#fff4c8" : "#fff7cc");
    sunGlow.addColorStop(1, "rgba(255,244,190,0)");
    ctx.fillStyle = sunGlow;
    ctx.beginPath(); ctx.arc(sunX, sunY, 86, 0, TAU); ctx.fill();
    ctx.fillStyle = night ? "#f7e8bd" : "#f6c759";
    ctx.beginPath(); ctx.arc(sunX, sunY, night ? 24 : 34, 0, TAU); ctx.fill();

    if (night) drawStars();
    drawClouds(level, 0.08, 0.55);
    drawMountainLayer(level, 0.08, 400, night ? "#48566a" : "#779f92", 175, 1);
    drawRegionalLandmark(level);
    drawMountainLayer(level, 0.18, 500, night ? "#344c52" : "#567f68", 125, 2);
    drawForestLayer(level, 0.28, 545, night ? "#253e3c" : "#345f49");
    ctx.fillStyle = night ? "rgba(26,44,55,.24)" : "rgba(255,248,225,.12)";
    ctx.fillRect(0, 0, visibleWidth, H);
    if (level.underwater) drawUnderwaterAtmosphere(level);
    else drawAtmosphere(level, night);
  }

  function drawUnderwaterAtmosphere(level) {
    const visibleWidth = getViewWidth();
    ctx.save();
    const wash = ctx.createLinearGradient(0, 0, 0, H);
    wash.addColorStop(0, "rgba(54,191,205,.10)");
    wash.addColorStop(.55, "rgba(10,104,121,.14)");
    wash.addColorStop(1, "rgba(4,42,55,.28)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, visibleWidth, H);

    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = "rgba(151,245,240,.12)";
    ctx.lineWidth = 18;
    for (let i = -2; i < 8; i += 1) {
      const x = i * 230 - (game.cameraX * .035 % 230) + Math.sin(game.time * .45 + i) * 30;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 65, 250, x + 115, 510);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
    const bubbleCount = renderProfile.performanceMode ? 18 : 32;
    for (let i = 0; i < bubbleCount; i += 1) {
      const drift = game.time * (10 + i % 4 * 4);
      const x = wrap(hash(i * 43 + level.index) * visibleWidth - game.cameraX * .025 + Math.sin(game.time + i) * 12, -20, visibleWidth + 20);
      const y = wrap(690 - hash(i * 71) * 640 - drift, 35, 690);
      const radius = 1.5 + (i % 4) * .75;
      ctx.globalAlpha = .22 + (i % 3) * .09;
      ctx.strokeStyle = "#baf8f4";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawGeneratedBackdrop(image, level, visibleWidth) {
    const coverScale = Math.max(visibleWidth / image.naturalWidth, H / image.naturalHeight) * 1.075;
    const width = image.naturalWidth * coverScale;
    const height = image.naturalHeight * coverScale;
    const travel = Math.max(0, width - visibleWidth);
    const worldTravel = Math.max(1, level.worldWidth - visibleWidth);
    const progress = Math.max(0, Math.min(1, game.cameraX / worldTravel));
    const x = -travel * progress;
    const y = (H - height) * .48;
    const hasDedicatedBackdrop = String(level.backdrop || "").startsWith("level-");

    ctx.save();
    if (!hasDedicatedBackdrop && level.mood === "river") ctx.filter = "saturate(.92) hue-rotate(7deg)";
    else if (!hasDedicatedBackdrop && level.mood === "rooftops") ctx.filter = "saturate(.84) sepia(.08)";
    else if (!hasDedicatedBackdrop && level.mood === "rocks") ctx.filter = "saturate(.72) contrast(1.04)";
    else if (!hasDedicatedBackdrop && level.mood === "summit") ctx.filter = "brightness(1.06) saturate(.82)";
    ctx.drawImage(image, x, y, width, height);
    ctx.filter = "none";
    drawBackdropDepth(level, visibleWidth);

    const readability = ctx.createLinearGradient(0, 250, 0, H);
    readability.addColorStop(0, "rgba(18,42,38,0)");
    readability.addColorStop(.72, level.mood === "night" ? "rgba(15,29,50,.10)" : "rgba(26,49,39,.06)");
    readability.addColorStop(1, level.mood === "mine" ? "rgba(9,19,22,.28)" : "rgba(15,33,26,.18)");
    ctx.fillStyle = readability;
    ctx.fillRect(0, 0, visibleWidth, H);
    ctx.restore();
  }

  function drawBackdropDepth(level, visibleWidth) {
    const night = level.mood === "night";
    ctx.save();
    const haze = ctx.createLinearGradient(0, 270, 0, H);
    haze.addColorStop(0, "rgba(255,255,245,0)");
    haze.addColorStop(.58, night ? "rgba(144,172,196,.08)" : "rgba(230,245,220,.15)");
    haze.addColorStop(1, "rgba(15,45,34,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 220, visibleWidth, H - 220);

    ctx.globalAlpha = night ? .16 : .13;
    ctx.filter = renderProfile.performanceMode ? "none" : "blur(4px)";
    const parallax = game.cameraX * .16;
    const farCount = renderProfile.performanceMode ? 6 : 8;
    for (let i = -1; i < farCount; i += 1) {
      const x = wrap(i * 190 - parallax, -150, visibleWidth + 160);
      const h = 96 + hash(i * 19 + level.index * 13) * 88;
      ctx.fillStyle = night ? "#1c3740" : "#315943";
      ctx.beginPath();
      ctx.moveTo(x, 605);
      ctx.lineTo(x + 32, 605 - h);
      ctx.lineTo(x + 66, 605);
      ctx.closePath();
      ctx.fill();
    }

    ctx.globalAlpha = night ? .15 : .12;
    ctx.filter = renderProfile.performanceMode ? "none" : "blur(8px)";
    ctx.fillStyle = night ? "#172c36" : "#254d39";
    const nearShift = game.cameraX * .31;
    const nearCount = renderProfile.performanceMode ? 4 : 6;
    for (let i = -1; i < nearCount; i += 1) {
      const x = wrap(i * 280 - nearShift, -180, visibleWidth + 200);
      ctx.beginPath();
      ctx.ellipse(x + 70, H - 36, 100, 85 + (i % 2) * 24, 0, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawAtmosphere(level, night) {
    const visibleWidth = getViewWidth();
    ctx.save();
    const mist = ctx.createLinearGradient(0, 430, 0, 640);
    mist.addColorStop(0, "rgba(246,246,220,0)");
    mist.addColorStop(.62, night ? "rgba(154,174,181,.06)" : "rgba(239,244,220,.10)");
    mist.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = mist;
    ctx.fillRect(0, 390, visibleWidth, 270);
    ctx.globalCompositeOperation = "lighter";
    const moteCount = renderProfile.performanceMode ? 12 : 22;
    for (let i = 0; i < moteCount; i += 1) {
      const x = wrap(hash(i * 17 + level.index) * visibleWidth + game.time * (4 + i % 3), -20, visibleWidth + 20);
      const y = 115 + hash(i * 37 + level.index * 3) * 470 + Math.sin(game.time * .8 + i) * 10;
      const pulse = .22 + Math.sin(game.time * 2 + i * .7) * .09;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = night ? "#f5d67c" : "#fff4bb";
      ctx.beginPath(); ctx.arc(x, y, 1.3 + i % 3 * .45, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawStars() {
    const visibleWidth = getViewWidth();
    for (let i = 0; i < 34; i += 1) {
      const x = hash(i * 97) * visibleWidth;
      const y = 20 + hash(i * 193) * 260;
      const blink = 0.45 + Math.sin(game.time * 1.7 + i) * 0.25;
      ctx.globalAlpha = blink;
      ctx.fillStyle = "#fff5cf";
      ctx.beginPath(); ctx.arc(x, y, 1 + (i % 3) * 0.5, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawClouds(level, parallax, alpha) {
    const visibleWidth = getViewWidth();
    ctx.globalAlpha = alpha;
    for (let i = 0; i < 8; i += 1) {
      const x = wrap(i * 320 - game.cameraX * parallax + game.time * 3, -240, visibleWidth + 320);
      const y = 92 + (i % 3) * 76;
      const size = 42 + (i % 4) * 9;
      ctx.fillStyle = level.mood === "night" ? "#8794a4" : "#f4f3df";
      ctx.beginPath();
      ctx.arc(x, y, size * .55, 0, TAU);
      ctx.arc(x + size * .58, y - size * .18, size * .75, 0, TAU);
      ctx.arc(x + size * 1.22, y, size * .54, 0, TAU);
      ctx.roundRect(x - size * .45, y, size * 2.1, size * .5, 18);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMountainLayer(level, parallax, baseY, color, height, seedOffset) {
    const visibleWidth = getViewWidth();
    const shift = -(game.cameraX * parallax) % 460;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-500, H);
    ctx.lineTo(-500, baseY);
    for (let i = -2; i < 6; i += 1) {
      const x = shift + i * 460;
      const peak = baseY - height * (0.72 + hash(i * 13 + seedOffset * 41) * 0.45);
      ctx.quadraticCurveTo(x + 115, peak + 45, x + 230, peak);
      ctx.quadraticCurveTo(x + 345, peak + 55, x + 460, baseY);
    }
    ctx.lineTo(visibleWidth + 500, H);
    ctx.closePath();
    ctx.fill();
  }

  function drawForestLayer(level, parallax, baseY, color) {
    const visibleWidth = getViewWidth();
    const spacing = 72;
    const shift = -((game.cameraX * parallax) % spacing);
    for (let i = -2; i < Math.ceil(visibleWidth / spacing) + 3; i += 1) {
      const x = shift + i * spacing;
      const height = 75 + hash(i + level.index * 31) * 78;
      drawSpruce(x, baseY, height, color, 0.92);
    }
    ctx.fillStyle = color;
    ctx.fillRect(0, baseY - 2, visibleWidth, H - baseY + 2);
  }

  function drawRegionalLandmark(level) {
    const x = getViewWidth() * 0.62 - game.cameraX * 0.11;
    ctx.save();
    ctx.globalAlpha = 0.64;
    switch (level.mood) {
      case "village":
      case "rooftops":
        for (let i = 0; i < 6; i += 1) drawFachwerkHouse(x - 420 + i * 145, 440 - (i % 2) * 20, 0.7, level.accent);
        break;
      case "mine":
        drawMineHeadframe(x, 455, 0.9);
        break;
      case "river":
        drawRiverValley(x, 478, 0.86);
        break;
      case "rail":
        drawTrain(x - 130, 435, 0.85);
        break;
      case "night":
        drawSchwibbogen(x - 100, 425, 1);
        break;
      case "rocks":
        drawRockTowers(x - 180, 475, 0.95);
        break;
      case "castle":
        drawCastle(x, 414, 0.85);
        break;
      case "summit":
        drawSummitTower(x, 418, 0.9);
        break;
      default:
        for (let i = 0; i < 4; i += 1) drawFachwerkHouse(x - 270 + i * 160, 458, 0.62, level.accent);
    }
    ctx.restore();
  }

  function drawEnergyBackdrop(level, x) {
    const groundY = level.mood === "summit" ? 502 : level.mood === "night" ? 518 : 525;
    const solarScale = level.mood === "solar" ? 1.05 : level.mood === "mine" || level.mood === "rail" ? .82 : .68;
    ctx.save();
    ctx.globalAlpha = level.mood === "night" ? .86 : .78;
    drawSolarArray(x - 410, groundY, solarScale);
    drawEVChargingPoint(x + 300, groundY + 4, .78);
    if (level.mood === "rail" || level.mood === "village" || level.mood === "rooftops" || level.mood === "solar") drawElectricShuttle(x + 395, groundY + 8, level.mood === "solar" ? .78 : .62);
    ctx.restore();
  }

  function drawSolarArray(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#4c5549";
    ctx.fillRect(-94, 0, 188, 7);
    ctx.fillRect(-49, 4, 8, 34);
    ctx.fillRect(42, 4, 8, 34);
    for (let panel = 0; panel < 4; panel += 1) {
      const px = -96 + panel * 49;
      ctx.fillStyle = "#193f60";
      ctx.beginPath();
      ctx.moveTo(px, -47); ctx.lineTo(px + 43, -55); ctx.lineTo(px + 47, -10); ctx.lineTo(px + 4, -3);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#98cfdb";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.strokeStyle = "rgba(188,231,238,.7)";
      ctx.beginPath(); ctx.moveTo(px + 12, -43); ctx.lineTo(px + 17, -7); ctx.moveTo(px + 27, -46); ctx.lineTo(px + 32, -9); ctx.stroke();
    }
    ctx.fillStyle = "#d8e66c";
    ctx.beginPath(); ctx.arc(0, -66, 6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawEVChargingPoint(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#314c4d";
    ctx.beginPath(); ctx.roundRect(-18, -58, 36, 58, 6); ctx.fill();
    ctx.fillStyle = "#bce9d5";
    ctx.beginPath(); ctx.roundRect(-12, -51, 24, 24, 4); ctx.fill();
    ctx.fillStyle = "#248b82";
    ctx.font = "bold 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("⚡", 0, -33);
    ctx.strokeStyle = "#2d4746";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(15, -32); ctx.quadraticCurveTo(37, -30, 30, -8); ctx.lineTo(24, -5); ctx.stroke();
    ctx.fillStyle = "#e7f4df";
    ctx.beginPath(); ctx.arc(24, -5, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawElectricShuttle(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#e9f3e6";
    ctx.beginPath(); ctx.roundRect(-48, -30, 96, 28, 10); ctx.fill();
    ctx.fillStyle = "#2d7f77";
    ctx.beginPath(); ctx.roundRect(-30, -46, 56, 22, 8); ctx.fill();
    ctx.fillStyle = "#a8dce3";
    ctx.fillRect(-22, -40, 17, 10); ctx.fillRect(1, -40, 17, 10);
    ctx.fillStyle = "#354343";
    ctx.beginPath(); ctx.arc(-28, 0, 9, 0, TAU); ctx.arc(28, 0, 9, 0, TAU); ctx.fill();
    ctx.fillStyle = "#f4c958";
    ctx.fillRect(38, -20, 6, 7);
    ctx.restore();
  }

  function drawWorld(level) {
    const visibleWidth = getViewWidth();
    const left = game.cameraX - 180;
    const right = game.cameraX + visibleWidth + 180;
    ctx.save();
    ctx.translate(-game.cameraX, 0);
    drawWorldDecor(level);
    for (const platform of level.platforms) {
      if (platform.active !== false && platform.x + platform.w >= left && platform.x <= right) drawPlatform(platform, level);
    }
    for (const spring of level.springs) {
      if (spring.x + spring.w >= left && spring.x <= right) drawSpring(spring, level);
    }
    for (const checkpoint of level.checkpoints || [level.checkpoint]) drawCheckpoint(checkpoint, level);
    if (level.secretEntrance && !level.secret?.used) drawSecretEntrance(level.secretEntrance, level);
    drawGoal(level.goal, level);
    if (level.puzzle) drawPuzzleChallenge(level.puzzle, level);
    if (level.chapter) drawChapterChallenge(level.chapter, level);
    for (const crystal of level.collectibles) {
      if (!crystal.collected && crystal.x >= left && crystal.x <= right) drawCrystal(crystal, level);
    }
    for (const item of level.items || []) {
      if (!item.collected && item.x >= left && item.x <= right) drawRegionalItem(item, level);
    }
    for (const life of level.lifePickups || []) {
      if (!life.collected && life.x >= left && life.x <= right) drawLifePickup(life, level);
    }
    for (const hazard of level.hazards) {
      if (!hazard.collected && hazard.x >= left && hazard.x <= right) drawHazard(hazard, level);
    }
    if (level.handcrafted) drawLevelHints(level);
    if (level.mood === "mine" || level.backdrop === "mine") drawCaveDarkness(level);
    drawParticles();
    if (game.player) drawPlayer(game.player);
    ctx.restore();
  }

  function drawPuzzleChallenge(puzzle, level) {
    const firstNode = puzzle.nodes[0];
    ctx.save();
    ctx.font = "800 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(20,48,43,.76)";
    ctx.beginPath(); ctx.roundRect(firstNode.x - 58, firstNode.y - 76, 116, 20, 8); ctx.fill();
    ctx.fillStyle = puzzle.solved ? "#dff5b8" : "#fff4c2";
    ctx.fillText(puzzle.solved ? "WEG FREI" : puzzle.name.toUpperCase(), firstNode.x, firstNode.y - 62);

    for (const node of puzzle.nodes) {
      const glow = node.active || puzzle.solved;
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.shadowColor = glow ? "#ffe27a" : "rgba(255,233,155,.4)";
      ctx.shadowBlur = glow ? 16 : 5;

      if (puzzle.id === "crystalChime") {
        ctx.fillStyle = glow ? "#ffd75c" : "#6ea4ad";
        ctx.beginPath();
        ctx.moveTo(0, -23); ctx.lineTo(14, -6); ctx.lineTo(8, 19); ctx.lineTo(-8, 19); ctx.lineTo(-14, -6); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#eff8de";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -19); ctx.lineTo(0, 14); ctx.moveTo(0, -2); ctx.lineTo(11, -6); ctx.stroke();
      } else if (puzzle.id === "crankBridge") {
        ctx.strokeStyle = "#7c4b2f";
        ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(-2, 20); ctx.lineTo(-2, -17); ctx.stroke();
        ctx.fillStyle = glow ? "#e8be55" : "#9e6842";
        ctx.beginPath(); ctx.arc(-2, -18, 15, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#f5ddb0"; ctx.lineWidth = 2; ctx.stroke();
        for (let spoke = 0; spoke < 4; spoke += 1) {
          const angle = spoke * TAU / 4 + (glow ? game.time * 2 : 0);
          ctx.beginPath(); ctx.moveTo(-2, -18); ctx.lineTo(-2 + Math.cos(angle) * 12, -18 + Math.sin(angle) * 12); ctx.stroke();
        }
      } else if (puzzle.id === "solarRelay") {
        ctx.fillStyle = "#42564e";
        ctx.fillRect(-24, 12, 48, 6);
        ctx.fillRect(-4, 16, 8, 17);
        ctx.fillStyle = "#1b526b";
        ctx.beginPath(); ctx.moveTo(-28, -21); ctx.lineTo(19, -28); ctx.lineTo(27, 7); ctx.lineTo(-20, 13); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#9cd2dd"; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = "rgba(205,242,238,.65)";
        ctx.beginPath(); ctx.moveTo(-11, -22); ctx.lineTo(-4, 10); ctx.moveTo(5, -25); ctx.lineTo(12, 8); ctx.moveTo(-24, -7); ctx.lineTo(23, -14); ctx.stroke();
        ctx.fillStyle = "rgba(255,239,133,.22)";
        ctx.beginPath(); ctx.arc(0, -8, 34, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffd75c";
        ctx.fillRect(-24, -39, 48, 5);
        ctx.fillStyle = "#7bd6ae";
        ctx.fillRect(-22, -38, 44 * Math.min(1, puzzle.charge / 1.1), 3);
      } else if (puzzle.id === "railSignal") {
        ctx.fillStyle = "#384849";
        ctx.fillRect(-4, -36, 8, 57);
        ctx.fillStyle = glow ? "#73df85" : "#d95d55";
        ctx.beginPath(); ctx.arc(0, -43, 12, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#eff3de"; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = "#324641";
        ctx.fillRect(-18, 19, 36, 5);
      } else if (puzzle.id === "windWheels") {
        ctx.strokeStyle = "#75503a";
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, 21); ctx.lineTo(0, -2); ctx.stroke();
        ctx.fillStyle = glow ? "#bfe4e7" : "#91a8aa";
        for (let blade = 0; blade < 4; blade += 1) {
          const angle = blade * TAU / 4 + (glow ? game.time * 2.6 : 0);
          ctx.save(); ctx.rotate(angle);
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(16, -14, 23, -3); ctx.lineTo(5, 5); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
        ctx.fillStyle = "#e9d587";
        ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawChapterChallenge(chapter, level) {
    const { task, finale, config } = chapter;
    ctx.save();

    for (const node of task.nodes) {
      const glow = node.active ? .45 : .72 + Math.sin(game.time * 4 + node.pulse) * .18;
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.globalAlpha = node.active ? .72 : 1;
      ctx.shadowColor = config.accent;
      ctx.shadowBlur = node.active ? 7 : 16 * glow;

      if (config.taskStyle === "star") {
        ctx.fillStyle = node.active ? "#6f8d75" : "#e4b34d";
        ctx.beginPath();
        for (let point = 0; point < 10; point += 1) {
          const angle = -Math.PI / 2 + point * Math.PI / 5;
          const radius = point % 2 ? 10 : 23;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (!point) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#fff4c9"; ctx.lineWidth = 2; ctx.stroke();
      } else if (config.taskStyle === "lantern") {
        ctx.fillStyle = node.active ? "#f9d864" : "#35616a";
        ctx.fillRect(-17, -20, 34, 39);
        ctx.strokeStyle = "#f4e4b5"; ctx.lineWidth = 3; ctx.strokeRect(-17, -20, 34, 39);
        ctx.strokeStyle = "#7a4d31";
        ctx.beginPath(); ctx.moveTo(-21, 24); ctx.lineTo(21, 24); ctx.moveTo(0, 19); ctx.lineTo(0, 33); ctx.stroke();
        if (node.active) {
          ctx.fillStyle = "rgba(255,222,99,.23)";
          ctx.beginPath(); ctx.arc(0, 0, 36, 0, TAU); ctx.fill();
        }
      } else if (config.taskStyle === "support") {
        ctx.strokeStyle = node.active ? "#8fd4c8" : "#b47c49";
        ctx.lineWidth = 7;
        ctx.beginPath(); ctx.moveTo(-22, 26); ctx.lineTo(-22, -22); ctx.moveTo(22, 26); ctx.lineTo(22, -22); ctx.moveTo(-28, -18); ctx.lineTo(28, -18); ctx.stroke();
        ctx.fillStyle = node.active ? "#71c8bb" : "#d5a052";
        ctx.beginPath(); ctx.arc(0, 2, 14, 0, TAU); ctx.fill();
        ctx.strokeStyle = "#eff6df"; ctx.lineWidth = 2;
        for (let spoke = 0; spoke < 4; spoke += 1) {
          const angle = spoke * TAU / 4 + (node.active ? game.time * 1.8 : 0);
          ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(Math.cos(angle) * 12, 2 + Math.sin(angle) * 12); ctx.stroke();
        }
      } else {
        drawRegionalTaskIcon(config, node);
      }

      ctx.shadowBlur = 0;
      ctx.fillStyle = node.active ? "#e8f4df" : "#fff8d5";
      ctx.font = "950 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(node.active ? "✓" : `${node.index + 1}`, 0, -34);
      ctx.restore();
    }

    if (task.complete) {
      if (finale.type === "charge") drawWorkshopFinale(finale, config);
      if (finale.type === "sequence") drawLightRunFinale(finale, config);
      if (finale.type === "escape") drawMineEscapeFinale(finale, config);
      if (finale.boss
        && !finale.boss.defeated
        && finale.state !== "complete"
        && (!finale.boss.afterMechanic || finale.boss.active)) {
        drawChapterBoss(finale.boss, config);
      }
    }

    if (finale.state !== "complete") {
      ctx.save();
      ctx.translate(level.goal.x + level.goal.w * .5, level.goal.y - 30);
      ctx.fillStyle = "rgba(36,48,44,.9)";
      ctx.beginPath(); ctx.roundRect(-28, -20, 56, 42, 12); ctx.fill();
      ctx.strokeStyle = "#f3d879"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(0, -18, 13, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = "#f3d879";
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawRegionalTaskIcon(config, node) {
    const active = node.active;
    ctx.strokeStyle = active ? "#dff4cf" : "#fff0c1";
    ctx.fillStyle = active ? "#5e957a" : config.accent;
    ctx.lineWidth = 3;

    if (config.taskStyle === "wheel" || config.taskStyle === "valve") {
      ctx.beginPath(); ctx.arc(0, 0, 21, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#ecf6dc"; ctx.lineWidth = 4;
      for (let spoke = 0; spoke < 6; spoke += 1) {
        const angle = spoke * TAU / 6 + (active ? game.time * 1.4 : 0);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(angle) * 18, Math.sin(angle) * 18); ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.stroke();
    } else if (config.taskStyle === "signal") {
      ctx.fillRect(-14, -26, 28, 43);
      ctx.strokeRect(-14, -26, 28, 43);
      ctx.fillStyle = active ? "#75e28a" : "#db625b";
      ctx.beginPath(); ctx.arc(0, -13, 8, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#594536"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 17); ctx.lineTo(0, 32); ctx.moveTo(-16, 32); ctx.lineTo(16, 32); ctx.stroke();
    } else if (config.taskStyle === "weatherVane") {
      ctx.strokeStyle = "#6d4936"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(0, 29); ctx.lineTo(0, -19); ctx.stroke();
      ctx.fillStyle = active ? "#8fd4ba" : config.accent;
      ctx.beginPath(); ctx.moveTo(-24, -17); ctx.lineTo(19, -27); ctx.lineTo(10, -12); ctx.lineTo(24, -3); ctx.lineTo(-24, -8); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (config.taskStyle === "candle") {
      ctx.fillStyle = "#f6e3a5"; ctx.fillRect(-10, -6, 20, 31);
      ctx.strokeStyle = "#8d6844"; ctx.strokeRect(-10, -6, 20, 31);
      ctx.fillStyle = active ? "#ffe15f" : "#71858a";
      ctx.beginPath(); ctx.moveTo(0, -31); ctx.quadraticCurveTo(17, -14, 0, -5); ctx.quadraticCurveTo(-14, -16, 0, -31); ctx.fill();
    } else if (config.taskStyle === "cairn") {
      ctx.fillStyle = active ? "#9cbb8f" : "#8c7b68";
      [[0,16,28,13], [0,3,22,11], [0,-9,15,9], [0,-20,9,7]].forEach(([x, y, rx, ry]) => {
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
      });
      if (active) { ctx.fillStyle = config.accent; ctx.fillRect(-2, -39, 4, 19); ctx.beginPath(); ctx.moveTo(2, -38); ctx.lineTo(22, -32); ctx.lineTo(2, -26); ctx.closePath(); ctx.fill(); }
    } else if (config.taskStyle === "key") {
      ctx.strokeStyle = active ? "#c9efbf" : config.accent; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.arc(-9, -7, 12, 0, TAU); ctx.moveTo(0, 2); ctx.lineTo(24, 26); ctx.moveTo(14, 16); ctx.lineTo(22, 8); ctx.stroke();
    } else if (config.taskStyle === "flag") {
      ctx.strokeStyle = "#5f4635"; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(-12, 29); ctx.lineTo(-12, -27); ctx.stroke();
      ctx.fillStyle = active ? config.accent : "#8c7b72";
      ctx.beginPath(); ctx.moveTo(-10, -25); ctx.quadraticCurveTo(12, -31, 26, -17); ctx.quadraticCurveTo(8, -10, -10, -14); ctx.closePath(); ctx.fill();
    } else if (config.taskStyle === "solar") {
      ctx.fillStyle = active ? "#3a99a3" : "#285b72";
      ctx.beginPath(); ctx.moveTo(-25, -19); ctx.lineTo(20, -24); ctx.lineTo(26, 11); ctx.lineTo(-19, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "rgba(214,246,238,.75)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-6, -21); ctx.lineTo(0, 14); ctx.moveTo(10, -22); ctx.lineTo(16, 12); ctx.moveTo(-22, -3); ctx.lineTo(23, -8); ctx.stroke();
    }
  }

  function drawWorkshopFinale(finale, config) {
    const station = finale.station;
    ctx.save();
    ctx.translate(station.x, station.groundY);
    ctx.fillStyle = finale.style === "solar" ? "#315c68" : finale.style === "clock" ? "#5b4d68" : "#714b32";
    ctx.fillRect(-64, -42, 128, 13);
    ctx.fillRect(-53, -31, 10, 31);
    ctx.fillRect(43, -31, 10, 31);
    ctx.fillStyle = "#a87543";
    ctx.fillRect(-58, -48, 116, 9);
    ctx.fillStyle = "#fff3bf";
    ctx.font = "900 23px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(config.mark, 0, -20);
    const ratio = finale.state === "complete" ? 1 : Math.min(1, finale.charge / 1.6);
    ctx.strokeStyle = config.accent;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(0, -58, 25, Math.PI, Math.PI + Math.PI * ratio); ctx.stroke();
    ctx.fillStyle = "rgba(20,48,43,.85)";
    ctx.beginPath(); ctx.roundRect(-72, -100, 144, 22, 8); ctx.fill();
    ctx.fillStyle = "#fff4c2";
    ctx.font = "850 10px system-ui"; ctx.textAlign = "center";
    const labels = {
      workshop: ["SCHWIBBOGEN FERTIG", "HIER STEHEN BLEIBEN"],
      arch: ["LICHTERBOGEN AN", "IM LICHTKREIS BLEIBEN"],
      clock: ["UHRWERK LÄUFT", "KURBEL HALTEN"],
      solar: ["SONNENBAHN GELADEN", "LADESTATION HALTEN"],
    };
    const label = labels[finale.style] || ["FINALE GESCHAFFT", "AKTIVIEREN"];
    ctx.fillText(finale.state === "complete" ? label[0] : label[1], 0, -85, 132);
    ctx.restore();
  }

  function drawLightRunFinale(finale, config) {
    for (const node of finale.nodes) {
      ctx.save();
      ctx.translate(node.x, node.y);
      const next = finale.state === "active" && node.index === finale.progress;
      ctx.strokeStyle = node.active ? config.accent : next ? "#fff5b7" : "rgba(112,151,147,.55)";
      ctx.lineWidth = next ? 9 : 6;
      ctx.shadowColor = config.accent;
      ctx.shadowBlur = next ? 22 : node.active ? 12 : 0;
      ctx.beginPath(); ctx.ellipse(0, 0, 31, 52, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = node.active ? config.accent : "#ecf5df";
      ctx.font = "950 15px system-ui"; ctx.textAlign = "center";
      ctx.fillText(node.active ? "✓" : `${node.index + 1}`, 0, 5);
      ctx.restore();
    }
  }

  function drawMineEscapeFinale(finale, config) {
    ctx.save();
    ctx.translate(finale.startX, finale.startY);
    ctx.strokeStyle = finale.state === "active" ? "#e36a60" : "#e7bf65";
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 8]);
    ctx.beginPath(); ctx.moveTo(0, -145); ctx.lineTo(0, 8); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(32,45,42,.88)";
    ctx.beginPath(); ctx.roundRect(-62, -170, 124, 23, 8); ctx.fill();
    ctx.fillStyle = "#fff0bb";
    ctx.font = "900 10px system-ui"; ctx.textAlign = "center";
    const startLabels = {
      cart: ["LORE FÄHRT!", "WARNLINIE"],
      wind: ["STURM KOMMT!", "WINDLINIE"],
      avalanche: ["WOLKENFRONT!", "GIPFELLINIE"],
    };
    const startLabel = startLabels[finale.style] || ["FINALE LÄUFT!", "STARTLINIE"];
    ctx.fillText(finale.state === "active" ? startLabel[0] : startLabel[1], 0, -154);
    ctx.restore();

    if (finale.state === "active" && game.player) {
      const danger = finale.duration ? 1 - finale.remaining / finale.duration : 0;
      const cartX = Math.max(finale.startX - 180, game.player.x - (250 - danger * 150));
      const ground = groundAtOrNearest(game.level, cartX);
      ctx.save();
      ctx.translate(cartX, ground.y - 34);
      if (finale.style === "wind") {
        ctx.strokeStyle = "rgba(227,241,226,.72)"; ctx.lineWidth = 7;
        for (let gust = 0; gust < 4; gust += 1) {
          ctx.beginPath(); ctx.arc(-gust * 23, -gust * 6, 24 + gust * 4, -.9, .9); ctx.stroke();
        }
      } else if (finale.style === "avalanche") {
        ctx.fillStyle = "rgba(224,236,232,.82)";
        for (let cloud = 0; cloud < 5; cloud += 1) {
          ctx.beginPath(); ctx.arc(-cloud * 19, -cloud * 5, 22 + cloud * 3, 0, TAU); ctx.fill();
        }
        ctx.fillStyle = config.accent;
        ctx.beginPath(); ctx.arc(4, 4, 18, 0, TAU); ctx.fill();
      } else {
        ctx.fillStyle = "#654536";
        ctx.beginPath(); ctx.moveTo(-42, -28); ctx.lineTo(38, -28); ctx.lineTo(30, 8); ctx.lineTo(-34, 8); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#ba8650"; ctx.lineWidth = 4; ctx.stroke();
        ctx.fillStyle = "#2e3838";
        ctx.beginPath(); ctx.arc(-24, 14, 11, 0, TAU); ctx.arc(22, 14, 11, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(218,225,205,.35)";
        for (let puff = 0; puff < 3; puff += 1) {
          ctx.beginPath(); ctx.arc(-47 - puff * 18, -8 - puff * 8, 8 + puff * 2, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }

  }

  function drawBossAttackAura(boss, config) {
    if (boss.gusting <= 0) return;
    const progress = 1 - boss.gusting / Math.max(.01, boss.attackDuration || .4);
    ctx.save();
    ctx.globalAlpha *= .76 * (1 - progress * .45);

    if (boss.kind === "crystalGuardian") {
      ctx.rotate(game.time * 1.8);
      const shardCount = game.performanceMode ? 6 : 10;
      for (let shard = 0; shard < shardCount; shard += 1) {
        const angle = shard * TAU / shardCount;
        const radius = 52 + progress * 92;
        ctx.save();
        ctx.rotate(angle);
        ctx.translate(radius, 0);
        ctx.rotate(Math.PI / 4 + game.time * 2.2);
        ctx.fillStyle = shard % 2 ? "rgba(135,226,238,.66)" : "rgba(226,251,255,.72)";
        ctx.fillRect(-5, -5, 10, 10);
        ctx.restore();
      }
      ctx.strokeStyle = "rgba(125,222,235,.62)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, 48 + progress * 72, 0, TAU);
      ctx.stroke();
    } else if (boss.kind === "cloudTitan") {
      ctx.strokeStyle = "rgba(255,239,143,.82)";
      ctx.lineWidth = 5;
      const boltCount = game.performanceMode ? 3 : 5;
      for (let bolt = 0; bolt < boltCount; bolt += 1) {
        const angle = bolt * TAU / boltCount + game.time * .35;
        const inner = 55 + progress * 25;
        const outer = 95 + progress * 85;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        ctx.lineTo(Math.cos(angle + .14) * (inner + outer) * .5, Math.sin(angle + .14) * (inner + outer) * .5);
        ctx.lineTo(Math.cos(angle - .1) * outer, Math.sin(angle - .1) * outer);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(232,246,248,.48)";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.arc(0, 0, 68 + progress * 110, 0, TAU);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(235,247,240,.62)";
      ctx.lineWidth = 5;
      for (let ring = 0; ring < 4; ring += 1) {
        const radius = 46 + ring * 24 + progress * 32;
        ctx.beginPath();
        ctx.arc(0, 1, radius, -.7, .7);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawStormCrowBoss(boss, config, hitFlash) {
    const flap = Math.sin(game.time * 9) * .26;
    ctx.fillStyle = "#40545d";
    ctx.strokeStyle = "#243a42";
    ctx.lineWidth = 4;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(.18 + flap);
      ctx.beginPath();
      ctx.moveTo(22, -6);
      ctx.quadraticCurveTo(72, -38, 67, 11);
      ctx.quadraticCurveTo(52, 4, 43, 22);
      ctx.quadraticCurveTo(34, 8, 21, 17);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(210,232,226,.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(29, 2); ctx.quadraticCurveTo(48, -14, 62, -13);
      ctx.moveTo(31, 9); ctx.quadraticCurveTo(49, -1, 61, 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = hitFlash ? "#fff1c7" : "#536b73";
    ctx.strokeStyle = "#243a42";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, 3, 31, 25, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#344850";
    ctx.beginPath();
    ctx.moveTo(-15, 22); ctx.lineTo(-5, 40 + Math.sin(game.time * 8) * 4); ctx.lineTo(2, 22);
    ctx.moveTo(5, 22); ctx.lineTo(13, 39 - Math.sin(game.time * 8) * 4); ctx.lineTo(19, 18);
    ctx.fill();
    const blink = Math.sin(game.time * 2.7) > .96 ? 1 : 7;
    ctx.fillStyle = "#d8e7df";
    ctx.beginPath(); ctx.ellipse(-10, -6, 7, blink, 0, 0, TAU); ctx.ellipse(10, -6, 7, blink, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = "#1e3036";
    ctx.beginPath(); ctx.arc(-9, -5, 3, 0, TAU); ctx.arc(9, -5, 3, 0, TAU); ctx.fill();
    ctx.fillStyle = config.accent;
    ctx.beginPath(); ctx.moveTo(-7, 5); ctx.lineTo(12, 10); ctx.lineTo(-7, 15); ctx.closePath(); ctx.fill();
  }

  function drawCrystalGuardianBoss(boss, config, hitFlash) {
    const pulse = .92 + Math.sin(game.time * 4.8) * .08;
    const orbitCount = game.performanceMode ? 4 : 7;
    for (let shard = 0; shard < orbitCount; shard += 1) {
      const angle = game.time * (shard % 2 ? -.9 : .9) + shard * TAU / orbitCount;
      const radius = 51 + Math.sin(game.time * 2.4 + shard) * 8;
      ctx.save();
      ctx.translate(Math.cos(angle) * radius, Math.sin(angle) * radius * .48);
      ctx.rotate(angle + game.time * 1.7);
      ctx.fillStyle = shard % 2 ? "#75c9d7" : "#c8f3ee";
      ctx.strokeStyle = "#315b68";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(8, 0); ctx.lineTo(0, 14); ctx.lineTo(-8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side, 1);
      ctx.translate(35, 2 + Math.sin(game.time * 4 + side) * 5);
      ctx.rotate(.18 + Math.sin(game.time * 3.2) * .18);
      ctx.fillStyle = hitFlash ? "#fff1c7" : "#4d8791";
      ctx.strokeStyle = "#244c59";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-7, -13); ctx.lineTo(16, -6); ctx.lineTo(22, 11); ctx.lineTo(-1, 17); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.fillStyle = hitFlash ? "#fff1c7" : "#477985";
    ctx.strokeStyle = "#213f4c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -39); ctx.lineTo(31, -14); ctx.lineTo(27, 25); ctx.lineTo(0, 39); ctx.lineTo(-27, 25); ctx.lineTo(-31, -14); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = config.accent;
    ctx.shadowColor = "#9ff4f2";
    ctx.shadowBlur = 18 + Math.sin(game.time * 6) * 6;
    ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(17, 2); ctx.lineTo(0, 25); ctx.lineTo(-17, 2); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#dff9f3";
    ctx.beginPath(); ctx.moveTo(-18, -16); ctx.lineTo(-4, -12); ctx.lineTo(-8, -4); ctx.closePath(); ctx.moveTo(18, -16); ctx.lineTo(4, -12); ctx.lineTo(8, -4); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(221,252,247,.7)";
    ctx.lineWidth = 2;
    const cracks = Math.max(0, boss.maxHp - boss.hp);
    for (let crack = 0; crack < cracks; crack += 1) {
      const x = -14 + crack * 13;
      ctx.beginPath(); ctx.moveTo(x, 9); ctx.lineTo(x - 7, 19); ctx.lineTo(x + 1, 27); ctx.stroke();
    }
  }

  function drawCloudTitanBoss(boss, config, hitFlash) {
    const breathe = 1 + Math.sin(game.time * 2.7) * .045;
    ctx.save();
    ctx.scale(breathe, 2 - breathe);
    ctx.fillStyle = hitFlash ? "#fff1c7" : "#d9e5e4";
    ctx.strokeStyle = "#536f76";
    ctx.lineWidth = 4;
    const clouds = [[-29,5,29], [0,-7,36], [30,6,28], [-11,21,31], [21,21,29]];
    for (const [x, y, radius] of clouds) {
      ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();

    for (const side of [-1, 1]) {
      const swing = Math.sin(game.time * 3.4 + side) * .22;
      ctx.save();
      ctx.scale(side, 1);
      ctx.rotate(swing);
      ctx.fillStyle = "#b9ccce";
      ctx.strokeStyle = "#536f76";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.ellipse(51, 12, 25, 17, .2, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(69, 22, 13, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "#36515a";
    ctx.beginPath(); ctx.ellipse(-14, -7, 7, 10, -.14, 0, TAU); ctx.ellipse(14, -7, 7, 10, .14, 0, TAU); ctx.fill();
    ctx.fillStyle = "#fff0a0";
    ctx.beginPath(); ctx.arc(-13, -8, 3, 0, TAU); ctx.arc(13, -8, 3, 0, TAU); ctx.fill();
    ctx.strokeStyle = "#6b8588";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(0, 14, 15, .2, Math.PI - .2); ctx.stroke();

    ctx.fillStyle = config.accent;
    ctx.strokeStyle = "#734a45";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-31, -27); ctx.lineTo(-20, -51); ctx.lineTo(-7, -32); ctx.lineTo(5, -55); ctx.lineTo(17, -32); ctx.lineTo(31, -49); ctx.lineTo(28, -24); ctx.closePath();
    ctx.fill(); ctx.stroke();

    const sparkCount = game.performanceMode ? 3 : 6;
    ctx.fillStyle = "#ffed85";
    for (let spark = 0; spark < sparkCount; spark += 1) {
      const angle = game.time * 1.4 + spark * TAU / sparkCount;
      const radius = 58 + Math.sin(game.time * 3 + spark) * 9;
      ctx.beginPath(); ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius * .52, 3 + spark % 2, 0, TAU); ctx.fill();
    }
  }

  function drawBossHealthBar(boss, config) {
    const width = boss.kind === "cloudTitan" ? 150 : 132;
    const barY = -boss.h * .5 - 31;
    const hpRatio = boss.maxHp ? boss.hp / boss.maxHp : 0;
    ctx.fillStyle = "rgba(24,42,44,.88)";
    ctx.beginPath(); ctx.roundRect(-width * .5, barY, width, 18, 7); ctx.fill();
    ctx.fillStyle = config.accent;
    ctx.beginPath(); ctx.roundRect(-width * .5 + 4, barY + 4, (width - 8) * hpRatio, 10, 4); ctx.fill();
    ctx.fillStyle = "#fff7d3";
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(boss.name.toUpperCase(), 0, barY - 9);
  }

  function drawChapterBoss(boss, config) {
    const hitFlash = boss.invincible > 0 && Math.floor(game.time * 18) % 2 === 0;
    ctx.save();
    ctx.translate(boss.x, boss.y);
    ctx.globalAlpha = boss.active ? (hitFlash ? .5 : 1) : .72;
    drawBossAttackAura(boss, config);
    if (boss.kind === "crystalGuardian") drawCrystalGuardianBoss(boss, config, hitFlash);
    else if (boss.kind === "cloudTitan") drawCloudTitanBoss(boss, config, hitFlash);
    else drawStormCrowBoss(boss, config, hitFlash);
    drawBossHealthBar(boss, config);
    ctx.restore();
  }

  function drawForegroundDepth(level) {
    const visibleWidth = getViewWidth();
    ctx.save();
    const bottomShade = ctx.createLinearGradient(0, H - 170, 0, H);
    bottomShade.addColorStop(0, "rgba(12,29,24,0)");
    bottomShade.addColorStop(1, level.mood === "mine" ? "rgba(5,12,14,.24)" : "rgba(11,27,20,.13)");
    ctx.fillStyle = bottomShade;
    ctx.fillRect(0, H - 170, visibleWidth, 170);

    const edgeShade = ctx.createLinearGradient(0, 0, visibleWidth, 0);
    edgeShade.addColorStop(0, "rgba(9,25,19,.13)");
    edgeShade.addColorStop(.075, "rgba(9,25,19,0)");
    edgeShade.addColorStop(.925, "rgba(9,25,19,0)");
    edgeShade.addColorStop(1, "rgba(9,25,19,.13)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(0, 0, visibleWidth, H);

    ctx.globalAlpha = level.mood === "mine" ? .18 : .09;
    ctx.filter = "blur(5px)";
    ctx.fillStyle = level.mood === "night" ? "#172b35" : "#173b2b";
    for (const side of [-1, 1]) {
      const anchor = side < 0 ? -22 : visibleWidth + 22;
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.ellipse(anchor + side * (i % 2) * 14, H - 34 - i * 31, 44 - i * 3, 27, side * .35, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawWorldDecor(level) {
    const visibleWidth = getViewWidth();
    if (level.underwater) {
      drawUnderwaterWorldDecor(level, visibleWidth);
      return;
    }
    if (level.isBonusRoom) drawBonusRoomDecor(level, visibleWidth);
    if (level.handcrafted) drawSeiffenDecorations(level, visibleWidth);
    const start = Math.max(0, Math.floor(game.cameraX / 340) - 1);
    const end = Math.ceil((game.cameraX + visibleWidth) / 340) + 1;
    for (let i = start; i <= end; i += 1) {
      const x = i * 340 + 90;
      const ground = groundAt(level, x);
      if (!ground) continue;
      if (!level.isBonusRoom && (i + level.index) % 3 === 0) drawSpruce(x, ground.y, 105 + (i % 3) * 18, "#27543f", 1);
      const signX = x + 100;
      const signGround = groundAt(level, signX);
      if (!level.isBonusRoom && (i + level.index) % 5 === 2 && level.mood !== "mine" && signGround?.id === ground.id) {
        drawSignpost(signX, signGround.y + 1, i % 2 ? "↑" : "→");
      }
      drawRegionalForeground(level, x, ground.y, i);
    }
    if (game.talents.has("secretPaths")) drawSecretPathGuides(level);
  }

  function drawUnderwaterWorldDecor(level, visibleWidth) {
    const left = game.cameraX - 180;
    const right = game.cameraX + visibleWidth + 180;
    ctx.save();
    for (let x = 260; x < level.worldWidth; x += 520) {
      if (x < left || x > right) continue;
      const floor = groundAt(level, x) || { y: 650 };
      const sway = Math.sin(game.time * 1.15 + x * .01) * .12;
      ctx.strokeStyle = "rgba(82,169,143,.58)";
      ctx.lineWidth = 7;
      ctx.lineCap = "round";
      for (let stem = 0; stem < 3; stem += 1) {
        ctx.beginPath();
        ctx.moveTo(x + stem * 15, floor.y);
        ctx.quadraticCurveTo(x - 8 + stem * 14, floor.y - 42, x + stem * 13 + sway * 28, floor.y - 78 - stem * 9);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(90,229,221,.42)";
      for (let bubble = 0; bubble < 3; bubble += 1) {
        const by = floor.y - 105 - bubble * 42 - wrap(game.time * (12 + bubble * 3) + x, 0, 54);
        ctx.beginPath(); ctx.arc(x + 55 + bubble * 12, by, 3 + bubble, 0, TAU); ctx.fill();
      }
    }
    for (const current of level.currents || []) {
      if (current.x + current.w < left || current.x > right) continue;
      ctx.globalAlpha = .16;
      ctx.strokeStyle = "#baf8f4";
      ctx.lineWidth = 2;
      for (let row = 0; row < 4; row += 1) {
        const y = current.y + 70 + row * 88;
        const offset = wrap(game.time * current.push * .25 + row * 53, 0, 110);
        for (let x = current.x - 80 + offset; x < current.x + current.w; x += 110) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 25, y - 8, x + 52, y);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawBonusRoomDecor(level, visibleWidth) {
    const left = game.cameraX - 150;
    const right = game.cameraX + visibleWidth + 150;
    ctx.save();
    if (["spring-workshop", "clockwork"].includes(level.specialMechanic)) {
      for (let x = 360; x < level.worldWidth; x += 520) {
        if (x < left || x > right) continue;
        drawClockworkGear(x, 515 - (x % 3) * 26, 34 + (x % 2) * 10, x * .01);
      }
    } else if (level.specialMechanic === "water-grotto") {
      ctx.globalAlpha = .4;
      ctx.fillStyle = "#3d9dac";
      for (const current of level.currents) {
        ctx.beginPath(); ctx.roundRect(current.x, 565, current.w, 72, 18); ctx.fill();
        ctx.strokeStyle = "rgba(225,255,250,.65)"; ctx.lineWidth = 2;
        for (let x = current.x + 18; x < current.x + current.w; x += 45) {
          ctx.beginPath(); ctx.arc(x + Math.sin(game.time * 2 + x) * 8, 585, 12, .2, Math.PI - .2); ctx.stroke();
        }
      }
    } else if (level.specialMechanic === "train-depot") {
      for (let x = 150; x < level.worldWidth; x += 620) {
        if (x >= left && x <= right) drawRailTrack(x - 100, 565, 330);
      }
    } else if (level.specialMechanic === "granite-climb") {
      ctx.fillStyle = "rgba(232,211,157,.3)";
      ctx.font = "900 34px Georgia";
      for (let x = 420; x < level.worldWidth; x += 560) {
        if (x >= left && x <= right) ctx.fillText("✦", x, 480 - (x % 4) * 36);
      }
    } else if (level.specialMechanic === "ice-wind") {
      ctx.fillStyle = "rgba(202,238,244,.56)";
      for (let x = 250; x < level.worldWidth; x += 310) {
        if (x < left || x > right) continue;
        ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x + 18, 150 + x % 55); ctx.lineTo(x + 36, 90); ctx.closePath(); ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawClockworkGear(x, y, radius, phase) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(game.time * .18 + phase);
    ctx.strokeStyle = "rgba(203,151,76,.42)";
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
    ctx.lineWidth = 5;
    for (let i = 0; i < 8; i += 1) {
      const angle = i * TAU / 8;
      ctx.beginPath(); ctx.moveTo(Math.cos(angle) * 12, Math.sin(angle) * 12); ctx.lineTo(Math.cos(angle) * (radius + 10), Math.sin(angle) * (radius + 10)); ctx.stroke();
    }
    ctx.fillStyle = "rgba(58,45,34,.65)";
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRegionalForeground(level, x, y, index) {
    switch (level.mood) {
      case "village":
        if (index % 4 === 0) drawFachwerkHouse(x + 48, y, .56, level.accent);
        if (index % 5 === 0) drawToyArch(x - 42, y - 10, .32);
        break;
      case "mine":
        drawMineSupport(x, y, 1);
        break;
      case "river":
        break;
      case "rail":
        drawRailTrack(x - 125, y - 2, 250);
        break;
      case "rooftops":
        if (index % 2 === 0) drawChimney(x + 72, y, .88);
        if (index % 4 === 0) drawFachwerkHouse(x - 42, y + 5, .46, level.accent);
        break;
      case "night":
        if (index % 2 === 0) drawLantern(x + 45, y, .9);
        break;
      case "rocks":
        if (index % 2) drawClimbingFlag(x + 32, y - 15);
        break;
      case "summit":
      case "castle":
        drawWindRibbon(x, y - 135, index);
        break;
      default:
        break;
    }
  }

  function drawSecretPathGuides(level) {
    const guides = level.secretEntrance && !level.secret?.used
      ? [{ x: level.secretEntrance.x + level.secretEntrance.w / 2, y: level.secretEntrance.y - 16 }]
      : [];
    for (const guide of guides) {
      ctx.save();
      ctx.globalAlpha = .65 + Math.sin(game.time * 3 + guide.x) * .2;
      ctx.fillStyle = "#ffe184";
      ctx.beginPath();
      ctx.arc(guide.x, guide.y, 4, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  function drawCaveDarkness(level) {
    const player = game.player;
    if (!player) return;
    ctx.save();
    ctx.fillStyle = "rgba(12,27,33,.48)";
    const x = player.x + player.w / 2;
    const y = player.y + player.h / 2;
    const left = game.cameraX - 200;
    const width = getViewWidth() + 400;
    ctx.beginPath();
    ctx.rect(left, 0, width, H);
    ctx.roundRect(x - 145, y - 130, 290, 260, 110);
    ctx.fill("evenodd");
    ctx.restore();
  }

  function drawLevelHints(level) {
    const visibleWidth = getViewWidth();
    for (const hint of level.hints) {
      if (hint.x > game.cameraX - 220 && hint.x < game.cameraX + visibleWidth + 220) drawHintBoard(hint);
    }
  }

  function drawRailAdventureDecorations(level, visibleWidth) {
    const markers = [
      { x: 720, y: 620, label: "START" },
      { x: 2025, y: 620, label: "HALT" },
      { x: 3615, y: 595, label: "WEICHE" },
      { x: 5060, y: 620, label: "TALFAHRT" },
      { x: 7840, y: 590, label: "DEPOT" },
    ];
    for (const marker of markers) {
      if (marker.x < game.cameraX - 180 || marker.x > game.cameraX + visibleWidth + 180) continue;
      drawRailRouteMarker(marker.x, marker.y, marker.label);
    }
    for (const zone of level.railBoostZones || []) {
      if (zone.x + zone.w < game.cameraX - 120 || zone.x > game.cameraX + visibleWidth + 120) continue;
      ctx.save();
      ctx.globalAlpha = .32;
      ctx.strokeStyle = "#d6ecf2";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let row = 0; row < 3; row += 1) {
        const y = zone.y - 58 - row * 22;
        const offset = wrap(game.time * 185 + row * 87, 0, 96);
        for (let x = zone.x - 80 + offset; x < zone.x + zone.w; x += 96) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.quadraticCurveTo(x + 18, y - 6, x + 43, y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }

  function drawRailRouteMarker(x, y, label) {
    ctx.save();
    ctx.fillStyle = "#5b4535";
    ctx.fillRect(x - 3, y - 75, 6, 75);
    ctx.fillStyle = "#255f86";
    ctx.beginPath(); ctx.roundRect(x - 42, y - 93, 84, 31, 7); ctx.fill();
    ctx.strokeStyle = "#dcecf0";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#f5f0d9";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(label, x, y - 73);
    ctx.fillStyle = "#f5d568";
    ctx.beginPath(); ctx.arc(x - 29, y - 77, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSeiffenDecorations(level, visibleWidth) {
    for (const decor of level.decorations) {
      if (decor.x < game.cameraX - 260 || decor.x > game.cameraX + visibleWidth + 260) continue;
      switch (decor.type) {
        case "village-sign":
          drawVillageSign(decor.x, decor.y, decor.text);
          break;
        case "workshop":
          drawWorkshop(decor.x, decor.y, decor.scale);
          break;
        case "wood-table":
          drawWoodTable(decor.x, decor.y, decor.scale);
          break;
        case "toy-arch":
          drawToyArch(decor.x, decor.y, decor.scale);
          break;
        case "log-pile":
          drawLogPile(decor.x, decor.y, decor.scale);
          break;
        case "finish-house":
          drawFinishHouse(decor.x, decor.y, decor.scale);
          break;
      }
    }
  }

  function drawVillageSign(x, y, text) {
    ctx.save();
    ctx.fillStyle = "#67472f";
    ctx.fillRect(x - 4, y - 91, 8, 91);
    ctx.fillStyle = "#c58a4c";
    ctx.beginPath();
    ctx.roundRect(x - 52, y - 101, 104, 38, 7);
    ctx.fill();
    ctx.strokeStyle = "#765033";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#fff1c9";
    ctx.font = "900 13px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y - 77);
    ctx.restore();
  }

  function drawWorkshop(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = .94;
    drawFachwerkHouse(x, y, scale, "#b24b50");
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#5d4030";
    ctx.fillRect(22, -126, 15, 34);
    for (let i = 0; i < 3; i += 1) {
      const drift = Math.sin(game.time * .8 + i) * 4;
      ctx.globalAlpha = .22 - i * .045;
      ctx.fillStyle = "#f4eee1";
      ctx.beginPath();
      ctx.arc(29 + drift, -137 - i * 17, 9 + i * 4, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWoodTable(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#67472f";
    ctx.fillRect(-70, -57, 140, 13);
    ctx.fillRect(-55, -45, 10, 45);
    ctx.fillRect(45, -45, 10, 45);
    const colors = ["#c14d54", "#efbf46", "#368476"];
    for (let i = 0; i < 3; i += 1) {
      const px = -42 + i * 42;
      ctx.fillStyle = colors[i];
      ctx.beginPath(); ctx.arc(px, -71, 9, 0, TAU); ctx.fill();
      ctx.fillRect(px - 7, -63, 14, 19);
      ctx.fillStyle = "#f6dfb4";
      ctx.beginPath(); ctx.arc(px, -73, 3, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  function drawToyArch(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#8b5d35";
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, 0, 98, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-102, 0); ctx.lineTo(102, 0); ctx.stroke();
    for (let i = -3; i <= 3; i += 1) {
      const px = i * 24;
      const py = -Math.sqrt(Math.max(0, 92 ** 2 - px ** 2));
      ctx.fillStyle = "#f2c85c";
      ctx.beginPath(); ctx.arc(px, py, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = "#b8793d";
      ctx.beginPath(); ctx.arc(px, -18, 6, 0, TAU); ctx.fill();
      ctx.fillRect(px - 4, -12, 8, 12);
    }
    ctx.restore();
  }

  function drawLogPile(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    for (let row = 0; row < 2; row += 1) {
      for (let i = 0; i < 4 - row; i += 1) {
        const px = -55 + i * 36 + row * 18;
        const py = -14 - row * 27;
        ctx.fillStyle = "#765137";
        ctx.beginPath();
        ctx.roundRect(px, py - 16, 41, 22, 9); ctx.fill();
        ctx.fillStyle = "#bd8750";
        ctx.beginPath(); ctx.arc(px + 36, py - 5, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(91,57,36,.55)";
        ctx.beginPath(); ctx.arc(px + 36, py - 5, 5, 0, TAU); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawFinishHouse(x, y, scale) {
    drawFachwerkHouse(x, y, scale, "#3f8a65");
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#f2c85c";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? 8 : 16;
      const px = 64 + Math.cos(angle) * radius;
      const py = -87 + Math.sin(angle) * radius;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawHintBoard(hint) {
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.shadowBlur = 0;
    ctx.font = "900 13px Arial, sans-serif";
    const width = Math.max(145, ctx.measureText(hint.text).width + 34);
    ctx.fillStyle = "#6c4b33";
    ctx.fillRect(hint.x - 3, hint.y - 71, 6, 71);
    ctx.fillStyle = "rgba(255,250,230,.94)";
    ctx.beginPath();
    ctx.roundRect(hint.x - width / 2, hint.y - 112, width, 45, 12);
    ctx.fill();
    ctx.strokeStyle = "#c18a50";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#102f2a";
    ctx.textAlign = "center";
    ctx.fillText(hint.text, hint.x, hint.y - 84);
    ctx.restore();
  }

  function drawSecretStar(level) {
    const x = 1545;
    const y = 214;
    ctx.save();
    ctx.globalAlpha = level.secret.found ? 1 : .7 + Math.sin(game.time * 3) * .18;
    ctx.shadowColor = "#ffe184";
    ctx.shadowBlur = level.secret.found ? 20 : 8;
    ctx.fillStyle = level.secret.found ? "#f4c84d" : "#c78b3e";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const angle = -Math.PI / 2 + i * Math.PI / 5;
      const radius = i % 2 ? 10 : 22;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function drawPlatform(platform, level) {
    ctx.save();
    if (!platform.ground) {
      ctx.globalAlpha = .23;
      ctx.fillStyle = "#132c25";
      ctx.filter = "blur(3px)";
      ctx.beginPath();
      ctx.ellipse(platform.x + platform.w * .53, platform.y + 38, Math.min(92, platform.w * .38), 9, 0, 0, TAU);
      ctx.fill();
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    }
    if (platform.toggle) {
      ctx.globalAlpha = platform.visibility ?? 1;
      ctx.shadowColor = "#ffe178";
      ctx.shadowBlur = 10 * (platform.visibility ?? 1);
    }
    if (platform.type === "train") {
      drawTrainPlatform(platform, level);
      if (platform.conveyor) drawConveyorMarkers(platform);
      ctx.restore();
      return;
    }
    if (platform.type === "wood") {
      drawWoodPlatform(platform);
      if (platform.conveyor) drawConveyorMarkers(platform);
      ctx.restore();
      return;
    }

    if (platform.type === "roof") {
      drawSlateRoof(platform);
      ctx.restore();
      return;
    }

    drawMossyRockPlatform(platform, level);
    if (platform.conveyor) drawConveyorMarkers(platform);
    ctx.restore();
  }

  function drawConveyorMarkers(platform) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = .72;
    ctx.fillStyle = "#f8d46c";
    const direction = Math.sign(platform.conveyor) || 1;
    for (let x = platform.x + 24; x < platform.x + platform.w - 18; x += 42) {
      ctx.beginPath();
      ctx.moveTo(x - direction * 7, platform.y + 6);
      ctx.lineTo(x + direction * 7, platform.y + 11);
      ctx.lineTo(x - direction * 7, platform.y + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWoodPlatform(platform) {
    const x = platform.x;
    const y = platform.y;
    const beamGradient = ctx.createLinearGradient(0, y + 7, 0, y + 35);
    beamGradient.addColorStop(0, "#5b3927");
    beamGradient.addColorStop(1, "#2f211a");
    ctx.fillStyle = beamGradient;
    ctx.beginPath(); ctx.roundRect(x - 7, y + 6, platform.w + 14, 28, 7); ctx.fill();

    if (!platform.moving && platform.w > 170) {
      ctx.strokeStyle = "#563722";
      ctx.lineWidth = 9;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x + 24, y + 30); ctx.lineTo(x + 48, y + 88);
      ctx.moveTo(x + platform.w - 24, y + 30); ctx.lineTo(x + platform.w - 48, y + 88);
      ctx.moveTo(x + 38, y + 70); ctx.lineTo(x + platform.w - 38, y + 70);
      ctx.stroke();
      ctx.strokeStyle = "rgba(229,168,91,.28)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 42, y + 67); ctx.lineTo(x + platform.w - 42, y + 67); ctx.stroke();
    }

    const plankW = 38;
    for (let plankIndex = 0, offset = 0; offset < platform.w; plankIndex += 1, offset += plankW) {
      const px = x + offset;
      const width = Math.min(plankW - 3, platform.w - offset);
      const plank = ctx.createLinearGradient(0, y - 2, 0, y + 20);
      plank.addColorStop(0, plankIndex % 2 ? "#e0a45b" : "#c88b49");
      plank.addColorStop(.5, plankIndex % 2 ? "#b9793e" : "#a96938");
      plank.addColorStop(1, "#75462c");
      ctx.fillStyle = plank;
      ctx.beginPath(); ctx.roundRect(px, y - 2, width, 22, 4); ctx.fill();
      ctx.strokeStyle = "rgba(255,220,157,.24)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px + 4, y + 2); ctx.lineTo(px + width - 4, y + 2); ctx.stroke();
      ctx.fillStyle = "#493227";
      ctx.beginPath(); ctx.arc(px + 7, y + 10, 2, 0, TAU); ctx.fill();
    }

    if (platform.moving) {
      ctx.strokeStyle = "rgba(55,38,29,.55)";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x + 18, y + 6); ctx.lineTo(x + platform.w - 18, y + 6); ctx.stroke();
    }
  }

  function drawSlateRoof(platform) {
    const x = platform.x;
    const y = platform.y;
    const roofGradient = ctx.createLinearGradient(0, y - 26, 0, y + 13);
    roofGradient.addColorStop(0, "#69747a");
    roofGradient.addColorStop(.5, "#46545b");
    roofGradient.addColorStop(1, "#26363d");
    ctx.fillStyle = roofGradient;
    ctx.beginPath();
    ctx.moveTo(x - 14, y + 12); ctx.lineTo(x + 21, y - 25);
    ctx.lineTo(x + platform.w - 17, y - 25); ctx.lineTo(x + platform.w + 14, y + 12);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(197,218,221,.24)";
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 3; row += 1) {
      const py = y - 18 + row * 10;
      ctx.beginPath(); ctx.moveTo(x + 13 - row * 8, py); ctx.lineTo(x + platform.w - 10 + row * 7, py); ctx.stroke();
      for (let px = x + 17 + (row % 2) * 11; px < x + platform.w - 8; px += 22) {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 6, py + 9); ctx.stroke();
      }
    }
    ctx.fillStyle = "#6d442c";
    ctx.fillRect(x - 8, y + 10, platform.w + 16, 8);
    ctx.fillStyle = "rgba(246,194,108,.34)";
    ctx.fillRect(x - 6, y + 10, platform.w + 12, 2);
  }

  function drawMossyRockPlatform(platform, level) {
    const x = platform.x;
    const y = platform.y;
    // Keep procedural surface details anchored to the platform's origin. Moving
    // platforms may change their draw position, but their rocks and moss must not.
    const visualSeed = Number.isFinite(platform.baseX) ? platform.baseX : x;
    const isMine = platform.type === "mine";
    const depth = Math.max(24, Math.min(platform.h, platform.ground ? 210 : 145));
    const bodyGradient = ctx.createLinearGradient(0, y, 0, y + depth);
    bodyGradient.addColorStop(0, isMine ? "#53605c" : "#667467");
    bodyGradient.addColorStop(.48, isMine ? "#34413f" : "#46564a");
    bodyGradient.addColorStop(1, isMine ? "#202c2d" : "#283a31");
    ctx.fillStyle = bodyGradient;
    ctx.beginPath(); ctx.roundRect(x, y, platform.w, platform.h, platform.ground ? 8 : 14); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, platform.w, depth, 12); ctx.clip();
    const rowHeight = 43;
    for (let row = 0; row < Math.ceil(depth / rowHeight) + 1; row += 1) {
      const py = y + 8 + row * rowHeight;
      const offset = row % 2 ? -39 : -7;
      for (let col = 0; col < Math.ceil(platform.w / 70) + 2; col += 1) {
        const seed = visualSeed * .013 + row * 31 + col * 17;
        const px = x + offset + col * 70;
        const width = 59 + hash(seed) * 21;
        const height = 34 + hash(seed + 7) * 13;
        ctx.fillStyle = isMine
          ? (col + row) % 3 === 0 ? "#4d5a56" : "#3d4b48"
          : (col + row) % 3 === 0 ? "#697668" : (col + row) % 3 === 1 ? "#59675b" : "#4d5d51";
        ctx.shadowColor = "rgba(8,20,16,.34)";
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        const rockY = py + hash(seed + 19) * 5;
        ctx.moveTo(px + 9, rockY + 2);
        ctx.lineTo(px + width * .58, rockY);
        ctx.lineTo(px + width - 8, rockY + 6);
        ctx.lineTo(px + width, rockY + height * .48);
        ctx.lineTo(px + width - 10, rockY + height - 3);
        ctx.lineTo(px + width * .37, rockY + height);
        ctx.lineTo(px + 3, rockY + height - 9);
        ctx.lineTo(px, rockY + height * .35);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = isMine ? "rgba(12,24,24,.54)" : "rgba(24,42,33,.45)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.strokeStyle = "rgba(229,236,207,.12)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px + 10, rockY + 8); ctx.quadraticCurveTo(px + width * .55, rockY + 2, px + width - 11, rockY + 9);
        ctx.stroke();
        if (!isMine && (row + col) % 4 === 1) {
          ctx.fillStyle = "rgba(111,139,75,.45)";
          ctx.beginPath(); ctx.ellipse(px + width * .68, rockY + height * .42, 7, 3.5, -.35, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.restore();

    const cap = ctx.createLinearGradient(0, y - 12, 0, y + 14);
    cap.addColorStop(0, isMine ? "#9b8c62" : "#c0cf6e");
    cap.addColorStop(.38, isMine ? "#6f765e" : "#79984e");
    cap.addColorStop(1, isMine ? "#47534d" : "#456b3c");
    ctx.fillStyle = cap;
    ctx.beginPath(); ctx.roundRect(x - 3, y - 9, platform.w + 6, 20, 9); ctx.fill();
    ctx.fillStyle = isMine ? "rgba(217,180,91,.22)" : "#3f6b38";
    const dripCount = Math.min(15, Math.max(2, Math.floor(platform.w / 42)));
    for (let i = 0; i < dripCount; i += 1) {
      const px = x + 8 + hash(visualSeed * .041 + i * 17) * Math.max(1, platform.w - 16);
      const drop = 4 + hash(visualSeed * .081 + i * 29) * 14;
      ctx.beginPath();
      ctx.moveTo(px - 5, y + 7); ctx.quadraticCurveTo(px, y + 7 + drop, px + 4, y + 7); ctx.closePath(); ctx.fill();
    }

    if (!isMine) {
      const tuftCount = Math.min(13, Math.max(1, Math.floor(platform.w / 58)));
      ctx.lineCap = "round";
      for (let i = 0; i < tuftCount; i += 1) {
        const tx = x + 16 + hash(visualSeed * .07 + i * 11) * Math.max(1, platform.w - 32);
        const tall = 8 + hash(visualSeed * .13 + i * 23) * 8;
        ctx.strokeStyle = i % 3 ? "#4b793f" : "#88a94e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx, y - 6); ctx.quadraticCurveTo(tx - 4, y - tall, tx - 8, y - tall - 1);
        ctx.moveTo(tx, y - 6); ctx.quadraticCurveTo(tx + 3, y - tall + 1, tx + 7, y - tall);
        ctx.stroke();
        if (i % 5 === 1 && platform.w > 105) {
          ctx.fillStyle = i % 2 ? "#f2cf62" : "#e8e8dc";
          ctx.beginPath(); ctx.arc(tx + 6, y - tall - 2, 2.7, 0, TAU); ctx.fill();
        }
      }
    } else if (platform.w > 90) {
      ctx.save();
      ctx.shadowColor = "#ffb42b";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "rgba(255,177,45,.72)";
      for (let i = 0; i < Math.min(4, Math.floor(platform.w / 95)); i += 1) {
        const px = x + 35 + hash(visualSeed + i * 47) * (platform.w - 70);
        ctx.beginPath(); ctx.moveTo(px, y + 23); ctx.lineTo(px + 5, y + 33); ctx.lineTo(px, y + 42); ctx.lineTo(px - 5, y + 33); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawTrainPlatform(platform, level) {
    const x = platform.x;
    const y = platform.y;
    const body = ctx.createLinearGradient(0, y - 8, 0, y + 35);
    body.addColorStop(0, "#f8fbfc");
    body.addColorStop(.56, "#e4edf1");
    body.addColorStop(.58, "#1388c9");
    body.addColorStop(1, "#056aab");

    // Die befahrbaren Wagen greifen Form und Lackierung der Chemnitzer CVAG-Bahn auf.
    ctx.shadowColor = "rgba(8,35,49,.32)";
    ctx.shadowBlur = 7;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(x + 2, y - 7, platform.w - 4, 41, [9, 13, 6, 6]);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = "#26343c";
    ctx.beginPath();
    ctx.roundRect(x + 9, y - 2, platform.w - 24, 17, 4);
    ctx.fill();
    const windowCount = Math.max(2, Math.floor((platform.w - 45) / 34));
    const windowGap = (platform.w - 49) / windowCount;
    for (let index = 0; index < windowCount; index += 1) {
      const px = x + 15 + index * windowGap;
      ctx.fillStyle = index % 2 ? "#9fc4d1" : "#b8d9df";
      ctx.beginPath();
      ctx.roundRect(px, y + 1, Math.max(14, windowGap - 7), 10, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.42)";
      ctx.fillRect(px + 2, y + 2, 3, 7);
    }

    // Dunkle, abgerundete Front mit den weißen Zierlinien der Referenzbahn.
    ctx.fillStyle = "#1d2a31";
    ctx.beginPath();
    ctx.roundRect(x + platform.w - 25, y - 4, 20, 30, [8, 11, 5, 4]);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.88)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + platform.w - 23, y + 18);
    ctx.quadraticCurveTo(x + platform.w - 15, y + 23, x + platform.w - 6, y + 17);
    ctx.stroke();
    ctx.fillStyle = "#fff4b5";
    ctx.beginPath(); ctx.arc(x + platform.w - 10, y + 20, 1.8, 0, TAU); ctx.fill();

    // Das bereitgestellte Logo wird aus der Vorlage ausgeschnitten und sauber aufgesetzt.
    const logoWidth = Math.min(42, platform.w * .23);
    const logoX = x + Math.max(38, platform.w * .48 - logoWidth / 2);
    if (cvagLogoImage.complete && cvagLogoImage.naturalWidth) {
      ctx.drawImage(cvagLogoImage, 18, 150, 411, 155, logoX, y + 17, logoWidth, 13);
    } else {
      ctx.fillStyle = "#087fc2";
      ctx.font = "800 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CVAG", logoX + logoWidth / 2, y + 28);
    }

    ctx.strokeStyle = "#2e3a40";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + platform.w * .57, y - 7);
    ctx.lineTo(x + platform.w * .63, y - 20);
    ctx.lineTo(x + platform.w * .71, y - 7);
    ctx.moveTo(x + platform.w * .61, y - 19);
    ctx.lineTo(x + platform.w * .69, y - 19);
    ctx.stroke();

    ctx.fillStyle = "#172127";
    ctx.beginPath();
    ctx.arc(x + 31, y + 35, 10, 0, TAU);
    ctx.arc(x + platform.w - 34, y + 35, 10, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#8fa2a9";
    ctx.beginPath();
    ctx.arc(x + 31, y + 35, 4, 0, TAU);
    ctx.arc(x + platform.w - 34, y + 35, 4, 0, TAU);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.fillRect(x + 9, y - 7, platform.w - 24, 2);
  }

  function drawSpring(spring, level) {
    const squish = Math.max(0, Math.sin(game.time * 5 + spring.x) * 0.08);
    ctx.save();
    ctx.translate(spring.x + spring.w / 2, spring.y + spring.h);
    ctx.scale(1, 1 - squish);
    ctx.shadowColor = "rgba(11,24,22,.35)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 4;
    ctx.strokeStyle = "#36423f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-15, 0); ctx.lineTo(15, -7); ctx.lineTo(-15, -14); ctx.lineTo(15, -21);
    ctx.stroke();
    ctx.fillStyle = level.accent;
    ctx.beginPath();
    ctx.roundRect(-28, -31, 56, 12, 6); ctx.fill();
    ctx.fillStyle = "#f2c44f";
    ctx.beginPath();
    ctx.roundRect(-22, -31, 44, 4, 3); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#813d35";
    ctx.beginPath(); ctx.roundRect(-30, -20, 60, 7, 4); ctx.fill();
    ctx.restore();
  }

  function drawCrystal(crystal, level) {
    const bob = Math.sin(game.time * 3 + crystal.phase) * 7;
    const x = crystal.x;
    const y = crystal.y + bob;
    ctx.save();
    const crystalGradient = ctx.createLinearGradient(x - 12, y - 20, x + 12, y + 18);
    crystalGradient.addColorStop(0, "#fff3a2");
    crystalGradient.addColorStop(.3, "#ffc43b");
    crystalGradient.addColorStop(.72, "#ef8b0d");
    crystalGradient.addColorStop(1, "#b94b0c");
    ctx.shadowColor = "#ffb51f";
    ctx.shadowBlur = 24;
    ctx.fillStyle = crystalGradient;
    ctx.beginPath();
    ctx.moveTo(x, y - 21); ctx.lineTo(x + 14, y - 5); ctx.lineTo(x + 8, y + 18); ctx.lineTo(x - 8, y + 18); ctx.lineTo(x - 14, y - 5); ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,250,205,.9)";
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x, y + 16); ctx.moveTo(x + 3, y - 5); ctx.lineTo(x + 13, y - 5); ctx.moveTo(x + 3, y - 5); ctx.lineTo(x - 13, y - 5); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.beginPath(); ctx.moveTo(x - 2, y - 16); ctx.lineTo(x + 3, y - 5); ctx.lineTo(x, y + 8); ctx.lineTo(x - 6, y - 5); ctx.closePath(); ctx.fill();
    const twinkle = .45 + Math.sin(game.time * 5 + crystal.phase) * .35;
    ctx.globalAlpha = twinkle;
    ctx.strokeStyle = "#fff9d8";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 18, y - 22); ctx.lineTo(x + 18, y - 8); ctx.moveTo(x + 11, y - 15); ctx.lineTo(x + 25, y - 15); ctx.stroke();
    if (level.bonusMultiplier > 1) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff7cf";
      ctx.beginPath(); ctx.roundRect(x + 13, y + 12, 26, 14, 6); ctx.fill();
      ctx.fillStyle = "#9b571d";
      ctx.font = "900 9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`×${level.bonusMultiplier}`, x + 26, y + 23);
    }
    ctx.restore();
  }

  function drawLifePickup(life, level) {
    const bob = Math.sin(game.time * 2.8 + life.phase) * 6;
    const pulse = 1 + Math.sin(game.time * 4.2 + life.phase) * .055;
    ctx.save();
    ctx.translate(life.x, life.y + bob);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = "#ff6174";
    ctx.shadowBlur = 22;
    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, 25);
    glow.addColorStop(0, "rgba(255,246,208,.95)");
    glow.addColorStop(1, "rgba(255,118,132,.08)");
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.fill();
    ctx.fillStyle = "#e94f67";
    ctx.strokeStyle = "#fff3d1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 17);
    ctx.bezierCurveTo(-27, 2, -17, -19, 0, -9);
    ctx.bezierCurveTo(17, -19, 27, 2, 0, 17);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.9)";
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 6); ctx.moveTo(-6.5, -.5); ctx.lineTo(6.5, -.5); ctx.stroke();
    ctx.fillStyle = level.accent;
    ctx.beginPath(); ctx.arc(17, -16, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRegionalItem(item, level) {
    const bob = Math.sin(game.time * 2.6 + item.x * .01) * 5;
    const x = item.x;
    const y = item.y + bob;
    ctx.save();
    ctx.translate(x, y);
    if (item.rare) {
      ctx.strokeStyle = "rgba(255,247,190,.85)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, 25 + Math.sin(game.time * 3 + x) * 2, 0, TAU); ctx.stroke();
    }
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = "rgba(255,252,225,.88)";
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "#fff3bf";
    ctx.lineWidth = 2;
    switch (item.type) {
      case "ticket":
        ctx.rotate(-.12); ctx.beginPath(); ctx.roundRect(-15, -10, 30, 20, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-8, -2, 16, 3);
        break;
      case "lantern":
        ctx.beginPath(); ctx.roundRect(-10, -9, 20, 22, 5); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, -8, 9, Math.PI, 0); ctx.stroke();
        ctx.fillStyle = "#fff0a1"; ctx.beginPath(); ctx.arc(0, 2, 5, 0, TAU); ctx.fill();
        break;
      case "coin":
      case "badge":
        ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(-4, -4, 4, 0, TAU); ctx.fill();
        break;
      case "heart":
        ctx.beginPath(); ctx.moveTo(0, 14); ctx.bezierCurveTo(-23, 1, -13, -17, 0, -7); ctx.bezierCurveTo(13, -17, 23, 1, 0, 14); ctx.fill(); ctx.stroke();
        break;
      case "key":
        ctx.beginPath(); ctx.arc(-7, -2, 7, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(14, 13); ctx.lineTo(18, 9); ctx.moveTo(10, 9); ctx.lineTo(14, 5); ctx.stroke();
        break;
      case "flag":
        ctx.fillRect(-11, -15, 3, 30); ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(15, -7); ctx.lineTo(-8, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case "candle":
        ctx.fillRect(-7, -4, 14, 18); ctx.beginPath(); ctx.moveTo(0, -18); ctx.quadraticCurveTo(9, -8, 0, -3); ctx.quadraticCurveTo(-8, -9, 0, -18); ctx.fill();
        break;
      case "figure":
        ctx.beginPath(); ctx.arc(0, -9, 7, 0, TAU); ctx.fill(); ctx.fillRect(-9, -2, 18, 17); ctx.fillRect(-14, 1, 5, 12); ctx.fillRect(9, 1, 5, 12); ctx.stroke();
        break;
      default:
        ctx.beginPath();
        for (let i = 0; i < 10; i += 1) {
          const angle = -Math.PI / 2 + i * Math.PI / 5;
          const radius = i % 2 ? 7 : 15;
          if (!i) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
          else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  function drawHazard(hazard, level) {
    const bounce = Math.abs(Math.sin(game.time * hazard.speed * 2 + hazard.phase)) * 8;
    const x = hazard.x;
    const y = hazard.y - bounce;
    ctx.save();
    if (hazard.aquatic || level.underwater) {
      const pulse = 1 + Math.sin(game.time * 2.1 + hazard.phase) * .08;
      ctx.translate(x, y);
      ctx.scale(pulse, 2 - pulse);
      ctx.shadowColor = "#55e0d8";
      ctx.shadowBlur = 18;
      const jelly = ctx.createRadialGradient(-6, -8, 2, 0, 0, 31);
      jelly.addColorStop(0, "rgba(133,239,230,.88)");
      jelly.addColorStop(1, "rgba(45,112,126,.78)");
      ctx.fillStyle = jelly;
      ctx.beginPath();
      ctx.arc(0, -3, 24, Math.PI, 0);
      ctx.quadraticCurveTo(23, 15, 13, 12);
      ctx.quadraticCurveTo(5, 21, 0, 12);
      ctx.quadraticCurveTo(-6, 21, -14, 12);
      ctx.quadraticCurveTo(-24, 15, -24, -3);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#f7fbef";
      ctx.beginPath(); ctx.arc(-7, -5, 5.5, 0, TAU); ctx.arc(7, -5, 5.5, 0, TAU); ctx.fill();
      ctx.fillStyle = "#17393f";
      ctx.beginPath(); ctx.arc(-6, -4, 2.1, 0, TAU); ctx.arc(8, -4, 2.1, 0, TAU); ctx.fill();
      ctx.strokeStyle = "rgba(168,245,239,.7)";
      ctx.lineWidth = 2;
      for (let tentacle = -2; tentacle <= 2; tentacle += 1) {
        ctx.beginPath();
        ctx.moveTo(tentacle * 8, 11);
        ctx.quadraticCurveTo(tentacle * 8 + Math.sin(game.time * 2 + tentacle) * 6, 23, tentacle * 8 - 3, 31);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    if (hazard.kind === "sunBoost") {
      const rayWiggle = Math.sin(game.time * hazard.speed * 6 + hazard.phase) * .12;
      ctx.translate(x, y);
      ctx.shadowColor = "rgba(255,185,63,.82)";
      ctx.shadowBlur = 16;
      ctx.strokeStyle = "#e88932";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      for (let ray = 0; ray < 10; ray += 1) {
        const angle = (ray / 10) * TAU + rayWiggle;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 21, Math.sin(angle) * 21);
        ctx.lineTo(Math.cos(angle) * 29, Math.sin(angle) * 29);
        ctx.stroke();
      }
      const sunFace = ctx.createRadialGradient(-6, -8, 2, 0, 0, 23);
      sunFace.addColorStop(0, "#fff3a6");
      sunFace.addColorStop(.65, "#ffd45c");
      sunFace.addColorStop(1, "#ef9a36");
      ctx.fillStyle = sunFace;
      ctx.beginPath(); ctx.arc(0, 0, 21, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#fff9de";
      ctx.beginPath(); ctx.arc(-7, -4, 5.8, 0, TAU); ctx.arc(7, -4, 5.8, 0, TAU); ctx.fill();
      ctx.fillStyle = "#1e3834";
      ctx.beginPath(); ctx.arc(-6, -3, 2, 0, TAU); ctx.arc(8, -3, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = "#f09272";
      ctx.beginPath(); ctx.ellipse(-13, 6, 4, 2.5, 0, 0, TAU); ctx.ellipse(13, 6, 4, 2.5, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = "#a95a35";
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(0, 6, 6, .18, Math.PI - .18); ctx.stroke();
      ctx.restore();
      return;
    }
    const cloudStyles = [
      { dark: "#6f7784", light: "#cbd0d8", highlight: "#eff1f4", outline: "#505966", blush: "#d5899c" },
      { dark: "#b86f8d", light: "#eca0b6", highlight: "#ffe3ea", outline: "#8f4d68", blush: "#ce6f8b" },
      { dark: "#8e8797", light: "#c4bccd", highlight: "#eee9f1", outline: "#696172", blush: "#cf829a" },
    ];
    const cloud = cloudStyles[Math.abs(Math.floor(hazard.phase * 7)) % cloudStyles.length];
    const wobble = Math.sin(game.time * hazard.speed * 3.1 + hazard.phase) * (hazard.motionKind === "loop" ? .08 : .035);
    const squash = hazard.motionKind === "hop" ? 1 + Math.sin(game.time * hazard.speed * 3.3 + hazard.phase) * .05 : 1;
    ctx.translate(x, y);
    ctx.rotate(wobble);
    ctx.scale(squash, 2 - squash);
    ctx.translate(-x, -y);
    const driftDirection = Math.cos(game.time * hazard.speed + hazard.phase) >= 0 ? 1 : -1;
    ctx.globalAlpha = .22;
    ctx.fillStyle = cloud.light;
    for (let puff = 0; puff < 2; puff += 1) {
      ctx.beginPath();
      ctx.arc(x - driftDirection * (31 + puff * 11), y + 5 + puff * 5, 5 - puff, 0, TAU);
      ctx.fill();
    }
    ctx.globalAlpha = .26;
    ctx.fillStyle = "#172927";
    ctx.beginPath(); ctx.ellipse(x, y + 27, 30, 8, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowColor = cloud.dark;
    ctx.shadowBlur = 7;
    ctx.fillStyle = cloud.dark;
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * TAU;
      ctx.beginPath();
      ctx.arc(x + Math.cos(angle) * 15, y + Math.sin(angle) * 12, 13 + (i % 2) * 3, 0, TAU);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = cloud.light;
    ctx.beginPath();
    ctx.arc(x - 15, y + 2, 13, 0, TAU);
    ctx.arc(x - 4, y - 9, 16, 0, TAU);
    ctx.arc(x + 12, y - 7, 15, 0, TAU);
    ctx.arc(x + 21, y + 5, 12, 0, TAU);
    ctx.ellipse(x + 2, y + 9, 26, 13, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = cloud.outline;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = cloud.highlight;
    ctx.globalAlpha = .82;
    ctx.beginPath(); ctx.ellipse(x - 8, y - 12, 11, 6, -.25, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f8f4e8";
    ctx.beginPath(); ctx.arc(x - 8, y - 2, 6, 0, TAU); ctx.arc(x + 8, y - 2, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = "#172927";
    const eyeLook = game.player ? Math.max(-1.8, Math.min(1.8, (game.player.x + game.player.w * .5 - x) * .018)) : 0;
    ctx.beginPath(); ctx.arc(x - 7 + eyeLook, y - 1, 2.5, 0, TAU); ctx.arc(x + 7 + eyeLook, y - 1, 2.5, 0, TAU); ctx.fill();
    ctx.fillStyle = cloud.blush;
    ctx.globalAlpha = .72;
    ctx.beginPath(); ctx.ellipse(x - 17, y + 7, 4, 2.5, 0, 0, TAU); ctx.ellipse(x + 17, y + 7, 4, 2.5, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = cloud.outline;
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(x, y + 8, 7, .18, Math.PI - .18); ctx.stroke();
    ctx.restore();
  }

  function drawCheckpoint(checkpoint, level) {
    ctx.save();
    ctx.fillStyle = "#65442f";
    ctx.fillRect(checkpoint.x, checkpoint.y, 7, 86);
    ctx.fillStyle = checkpoint.active ? "#ffd35f" : "#eee6cf";
    ctx.beginPath();
    ctx.moveTo(checkpoint.x + 7, checkpoint.y + 5);
    ctx.quadraticCurveTo(checkpoint.x + 44, checkpoint.y - 6, checkpoint.x + 58, checkpoint.y + 15);
    ctx.quadraticCurveTo(checkpoint.x + 39, checkpoint.y + 35, checkpoint.x + 7, checkpoint.y + 24);
    ctx.closePath(); ctx.fill();
    if (checkpoint.active) {
      ctx.shadowColor = "#ffd35f";
      ctx.shadowBlur = 25;
      ctx.fillStyle = "#fff4b4";
      ctx.beginPath(); ctx.arc(checkpoint.x + 4, checkpoint.y, 6, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = checkpoint.active ? "#fff3bf" : "#f7edd5";
    ctx.font = "900 9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(checkpoint.label || "RAST", checkpoint.x + 11, checkpoint.y + 50);
    ctx.restore();
  }

  function drawSecretEntrance(entrance, level) {
    const discovered = level.secret?.found;
    ctx.save();
    const glow = .6 + Math.sin(game.time * 2.2) * .08;
    ctx.shadowColor = "#f0b84c";
    ctx.shadowBlur = discovered ? 24 : 12;
    ctx.fillStyle = "#263a35";
    ctx.beginPath();
    ctx.roundRect(entrance.x, entrance.y + 18, entrance.w, entrance.h - 18, 24);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = discovered ? "#e6b54b" : "#735d3d";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(entrance.x + entrance.w / 2, entrance.y + 37, entrance.w * .4, Math.PI, 0);
    ctx.lineTo(entrance.x + entrance.w - 6, entrance.y + entrance.h);
    ctx.moveTo(entrance.x + 6, entrance.y + entrance.h);
    ctx.lineTo(entrance.x + 6, entrance.y + 37);
    ctx.stroke();
    ctx.globalAlpha = glow;
    ctx.fillStyle = "#ffd66d";
    ctx.beginPath(); ctx.arc(entrance.x + entrance.w / 2, entrance.y + 46, 5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#f8edcf";
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(discovered ? "GEÖFFNET" : "?", entrance.x + entrance.w / 2, entrance.y + 69);
    ctx.restore();
  }

  function drawGoal(goal, level) {
    const glow = 0.78 + Math.sin(game.time * 3) * 0.12;
    ctx.save();
    if (level.underwater) {
      ctx.translate(goal.x + goal.w / 2, goal.y + goal.h / 2);
      ctx.shadowColor = "#67eee5";
      ctx.shadowBlur = 30;
      ctx.strokeStyle = "#79eee5";
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 50, 0, 0, TAU); ctx.stroke();
      ctx.globalAlpha = glow * .62;
      ctx.fillStyle = "#4ac6cf";
      ctx.beginPath(); ctx.ellipse(0, 0, 23, 43, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff0a6";
      ctx.font = "900 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("✦", 0, 7);
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#66503f";
    ctx.beginPath();
    ctx.roundRect(goal.x, goal.y + 30, goal.w, goal.h - 30, 26); ctx.fill();
    ctx.fillStyle = level.accent;
    ctx.globalAlpha = glow;
    ctx.beginPath(); ctx.ellipse(goal.x + goal.w / 2, goal.y + 70, 25, 45, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#f0c766";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(goal.x + goal.w / 2, goal.y + 69, 28, Math.PI, 0); ctx.lineTo(goal.x + goal.w - 8, goal.y + 111); ctx.lineTo(goal.x + 8, goal.y + 111); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = "#f4d978";
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = -Math.PI / 2 + i * Math.PI / 4;
      const r = i % 2 ? 5 : 11;
      const x = goal.x + goal.w / 2 + Math.cos(a) * r;
      const y = goal.y + 18 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    if (level.isBonusRoom) {
      ctx.fillStyle = "#fff3c4";
      ctx.font = "900 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("ZURÜCK", goal.x + goal.w / 2, goal.y + 104);
    }
    ctx.restore();
  }

  function drawPlayer(player) {
    if (player.invincible > 0 && Math.floor(player.invincible * 12) % 2 === 0) return;
    if (game.level?.underwater) {
      drawDivingPlayer(player);
      return;
    }
    const speedRatio = Math.min(1, Math.abs(player.vx) / 380);
    const stride = Math.sin(player.runCycle);
    const runBob = player.state === "run" ? Math.abs(Math.sin(player.runCycle)) * speedRatio * -5 : 0;
    let scaleX = 1;
    let scaleY = 1;
    let tilt = 0;
    let lift = runBob;

    if (player.state === "idle") {
      scaleY = 1 + Math.sin(game.time * 2.2) * .008;
      scaleX = 1 - Math.sin(game.time * 2.2) * .004;
      tilt = Math.sin(game.time * 1.15) * .008;
    } else if (player.state === "run") {
      scaleX = 1 + Math.abs(stride) * .025;
      scaleY = 1 - Math.abs(stride) * .02;
      tilt = player.vx * .00072 + stride * .018;
    } else if (player.state === "jump") {
      scaleX = .94;
      scaleY = 1.065;
      tilt = player.vx * .00042 - player.direction * .035;
      lift -= 3;
    } else if (player.state === "apex") {
      scaleX = 1.025;
      scaleY = .985;
      tilt = player.vx * .00036;
    } else if (player.state === "fall") {
      scaleX = 1.045;
      scaleY = .96;
      tilt = player.vx * .0003 + player.direction * .025;
    }

    if (player.takeoff > 0) {
      const takeoffAmount = Math.min(1, player.takeoff / .12);
      scaleX -= takeoffAmount * .045;
      scaleY += takeoffAmount * .075;
      lift -= takeoffAmount * 3;
    }

    if (player.landing > 0) {
      const landingAmount = Math.min(1, player.landing / .17);
      scaleX += landingAmount * .105;
      scaleY -= landingAmount * .12;
      lift += 4;
    }

    if (player.state === "run" && speedRatio > .55) {
      ctx.save();
      ctx.globalAlpha = .18 + speedRatio * .16;
      ctx.strokeStyle = "#f6edcf";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i += 1) {
        const lineY = player.y + 34 + i * 18 + Math.sin(player.runCycle + i) * 4;
        const startX = player.direction > 0 ? player.x - 10 : player.x + player.w + 10;
        ctx.beginPath();
        ctx.moveTo(startX, lineY);
        ctx.lineTo(startX - player.direction * (15 + i * 7) * speedRatio, lineY);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h + lift);
    ctx.rotate(tilt);
    ctx.scale(player.direction * scaleX, scaleY);
    const loadout = currentOutfitLoadout();
    const motion = characterMotionPose(player, stride, speedRatio);
    drawAnimatedBackpack(player, motion, speedRatio);
    drawTailoredOutfitBack(ctx, loadout, player, stride, speedRatio);
    drawCharacterSprite(player, stride, speedRatio, loadout, motion);
    drawTailoredOutfitFront(ctx, loadout, player, stride, speedRatio);
    ctx.restore();
  }

  function drawDivingPlayer(player) {
    const speed = Math.min(1, Math.hypot(player.vx, player.vy) / 300);
    const stroke = Math.sin(player.runCycle * .82);
    const bob = Math.sin(game.time * 2.4 + player.runCycle * .16) * (1.5 + speed * 1.4);
    const pitch = Math.max(-.22, Math.min(.22, player.vy * .00072)) + stroke * .025 * speed;

    ctx.save();
    ctx.globalAlpha = .18 + speed * .14;
    ctx.strokeStyle = "#d2fbf7";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (let line = 0; line < 3; line += 1) {
      const trailX = player.direction > 0 ? player.x - 4 : player.x + player.w + 4;
      const trailY = player.y + 15 + line * 11 + Math.sin(game.time * 4 + line) * 3;
      ctx.beginPath();
      ctx.moveTo(trailX, trailY);
      ctx.lineTo(trailX - player.direction * (15 + line * 8) * speed, trailY + stroke * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h / 2 + bob);
    ctx.rotate(pitch);
    ctx.scale(player.direction, 1 + Math.abs(stroke) * .025 * speed);
    if (divingCharacterImage.complete && divingCharacterImage.naturalWidth) {
      const kick = stroke * (.045 + speed * .065);
      ctx.save();
      ctx.beginPath();
      ctx.rect(-30, -31, 91, 62);
      ctx.clip();
      ctx.drawImage(divingCharacterImage, -59, -28, 118, 56);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(-61, -33, 34, 66);
      ctx.clip();
      ctx.translate(-27, 0);
      ctx.rotate(kick);
      ctx.translate(27, 0);
      ctx.drawImage(divingCharacterImage, -59, -28, 118, 56);
      ctx.restore();
    } else {
      ctx.fillStyle = "#42b8c4";
      ctx.beginPath(); ctx.roundRect(-48, -21, 96, 42, 16); ctx.fill();
    }
    ctx.restore();

    if (Math.floor(game.time * 2.2 + player.runCycle * .05) % 3 === 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(199,250,246,.72)";
      ctx.lineWidth = 1.4;
      for (let bubble = 0; bubble < 2; bubble += 1) {
        const bx = player.x + player.w / 2 + player.direction * (38 + bubble * 9);
        const by = player.y + 12 - wrap(game.time * (15 + bubble * 3) + bubble * 21, 0, 34);
        ctx.beginPath(); ctx.arc(bx, by, 2.4 + bubble, 0, TAU); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function equippedItem() {
    return HAND_ITEMS.find((item) => game.equippedItems.has(item.id)) || null;
  }

  const outfitVariantCache = new Map();

  function currentOutfitLoadout() {
    return {
      jacket: null,
      head: null,
      shoes: null,
      item: equippedItem(),
    };
  }

  function singleOutfitLoadout(item) {
    return {
      jacket: null,
      head: null,
      shoes: null,
      item,
    };
  }

  function outfitVariantKey(loadout) {
    return loadout.item?.id || "none";
  }

  function drawTailoredOutfitBack() {}

  function drawTailoredOutfitFront(target, loadout, player, stride, speedRatio) {
    const item = loadout.item;
    if (!item) return;
    if (item.id === "cane") drawTailoredCane(target, player, stride, speedRatio);
    if (item.id === "lanternGear") drawTailoredLantern(target, player, stride, speedRatio, item.color);
    if (item.id === "flashlight") drawTailoredFlashlight(target, player, stride, speedRatio);
    if (item.id === "fiberCable") drawTailoredFiberCable(target, player, stride, speedRatio);
    if (item.id === "solarLamp") drawTailoredSolarLamp(target, player, stride, speedRatio);
  }

  function outfitArmPoses(player, stride, speedRatio) {
    return characterMotionPose(player, stride, speedRatio).arms;
  }

  function drawTailoredCape(target, player, speedRatio, color) {
    const lift = player.onGround === false ? 5 : 0;
    const wave = Math.sin(game.time * 7.5 + player.runCycle * .45) * (2 + speedRatio * 4);
    const dark = darkenColor(color, .28);
    const light = lightenColor(color, .19);
    target.save();
    const gradient = target.createLinearGradient(-14, -78, -43, -15);
    gradient.addColorStop(0, light);
    gradient.addColorStop(.45, color);
    gradient.addColorStop(1, dark);
    target.fillStyle = gradient;
    target.strokeStyle = dark;
    target.lineWidth = 2.1;
    target.beginPath();
    target.moveTo(-15, -78);
    target.bezierCurveTo(-28, -72, -38 - wave, -58, -43 - speedRatio * 8, -34 + lift);
    target.quadraticCurveTo(-47 - wave, -20 + lift, -31, -7 + lift);
    target.quadraticCurveTo(-22, -15, -17, -31);
    target.lineTo(-10, -69);
    target.closePath();
    target.fill(); target.stroke();
    target.strokeStyle = "rgba(255,235,208,.34)";
    target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-22, -69); target.quadraticCurveTo(-32 - wave, -39, -30, -16); target.stroke();
    target.restore();
  }

  function drawTailoredCapeCollar(target, color) {
    target.save();
    target.fillStyle = darkenColor(color, .16);
    target.strokeStyle = darkenColor(color, .35);
    target.lineWidth = 1.7;
    target.beginPath();
    target.moveTo(-17, -76); target.quadraticCurveTo(0, -69, 17, -76);
    target.lineTo(14, -67); target.quadraticCurveTo(0, -63, -14, -68); target.closePath();
    target.fill(); target.stroke();
    target.fillStyle = "#e9b54d";
    target.beginPath(); target.arc(0, -69, 3.3, 0, TAU); target.fill();
    target.restore();
  }

  function drawTailoredScarfTail(target, player, stride, speedRatio, color) {
    const wave = Math.sin(game.time * 7 + stride) * 4;
    const lift = player.onGround === false ? 5 : 0;
    target.save();
    target.fillStyle = color;
    target.strokeStyle = darkenColor(color, .3);
    target.lineWidth = 1.5;
    target.beginPath();
    target.moveTo(-13, -70);
    target.bezierCurveTo(-25, -69 + wave, -29 - speedRatio * 10, -59, -38 - speedRatio * 9, -51 + wave + lift);
    target.lineTo(-31 - speedRatio * 8, -44 + wave + lift);
    target.bezierCurveTo(-24, -54, -18, -62, -8, -67);
    target.closePath(); target.fill(); target.stroke();
    for (let fringe = 0; fringe < 3; fringe += 1) {
      target.beginPath();
      target.moveTo(-36 + fringe * 3, -50 + wave + lift);
      target.lineTo(-39 + fringe * 3, -44 + wave + lift);
      target.stroke();
    }
    target.restore();
  }

  function drawTailoredScarfKnot(target, color) {
    target.save();
    target.fillStyle = color;
    target.strokeStyle = darkenColor(color, .3);
    target.lineWidth = 1.5;
    target.beginPath(); target.roundRect(-18, -72, 36, 8, 4); target.fill(); target.stroke();
    target.beginPath(); target.arc(13, -66, 4.5, 0, TAU); target.fill(); target.stroke();
    target.restore();
  }

  function drawTailoredJacket(target, outfit, player, stride, speedRatio) {
    const poses = outfitArmPoses(player, stride, speedRatio);
    const outline = outfit.id === "minerJacket" ? "#142630" : outfit.id === "winterJacket" ? "#6c2732" : "#203d34";
    const trim = outfit.id === "minerJacket" ? "#f0eee6" : outfit.id === "winterJacket" ? "#f5eee3" : "#dcb858";
    target.save();
    target.lineCap = "round";
    target.lineJoin = "round";
    for (const pose of poses) drawTailoredSleeve(target, pose, outfit, outline, trim);

    const bodyGradient = target.createLinearGradient(-22, -68, 22, -25);
    bodyGradient.addColorStop(0, lightenColor(outfit.color, outfit.id === "minerJacket" ? .1 : .2));
    bodyGradient.addColorStop(.47, outfit.color);
    bodyGradient.addColorStop(1, darkenColor(outfit.color, .2));
    target.fillStyle = bodyGradient;
    target.strokeStyle = outline;
    target.lineWidth = 2.2;
    target.beginPath();
    target.moveTo(-15, -71);
    target.quadraticCurveTo(-21, -70, -22, -62);
    target.lineTo(-20, -29);
    target.quadraticCurveTo(-18, -23, -12, -22);
    target.quadraticCurveTo(0, -20, 13, -22);
    target.quadraticCurveTo(20, -23, 21, -29);
    target.lineTo(22, -62);
    target.quadraticCurveTo(21, -70, 15, -71);
    target.quadraticCurveTo(0, -74, -15, -71);
    target.closePath(); target.fill(); target.stroke();

    if (outfit.id === "forestJacket") drawForestJacketDetails(target, outline, trim);
    else if (outfit.id === "minerJacket") drawMinerJacketDetails(target, outline, trim);
    else drawWinterJacketDetails(target, outline, trim);

    for (const pose of poses) drawRunningGloveOn(target, pose.handX, pose.handY, pose.gloveRotation);
    target.restore();
  }

  function drawTailoredSleeve(target, pose, outfit, outline, trim) {
    const dx = pose.handX - pose.shoulderX;
    const dy = pose.handY - pose.shoulderY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const cuffX = pose.handX - dx / length * 6.5;
    const cuffY = pose.handY - dy / length * 6.5;
    const width = outfit.id === "winterJacket" ? 11.5 : 9.5;
    target.strokeStyle = outline;
    target.lineWidth = width;
    target.beginPath(); target.moveTo(pose.shoulderX, pose.shoulderY); target.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); target.stroke();
    target.strokeStyle = outfit.color;
    target.lineWidth = width - 3;
    target.beginPath(); target.moveTo(pose.shoulderX, pose.shoulderY); target.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); target.stroke();
    target.fillStyle = trim;
    target.strokeStyle = outline;
    target.lineWidth = 1;
    target.beginPath(); target.arc(cuffX, cuffY, outfit.id === "winterJacket" ? 4.8 : 4, 0, TAU); target.fill(); target.stroke();
  }

  function drawForestJacketDetails(target, outline, trim) {
    target.strokeStyle = trim;
    target.lineWidth = 1.5;
    target.beginPath(); target.moveTo(0, -63); target.lineTo(0, -24); target.stroke();
    target.beginPath(); target.moveTo(-18, -35); target.lineTo(19, -35); target.stroke();
    target.fillStyle = trim;
    target.beginPath(); target.moveTo(-16, -69); target.lineTo(-3, -55); target.lineTo(0, -62); target.lineTo(3, -55); target.lineTo(17, -69); target.lineTo(15, -60); target.lineTo(6, -51); target.lineTo(-6, -51); target.lineTo(-15, -60); target.closePath(); target.fill();
    drawTailoredPocket(target, -15, -46, outline, trim, 9, 11);
    drawTailoredPocket(target, 7, -46, outline, trim, 9, 11);
    drawTailoredPocket(target, -15, -33, outline, trim, 10, 9);
    drawTailoredPocket(target, 6, -33, outline, trim, 10, 9);
    target.fillStyle = "#ebbf55";
    for (let y = -48; y <= -27; y += 7) { target.beginPath(); target.arc(4, y, 1.45, 0, TAU); target.fill(); }
  }

  function drawMinerJacketDetails(target, outline, trim) {
    target.fillStyle = trim;
    target.beginPath();
    target.moveTo(-17, -70); target.lineTo(-4, -54); target.lineTo(0, -62); target.lineTo(4, -54); target.lineTo(18, -70);
    target.lineTo(18, -62); target.lineTo(7, -49); target.lineTo(-7, -49); target.lineTo(-18, -62); target.closePath(); target.fill();
    target.strokeStyle = "#caa545";
    target.lineWidth = 1.3;
    target.beginPath(); target.moveTo(-17, -30); target.quadraticCurveTo(0, -27, 18, -30); target.stroke();
    target.fillStyle = "#d9ac45";
    for (const x of [-5, 6]) {
      for (let y = -45; y <= -28; y += 8.5) { target.beginPath(); target.arc(x, y, 1.65, 0, TAU); target.fill(); }
    }
    target.strokeStyle = trim;
    target.lineWidth = 1.4;
    target.beginPath(); target.moveTo(-13, -40); target.lineTo(-5, -37); target.moveTo(6, -37); target.lineTo(14, -40); target.stroke();
  }

  function drawWinterJacketDetails(target, outline, trim) {
    target.fillStyle = trim;
    target.strokeStyle = outline;
    target.lineWidth = 1.2;
    target.beginPath(); target.roundRect(-18, -74, 36, 10, 5); target.fill(); target.stroke();
    target.strokeStyle = "rgba(255,239,226,.48)";
    for (const y of [-55, -44, -33]) {
      target.beginPath(); target.moveTo(-19, y); target.quadraticCurveTo(0, y + 2, 19, y); target.stroke();
    }
    target.strokeStyle = trim;
    target.lineWidth = 2;
    target.beginPath(); target.moveTo(0, -63); target.lineTo(0, -23); target.stroke();
    target.fillStyle = darkenColor("#b84d57", .25);
    target.beginPath(); target.roundRect(-15, -39, 11, 12, 4); target.roundRect(5, -39, 11, 12, 4); target.fill();
    target.strokeStyle = trim;
    target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-14, -35); target.lineTo(-5, -35); target.moveTo(6, -35); target.lineTo(15, -35); target.stroke();
  }

  function drawTailoredPocket(target, x, y, outline, trim, width, height) {
    target.fillStyle = "rgba(14,35,30,.16)";
    target.strokeStyle = outline;
    target.lineWidth = .9;
    target.beginPath(); target.roundRect(x, y, width, height, 2.3); target.fill(); target.stroke();
    target.strokeStyle = trim;
    target.beginPath(); target.moveTo(x + 1, y + 2); target.lineTo(x + width - 1, y + 2); target.stroke();
  }

  function drawRunningGloveOn(target, x, y, rotation) {
    target.save();
    target.translate(x, y); target.rotate(rotation);
    target.fillStyle = "#fffdfa";
    target.strokeStyle = "#252724";
    target.lineWidth = 1.4;
    target.beginPath(); target.ellipse(0, 0, 5.5, 6.5, 0, 0, TAU); target.fill(); target.stroke();
    target.lineWidth = 1.1;
    for (let finger = -1; finger <= 1; finger += 1) {
      target.beginPath(); target.moveTo(finger * 2.1, -3); target.lineTo(finger * 2.8, -7.5 + Math.abs(finger)); target.stroke();
    }
    target.restore();
  }

  function drawTailoredHeadwear(target, outfit, player) {
    const bounce = player.state === "run" ? Math.abs(Math.sin(player.runCycle)) * 1.5 : 0;
    target.save();
    target.translate(0, -bounce);
    target.strokeStyle = "#182b28";
    target.lineWidth = 1.8;
    if (outfit.id === "hat") drawHikingCap(target, outfit);
    else if (outfit.id === "redBeanie") drawRibbedBeanie(target, outfit);
    else if (outfit.id === "minerCap") drawMinerCap(target, outfit);
    else drawWinterHat(target, outfit);
    target.restore();
  }

  function drawHikingCap(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-21, -106); target.quadraticCurveTo(-17, -119, 1, -121); target.quadraticCurveTo(18, -119, 22, -106); target.closePath(); target.fill(); target.stroke();
    target.fillStyle = "#e3b74c";
    target.beginPath(); target.roundRect(-18, -111, 38, 4, 2); target.fill();
    target.fillStyle = outfit.color;
    target.beginPath(); target.ellipse(20, -104, 18, 4.5, .1, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = "#f2d475";
    target.beginPath(); target.arc(0, -115, 3.4, 0, TAU); target.fill();
    target.fillStyle = "#315744";
    target.font = "900 5px system-ui"; target.textAlign = "center"; target.fillText("E", 0, -113.3);
  }

  function drawRibbedBeanie(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-20, -106); target.quadraticCurveTo(-17, -124, 0, -127); target.quadraticCurveTo(17, -124, 21, -106); target.closePath(); target.fill(); target.stroke();
    target.strokeStyle = "rgba(255,231,221,.34)";
    target.lineWidth = 1;
    for (let x = -13; x <= 13; x += 6.5) { target.beginPath(); target.moveTo(x, -108); target.lineTo(x * .72, -122); target.stroke(); }
    target.fillStyle = "#dca84a";
    target.strokeStyle = "#7d2937";
    target.beginPath(); target.arc(0, -128, 6, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = darkenColor(outfit.color, .15);
    target.beginPath(); target.roundRect(-21, -111, 43, 6, 3); target.fill(); target.stroke();
  }

  function drawMinerCap(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-21, -106); target.quadraticCurveTo(-15, -120, 1, -121); target.quadraticCurveTo(18, -119, 22, -106); target.closePath(); target.fill(); target.stroke();
    target.fillStyle = "#1c303c";
    target.beginPath(); target.ellipse(19, -104, 16, 4, .08, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = "#e0c375";
    target.beginPath(); target.roundRect(-18, -110, 38, 3.5, 1.7); target.fill();
    target.shadowColor = "#ffe77c"; target.shadowBlur = 12;
    target.fillStyle = "#ffe16c";
    target.strokeStyle = "#483e2a";
    target.beginPath(); target.arc(1, -114, 5, 0, TAU); target.fill(); target.stroke();
    target.shadowBlur = 0;
    target.fillStyle = "#fff7c1";
    target.beginPath(); target.arc(0, -115, 2, 0, TAU); target.fill();
  }

  function drawWinterHat(target, outfit) {
    target.fillStyle = outfit.color;
    target.beginPath(); target.moveTo(-20, -106); target.quadraticCurveTo(-17, -125, 0, -127); target.quadraticCurveTo(18, -124, 21, -106); target.closePath(); target.fill(); target.stroke();
    target.fillStyle = "#f3f0e9";
    target.beginPath(); target.roundRect(-21, -111, 43, 6, 3); target.fill(); target.stroke();
    target.beginPath(); target.arc(0, -128, 5.5, 0, TAU); target.fill(); target.stroke();
    target.fillStyle = outfit.color;
    target.beginPath(); target.roundRect(-25, -110, 8, 19, 4); target.roundRect(17, -110, 8, 19, 4); target.fill(); target.stroke();
    target.strokeStyle = "#f3f0e9";
    target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-21, -93); target.lineTo(-22, -86); target.moveTo(21, -93); target.lineTo(22, -86); target.stroke();
    target.fillStyle = "#f3f0e9";
    target.font = "900 10px system-ui"; target.textAlign = "center"; target.fillText("✦", 0, -114);
  }

  function outfitFeet(player, stride, speedRatio) {
    return characterMotionPose(player, stride, speedRatio).legs.map((leg) => ({
      x: leg.footX,
      y: leg.footY,
      rotation: leg.footRotation || 0,
    }));
  }

  function drawTailoredShoes(target, outfit, player, stride, speedRatio) {
    target.save();
    for (const foot of outfitFeet(player, stride, speedRatio)) {
      const { x, y } = foot;
      target.save();
      target.translate(x, y);
      target.rotate(foot.rotation);
      target.fillStyle = outfit.color;
      target.strokeStyle = "#222522";
      target.lineWidth = 1.45;
      if (outfit.id === "hikingBoots") {
        target.beginPath(); target.roundRect(-4, -7, 12, 9, 3); target.fill(); target.stroke();
        target.beginPath(); target.ellipse(4, 2, 9, 4.6, -.04, 0, TAU); target.fill(); target.stroke();
        target.strokeStyle = "#d8b784"; target.lineWidth = 1;
        for (let lace = 0; lace < 3; lace += 1) { target.beginPath(); target.moveTo(-1, -5 + lace * 2); target.lineTo(6, -3.5 + lace * 2); target.stroke(); }
        target.strokeStyle = "#31231b"; target.lineWidth = 2; target.beginPath(); target.moveTo(-4, 4); target.lineTo(12, 4); target.stroke();
      } else if (outfit.id === "redSneakers") {
        target.beginPath(); target.ellipse(4, 1, 8.5, 4.2, -.02, 0, TAU); target.fill(); target.stroke();
        target.strokeStyle = "#fff7eb"; target.lineWidth = 2.2; target.beginPath(); target.moveTo(-4, 3); target.lineTo(12, 3); target.stroke();
        target.lineWidth = 1.2; target.beginPath(); target.moveTo(0, -1); target.lineTo(5, 1); target.lineTo(8, -1); target.stroke();
      } else {
        target.beginPath(); target.roundRect(-4, -8, 13, 11, 4); target.fill(); target.stroke();
        target.beginPath(); target.ellipse(4, 2, 9, 4.8, 0, 0, TAU); target.fill(); target.stroke();
        target.fillStyle = "#f4f1e8"; target.beginPath(); target.roundRect(-4, -8, 13, 4.5, 2); target.fill();
        target.strokeStyle = "#d9eef1"; target.lineWidth = 2; target.beginPath(); target.moveTo(-4, 4); target.lineTo(13, 4); target.stroke();
      }
      target.restore();
    }
    target.restore();
  }

  function accessoryHandPose(player, stride, speedRatio) {
    const arms = characterMotionPose(player, stride, speedRatio).arms;
    return player.state === "run" && speedRatio > .12 ? arms[1] : arms[0];
  }

  function drawTailoredCane(target, player, stride, speedRatio) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const runSwing = player.state === "run" ? Math.sin(player.runCycle) * 3.5 : 0;
    const endX = hand.handX - 3 + runSwing;
    target.save();
    target.strokeStyle = "#4c2d1c";
    target.lineWidth = 5.2;
    target.lineCap = "round";
    target.beginPath();
    target.moveTo(hand.handX + 4, hand.handY - 2);
    target.quadraticCurveTo(hand.handX - 5, hand.handY - 9, hand.handX - 10, hand.handY - 1);
    target.lineTo(endX, 2);
    target.stroke();
    target.strokeStyle = "#a8733f";
    target.lineWidth = 1.5;
    target.beginPath(); target.moveTo(hand.handX - 6, hand.handY); target.lineTo(endX - 1, -1); target.stroke();
    target.fillStyle = "#d8a83f"; target.beginPath(); target.arc(hand.handX - 8, hand.handY - 2, 2.7, 0, TAU); target.fill();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
    target.restore();
  }

  function drawTailoredLantern(target, player, stride, speedRatio, color) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const swing = player.state === "run" ? Math.sin(player.runCycle) * .2 : 0;
    target.save();
    target.translate(hand.handX, hand.handY + 3);
    target.rotate(swing);
    target.strokeStyle = "#3d332a";
    target.lineWidth = 2;
    target.beginPath(); target.arc(0, 5, 8, Math.PI, 0); target.stroke();
    target.shadowColor = "#ffc95a"; target.shadowBlur = 16;
    target.fillStyle = color;
    target.beginPath(); target.roundRect(-7, 6, 14, 18, 4); target.fill(); target.stroke();
    target.fillStyle = "#fff0a1"; target.beginPath(); target.arc(0, 15, 3.8, 0, TAU); target.fill();
    target.shadowBlur = 0;
    target.strokeStyle = "#3d332a"; target.lineWidth = 1.2;
    target.beginPath(); target.moveTo(-5, 9); target.lineTo(5, 21); target.moveTo(5, 9); target.lineTo(-5, 21); target.stroke();
    target.restore();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
  }

  function drawTailoredFlashlight(target, player, stride, speedRatio) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const swing = player.state === "run" ? Math.sin(player.runCycle) * .13 : -.12;
    target.save();
    target.translate(hand.handX + 1, hand.handY + 1);
    target.rotate(swing);
    const beam = target.createLinearGradient(11, 0, 54, 0);
    beam.addColorStop(0, "rgba(255,239,151,.26)");
    beam.addColorStop(1, "rgba(255,239,151,0)");
    target.fillStyle = beam;
    target.beginPath();
    target.moveTo(9, -4); target.lineTo(56, -17); target.lineTo(56, 17); target.lineTo(9, 4);
    target.closePath(); target.fill();
    target.strokeStyle = "#26333a";
    target.lineWidth = 2;
    target.fillStyle = "#526b77";
    target.beginPath(); target.roundRect(-3, -5, 19, 10, 4); target.fill(); target.stroke();
    target.fillStyle = "#92aab3";
    target.beginPath(); target.roundRect(7, -7, 9, 14, 3); target.fill(); target.stroke();
    target.fillStyle = "#fff2a5";
    target.beginPath(); target.ellipse(16, 0, 2.5, 5, 0, 0, TAU); target.fill();
    target.fillStyle = "#e4b54a";
    target.beginPath(); target.roundRect(0, -6.5, 5, 2, 1); target.fill();
    target.restore();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
  }

  function drawTailoredFiberCable(target, player, stride, speedRatio) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const bounce = player.state === "run" ? Math.sin(player.runCycle * 2) * 1.6 : 0;
    target.save();
    target.translate(hand.handX + 2, hand.handY + 7 + bounce);
    target.strokeStyle = "#0a596f";
    target.lineWidth = 5.5;
    target.beginPath(); target.arc(7, 8, 11, -.3, TAU - .3); target.stroke();
    target.strokeStyle = "#28c4e8";
    target.lineWidth = 2.4;
    target.beginPath(); target.arc(7, 8, 11, -.3, TAU - .3); target.stroke();
    target.beginPath();
    target.moveTo(15, 1); target.quadraticCurveTo(27, -6, 30, 4); target.stroke();
    target.shadowColor = "#75efff";
    target.shadowBlur = 9;
    target.fillStyle = "#c7fbff";
    target.beginPath(); target.roundRect(27, 1, 7, 5, 1.5); target.fill();
    target.shadowBlur = 0;
    target.fillStyle = "#f5ca50";
    target.beginPath(); target.arc(7, 8, 3.2, 0, TAU); target.fill();
    target.restore();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
  }

  function drawTailoredSolarLamp(target, player, stride, speedRatio) {
    const hand = accessoryHandPose(player, stride, speedRatio);
    const swing = player.state === "run" ? Math.sin(player.runCycle) * .16 : 0;
    target.save();
    target.translate(hand.handX, hand.handY + 3);
    target.rotate(swing);
    target.strokeStyle = "#243b43";
    target.lineWidth = 2;
    target.beginPath(); target.arc(0, 6, 9, Math.PI, 0); target.stroke();
    target.shadowColor = "#ffe070";
    target.shadowBlur = 14;
    const lamp = target.createLinearGradient(0, 7, 0, 27);
    lamp.addColorStop(0, "#fff2a8");
    lamp.addColorStop(1, "#e7a73b");
    target.fillStyle = lamp;
    target.beginPath(); target.roundRect(-8, 7, 16, 20, 5); target.fill();
    target.shadowBlur = 0;
    target.strokeStyle = "#274953";
    target.stroke();
    target.fillStyle = "#173d54";
    target.beginPath();
    target.moveTo(-10, 5); target.lineTo(-6, 0); target.lineTo(7, 0); target.lineTo(10, 5); target.closePath(); target.fill();
    target.strokeStyle = "#62b8ce";
    target.lineWidth = 1;
    target.beginPath(); target.moveTo(-4, 1); target.lineTo(-1, 5); target.moveTo(2, 1); target.lineTo(5, 5); target.stroke();
    target.fillStyle = "rgba(255,255,255,.72)";
    target.beginPath(); target.roundRect(-4, 10, 3, 11, 1.5); target.fill();
    target.restore();
    drawRunningGloveOn(target, hand.handX, hand.handY, hand.gloveRotation);
  }

  function buildOutfitVariant(loadout) {
    const key = outfitVariantKey(loadout);
    if (outfitVariantCache.has(key)) return outfitVariantCache.get(key);
    const variant = document.createElement("canvas");
    variant.width = 260;
    variant.height = 340;
    const render = variant.getContext("2d");
    render.imageSmoothingEnabled = true;
    render.translate(130, 304);
    render.scale(2.3, 2.3);
    const previewPlayer = { state: "idle", onGround: true, runCycle: 0 };
    drawTailoredOutfitBack(render, loadout, previewPlayer, 0, 0);
    if (characterImage.complete && characterImage.naturalWidth) render.drawImage(characterImage, -29, -108, 58, 116);
    drawTailoredOutfitFront(render, loadout, previewPlayer, 0, 0);
    outfitVariantCache.set(key, variant);
    return variant;
  }

  function renderOutfitVariantInto(target, loadout) {
    if (!target) return;
    const source = buildOutfitVariant(loadout);
    const render = target.getContext("2d");
    render.clearRect(0, 0, target.width, target.height);
    const scale = Math.min(target.width / source.width, target.height / source.height);
    const width = source.width * scale;
    const height = source.height * scale;
    render.drawImage(source, (target.width - width) / 2, (target.height - height) / 2, width, height);
  }

  function characterMotionPose(player, stride, speedRatio) {
    const idle = Math.sin(game.time * 2.15);
    const landing = Math.min(1, Math.max(0, player.landing || 0) / .17);
    const running = player.state === "run" && speedRatio > .12;
    let arms;
    let legs;

    if (running) {
      const swing = stride * (11 + speedRatio * 7);
      const backLift = Math.max(0, Math.cos(player.runCycle)) * (3 + speedRatio * 4);
      const frontLift = Math.max(0, -Math.cos(player.runCycle)) * (3 + speedRatio * 4);
      arms = [runningArmPose(stride, speedRatio, true), runningArmPose(stride, speedRatio, false)];
      legs = [
        {
          hipX: -9, hipY: -25,
          kneeX: -10 - swing * .34, kneeY: -12 - backLift * .45,
          footX: -8 - swing, footY: 1 - backLift,
          footRotation: -.08 - stride * .13,
        },
        {
          hipX: 5, hipY: -25,
          kneeX: 6 + swing * .34, kneeY: -12 - frontLift * .45,
          footX: 5 + swing, footY: 1 - frontLift,
          footRotation: .05 + stride * .13,
        },
      ];
    } else if (player.state === "jump") {
      arms = [
        { shoulderX: -13, shoulderY: -71, controlX: -23, controlY: -80, handX: -27, handY: -91, gloveRotation: -.25 },
        { shoulderX: 13, shoulderY: -71, controlX: 22, controlY: -81, handX: 27, handY: -92, gloveRotation: .25 },
      ];
      legs = [
        { hipX: -9, hipY: -25, kneeX: -15, kneeY: -14, footX: -12, footY: -5, footRotation: -.22 },
        { hipX: 5, hipY: -25, kneeX: 11, kneeY: -12, footX: 13, footY: -3, footRotation: .22 },
      ];
    } else if (player.state === "apex") {
      arms = [
        { shoulderX: -13, shoulderY: -71, controlX: -25, controlY: -69, handX: -30, handY: -58, gloveRotation: -.28 },
        { shoulderX: 13, shoulderY: -71, controlX: 25, controlY: -69, handX: 30, handY: -58, gloveRotation: .28 },
      ];
      legs = [
        { hipX: -9, hipY: -25, kneeX: -14, kneeY: -13, footX: -17, footY: -2, footRotation: -.16 },
        { hipX: 5, hipY: -25, kneeX: 10, kneeY: -15, footX: 12, footY: -5, footRotation: .16 },
      ];
    } else if (player.state === "fall") {
      arms = [
        { shoulderX: -13, shoulderY: -71, controlX: -26, controlY: -66, handX: -31, handY: -51, gloveRotation: -.32 },
        { shoulderX: 13, shoulderY: -71, controlX: 26, controlY: -66, handX: 31, handY: -51, gloveRotation: .32 },
      ];
      legs = [
        { hipX: -9, hipY: -25, kneeX: -11, kneeY: -11, footX: -10, footY: 2, footRotation: -.08 },
        { hipX: 5, hipY: -25, kneeX: 8, kneeY: -10, footX: 11, footY: 1, footRotation: .12 },
      ];
    } else {
      const wave = Math.sin(game.time * 2.7) * 2.2;
      arms = [
        { shoulderX: -13, shoulderY: -70, controlX: -20, controlY: -56, handX: -23, handY: -39 + idle, gloveRotation: -.08 },
        { shoulderX: 13, shoulderY: -70, controlX: 18 + wave * .3, controlY: -84, handX: 25 + wave, handY: -95 + idle * 1.2, gloveRotation: .08 + wave * .015 },
      ];
      legs = [
        { hipX: -9, hipY: -25, kneeX: -10, kneeY: -11 + landing * 3, footX: -9, footY: 1, footRotation: -.03 },
        { hipX: 5, hipY: -25, kneeX: 6, kneeY: -11 + landing * 3, footX: 6, footY: 1, footRotation: .03 },
      ];
    }

    if (landing > 0) {
      arms = arms.map((arm, index) => ({
        ...arm,
        controlY: arm.controlY + landing * 5,
        handY: arm.handY + landing * (index ? 7 : 5),
      }));
    }

    return { arms, legs, running, landing, idle };
  }

  function drawCharacterSprite(player, stride, speedRatio, loadout, motion) {
    const hasSleevedJacket = Boolean(loadout.jacket && loadout.jacket.id !== "cape");
    drawAnimatedLegs(motion.legs, !loadout.shoes);
    if (!hasSleevedJacket) drawAnimatedArm(motion.arms[0], true);

    if (characterImage.complete && characterImage.naturalWidth) {
      // Das Original liefert Kopf und farbigen Körper. Die statischen Arme,
      // Hände, Beine und der fest eingezeichnete Rucksack werden ausgespart.
      ctx.save();
      ctx.beginPath();
      ctx.rect(-20.5, -109, 41, 91);
      ctx.clip();
      ctx.drawImage(characterImage, -29, -108, 58, 116);
      ctx.restore();
    } else {
      ctx.fillStyle = "#f4bd43";
      ctx.beginPath();
      ctx.roundRect(-19, -103, 38, 84, 8); ctx.fill();
    }

    if (!hasSleevedJacket) drawAnimatedArm(motion.arms[1], false);
  }

  function drawAnimatedBackpack(player, motion, speedRatio) {
    const runBounce = motion.running ? Math.abs(Math.sin(player.runCycle)) * 2.7 : motion.idle * .35;
    const airLift = player.onGround ? 0 : Math.max(-2, Math.min(4, player.vy * .008));
    const trail = 1.5 + speedRatio * 5.5;
    const inertia = Math.max(-.08, Math.min(.1, -player.vy * .00022));
    ctx.save();
    ctx.translate(-18 - trail, -60 + runBounce + airLift);
    ctx.rotate(-.1 - (motion.running ? Math.sin(player.runCycle) * .035 : 0) + inertia);
    ctx.strokeStyle = "#722c37";
    ctx.fillStyle = "#bd3b4a";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-12, -19, 21, 38, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#962f3a";
    ctx.beginPath(); ctx.roundRect(-14, 2, 24, 15, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#18a7c7";
    ctx.lineWidth = 3.6;
    ctx.beginPath(); ctx.arc(9, -5, 14, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-7, -13); ctx.quadraticCurveTo(-1, -17, 5, -13); ctx.stroke();
    ctx.fillStyle = "#e0ad45";
    ctx.beginPath(); ctx.arc(-8, 7, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawAnimatedArm(pose, behind) {
    ctx.save();
    ctx.strokeStyle = behind ? "#242724" : "#111412";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(pose.shoulderX, pose.shoulderY);
    ctx.quadraticCurveTo(pose.controlX, pose.controlY, pose.handX, pose.handY);
    ctx.stroke();
    drawRunningGlove(pose.handX, pose.handY, pose.gloveRotation);
    ctx.restore();
  }

  function runningArmPose(stride, speedRatio, behind) {
    const swing = stride * (12 + speedRatio * 7);
    const shoulderX = behind ? -12 : 11;
    const direction = behind ? 1 : -1;
    const handLift = Math.max(0, direction * Math.cos(game.player?.runCycle || 0)) * 2;
    return {
      shoulderX,
      shoulderY: -71,
      controlX: shoulderX + (behind ? -8 : 8),
      controlY: -59 + direction * swing * .42 - handLift,
      handX: shoulderX + (behind ? -12 : 12) + direction * swing * .38,
      handY: -45 + direction * swing - handLift,
      gloveRotation: direction * (.12 + stride * .04),
    };
  }

  function drawRunningGlove(x, y, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.fillStyle = "#fffdfa";
    ctx.strokeStyle = "#252724";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 6.5, 0, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1.25;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath(); ctx.moveTo(i * 2.2, -3); ctx.lineTo(i * 3, -8 + Math.abs(i)); ctx.stroke();
    }
    ctx.restore();
  }

  function drawAnimatedLegs(legs, drawDefaultShoes) {
    const leg = (pose, shade) => {
      ctx.strokeStyle = "#1d1d1b";
      ctx.lineWidth = 3.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(pose.hipX, pose.hipY);
      ctx.lineTo(pose.kneeX, pose.kneeY);
      ctx.lineTo(pose.footX, pose.footY);
      ctx.stroke();
      if (!drawDefaultShoes) return;
      ctx.save();
      ctx.translate(pose.footX, pose.footY);
      ctx.rotate(pose.footRotation || 0);
      ctx.fillStyle = shade;
      ctx.strokeStyle = "#1d1d1b";
      ctx.lineWidth = 1.7;
      ctx.beginPath();
      ctx.ellipse(3, 1, 7.2, 3.6, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };

    leg(legs[0], "#e5e5df");
    leg(legs[1], "#f7f7f4");
  }

  function drawPlayerCape(player, speedRatio, color = "#9f4054") {
    const airborne = player.onGround ? 0 : 5;
    const flutter = Math.sin(game.time * 8 + player.runCycle * .4) * (2 + speedRatio * 3);
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#6e263b";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-16, -79);
    ctx.quadraticCurveTo(-31 - flutter, -65, -32 - speedRatio * 11, -45 + airborne);
    ctx.quadraticCurveTo(-31 - flutter, -23, -19, -12 + airborne);
    ctx.quadraticCurveTo(-8, -30, -11, -67);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.beginPath();
    ctx.moveTo(-17, -73); ctx.quadraticCurveTo(-25 - flutter, -54, -23, -29); ctx.lineTo(-18, -35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#e4ad45";
    ctx.beginPath(); ctx.arc(-14, -77, 3.1, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawPlayerScarf(player, speedRatio, color) {
    const flutter = Math.sin(game.time * 7 + player.runCycle) * 3;
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = "#7f3340";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-17, -82, 31, 8, 4); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -79); ctx.quadraticCurveTo(-29 - speedRatio * 8, -72 + flutter, -33 - speedRatio * 10, -59 + flutter);
    ctx.lineTo(-26, -58 + flutter); ctx.quadraticCurveTo(-23, -69, -9, -75); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function drawPlayerJacket(outfit, player, stride, speedRatio) {
    const isRunning = player.state === "run" && speedRatio > .12;
    const outline = outfit.id === "winterJacket" ? "#6f2935" : outfit.id === "minerJacket" ? "#172b38" : "#244b3d";
    const trim = outfit.id === "winterJacket" ? "#f3e9dc" : outfit.id === "minerJacket" ? "#f2eee3" : "#d6b15a";
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const sleevePoses = isRunning
      ? [runningArmPose(stride, speedRatio, true), runningArmPose(stride, speedRatio, false)]
      : [
          { shoulderX: -15, shoulderY: -67, controlX: -22, controlY: -57, handX: -25, handY: -37, gloveRotation: 0 },
          { shoulderX: 14, shoulderY: -68, controlX: 19, controlY: -82, handX: 27, handY: -96, gloveRotation: 0 },
        ];

    for (const pose of sleevePoses) drawJacketSleeve(pose, outfit.color, outline, trim);

    const bodyGradient = ctx.createLinearGradient(-21, -70, 22, -24);
    bodyGradient.addColorStop(0, lightenColor(outfit.color, .2));
    bodyGradient.addColorStop(.36, outfit.color);
    bodyGradient.addColorStop(1, darkenColor(outfit.color, .16));
    ctx.fillStyle = bodyGradient;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-15, -71);
    ctx.quadraticCurveTo(-21, -70, -22, -62);
    ctx.lineTo(-20, -29);
    ctx.quadraticCurveTo(-19, -23, -13, -22);
    ctx.quadraticCurveTo(0, -20, 13, -22);
    ctx.quadraticCurveTo(20, -23, 21, -29);
    ctx.lineTo(22, -62);
    ctx.quadraticCurveTo(21, -70, 15, -71);
    ctx.quadraticCurveTo(0, -75, -15, -71);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.beginPath();
    ctx.moveTo(-15, -65); ctx.quadraticCurveTo(-12, -48, -14, -28); ctx.lineTo(-8, -27); ctx.lineTo(-7, -66); ctx.closePath(); ctx.fill();

    ctx.strokeStyle = trim;
    ctx.lineWidth = outfit.id === "winterJacket" ? 2.1 : 1.5;
    ctx.beginPath(); ctx.moveTo(0, -62); ctx.lineTo(0, -23); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-17, -25); ctx.quadraticCurveTo(0, -22, 17, -25); ctx.stroke();

    if (outfit.id === "minerJacket") {
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.moveTo(-16, -69); ctx.lineTo(-2, -55); ctx.lineTo(0, -62); ctx.lineTo(2, -55); ctx.lineTo(17, -69);
      ctx.lineTo(17, -62); ctx.lineTo(5, -51); ctx.lineTo(-5, -51); ctx.lineTo(-17, -62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d9ac45";
      for (let y = -49; y <= -31; y += 9) {
        ctx.beginPath(); ctx.arc(5, y, 1.7, 0, TAU); ctx.fill();
      }
      drawJacketPocket(-13, -40, outline, trim);
      drawJacketPocket(5, -40, outline, trim);
    } else if (outfit.id === "winterJacket") {
      ctx.fillStyle = trim;
      ctx.beginPath(); ctx.roundRect(-16, -72, 32, 9, 4); ctx.fill();
      ctx.strokeStyle = "rgba(255,238,221,.42)";
      ctx.lineWidth = 1.2;
      for (const y of [-53, -41, -30]) {
        ctx.beginPath(); ctx.moveTo(-19, y); ctx.quadraticCurveTo(0, y + 2, 19, y); ctx.stroke();
      }
      drawJacketPocket(-15, -37, outline, trim);
      drawJacketPocket(7, -37, outline, trim);
    } else {
      ctx.fillStyle = trim;
      ctx.beginPath();
      ctx.moveTo(-15, -69); ctx.lineTo(-2, -56); ctx.lineTo(0, -64); ctx.lineTo(3, -56); ctx.lineTo(16, -69);
      ctx.lineTo(15, -62); ctx.lineTo(6, -53); ctx.lineTo(-6, -53); ctx.lineTo(-15, -62); ctx.closePath(); ctx.fill();
      drawJacketPocket(-15, -39, outline, trim);
      drawJacketPocket(7, -39, outline, trim);
      ctx.fillStyle = "#e8b94c";
      for (let y = -48; y <= -31; y += 9) {
        ctx.beginPath(); ctx.arc(5, y, 1.6, 0, TAU); ctx.fill();
      }
    }

    if (isRunning) {
      for (const pose of sleevePoses) drawRunningGlove(pose.handX, pose.handY, pose.gloveRotation);
    }
    ctx.restore();
  }

  function drawJacketSleeve(pose, color, outline, trim) {
    const dx = pose.handX - pose.shoulderX;
    const dy = pose.handY - pose.shoulderY;
    const length = Math.max(1, Math.hypot(dx, dy));
    const cuffX = pose.handX - dx / length * 7;
    const cuffY = pose.handY - dy / length * 7;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(pose.shoulderX, pose.shoulderY); ctx.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(pose.shoulderX, pose.shoulderY); ctx.quadraticCurveTo(pose.controlX, pose.controlY, cuffX, cuffY); ctx.stroke();
    ctx.fillStyle = trim;
    ctx.beginPath(); ctx.arc(cuffX, cuffY, 4, 0, TAU); ctx.fill();
  }

  function drawJacketPocket(x, y, outline, trim) {
    ctx.fillStyle = "rgba(18,35,31,.13)";
    ctx.strokeStyle = outline;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(x, y, 8, 10, 2.5); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = trim;
    ctx.beginPath(); ctx.moveTo(x + 1, y + 2); ctx.lineTo(x + 7, y + 2); ctx.stroke();
  }

  function lightenColor(hex, amount) {
    return shadeHex(hex, Math.abs(amount));
  }

  function darkenColor(hex, amount) {
    return shadeHex(hex, -Math.abs(amount));
  }

  function shadeHex(hex, amount) {
    const value = Number.parseInt(hex.slice(1), 16);
    const mix = amount >= 0 ? 255 : 0;
    const weight = Math.abs(amount);
    const channel = (shift) => Math.round(((value >> shift) & 255) * (1 - weight) + mix * weight);
    return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`;
  }

  function drawPlayerHeadwear(outfit, player) {
    const bounce = player.state === "run" ? Math.abs(Math.sin(player.runCycle)) * 1.5 : 0;
    ctx.save();
    ctx.translate(0, -bouncingHatOffset(bounce));
    ctx.strokeStyle = "#173b33";
    ctx.lineWidth = 2;
    ctx.fillStyle = outfit.color;
    if (outfit.style === "beanie" || outfit.style === "winter") {
      ctx.beginPath(); ctx.moveTo(-20, -106); ctx.quadraticCurveTo(-17, -124, 0, -126); ctx.quadraticCurveTo(18, -124, 21, -106); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = outfit.style === "winter" ? "#f0eee6" : "#e7b64e";
      ctx.beginPath(); ctx.arc(0, -127, 5.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillRect(-20, -110, 41, 5);
      if (outfit.style === "winter") {
        ctx.fillStyle = outfit.color; ctx.beginPath(); ctx.roundRect(-24, -110, 7, 17, 3); ctx.roundRect(17, -110, 7, 17, 3); ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.moveTo(-21, -106); ctx.quadraticCurveTo(-16, -120, 3, -120); ctx.quadraticCurveTo(20, -119, 22, -106); ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#e2ad3f"; ctx.fillRect(-19, -109, 39, 4);
      ctx.fillStyle = outfit.color;
      ctx.beginPath(); ctx.ellipse(18, -105, 17, 4.5, .12, 0, TAU); ctx.fill(); ctx.stroke();
      if (outfit.style === "miner") {
        ctx.shadowColor = "#ffe77c"; ctx.shadowBlur = 12; ctx.fillStyle = "#ffe16c";
        ctx.beginPath(); ctx.arc(1, -113, 4, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  }

  function bouncingHatOffset(bounce) {
    return bounce;
  }

  function drawPlayerCane(player) {
    const handSwing = player.state === "run" ? Math.sin(player.runCycle) * 5 : 0;
    ctx.save();
    ctx.translate(0, handSwing * .22);
    ctx.strokeStyle = "#5d371f";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(24, -54);
    ctx.quadraticCurveTo(34, -58, 34, -49);
    ctx.lineTo(29 + handSwing * .18, 1);
    ctx.stroke();
    ctx.strokeStyle = "#a7723e";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(31, -42); ctx.lineTo(27 + handSwing * .18, -3); ctx.stroke();
    ctx.fillStyle = "#d8a83f";
    ctx.beginPath(); ctx.arc(24, -54, 2.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawPlayerShoes(outfit, player, stride, speedRatio) {
    const running = player.state === "run" && speedRatio > .12;
    const swing = running ? stride * (7 + speedRatio * 4) : 0;
    const feet = running ? [[-9 - swing, 2], [4 + swing, 2]] : [[-9, 1], [5, 1]];
    ctx.save();
    for (const [x, y] of feet) {
      ctx.fillStyle = outfit.color;
      ctx.strokeStyle = "#222522";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(x + 3, y, outfit.style === "boots" || outfit.style === "snow" ? 8 : 7.5, outfit.style === "snow" ? 5 : 4, 0, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = "#f1eee3";
      ctx.lineWidth = outfit.style === "sneakers" ? 2.4 : 1.4;
      ctx.beginPath(); ctx.moveTo(x - 3, y + 2); ctx.lineTo(x + 10, y + 2); ctx.stroke();
      if (outfit.style === "snow") {
        ctx.fillStyle = "#f3f0e6"; ctx.fillRect(x - 3, y - 5, 13, 3);
      }
    }
    ctx.restore();
  }

  function drawPlayerLantern(player, color) {
    const swing = player.state === "run" ? Math.sin(player.runCycle) * .18 : 0;
    ctx.save();
    ctx.translate(25, -47);
    ctx.rotate(swing);
    ctx.strokeStyle = "#4c3a2d";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, -5, 8, Math.PI, 0); ctx.stroke();
    ctx.shadowColor = "#ffc95a";
    ctx.shadowBlur = 15;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(-7, -4, 14, 18, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#fff0a1"; ctx.beginPath(); ctx.arc(0, 5, 3.5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of game.particles) {
      ctx.save();
      const fade = Math.max(0, Math.min(1, particle.life / particle.maxLife));
      ctx.globalAlpha = fade;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = particle.color;
      if (particle.shape === "dust") {
        ctx.globalAlpha = fade * .48;
        ctx.beginPath(); ctx.ellipse(0, 0, particle.size * 1.35, particle.size * .62, 0, 0, TAU); ctx.fill();
      } else if (particle.shape === "bubble") {
        ctx.globalAlpha = fade * .68;
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(0, 0, particle.size, 0, TAU); ctx.stroke();
        ctx.globalAlpha = fade * .8;
        ctx.fillStyle = "rgba(255,255,255,.75)";
        ctx.beginPath(); ctx.arc(-particle.size * .28, -particle.size * .3, Math.max(.7, particle.size * .18), 0, TAU); ctx.fill();
      } else if (particle.shape === "droplet") {
        ctx.beginPath();
        ctx.moveTo(0, -particle.size * 1.5);
        ctx.quadraticCurveTo(particle.size, 0, 0, particle.size * 1.15);
        ctx.quadraticCurveTo(-particle.size, 0, 0, -particle.size * 1.5);
        ctx.fill();
      } else if (particle.shape === "shard") {
        ctx.beginPath();
        ctx.moveTo(0, -particle.size * 1.4);
        ctx.lineTo(particle.size * .55, 0);
        ctx.lineTo(0, particle.size * 1.2);
        ctx.lineTo(-particle.size * .55, 0);
        ctx.closePath();
        ctx.fill();
      } else if (particle.shape === "spark") {
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = 8;
        ctx.lineWidth = Math.max(1.2, particle.size * .42);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-particle.size * 1.5, 0); ctx.lineTo(particle.size * 1.5, 0);
        ctx.moveTo(0, -particle.size); ctx.lineTo(0, particle.size);
        ctx.stroke();
      } else {
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
      }
      ctx.restore();
    }
  }

  function drawSpruce(x, baseY, height, color, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#5a4938";
    ctx.fillRect(x - height * .035, baseY - height * .22, height * .07, height * .22);
    ctx.fillStyle = color;
    for (let i = 0; i < 3; i += 1) {
      const top = baseY - height + i * height * .2;
      const half = height * (.22 + i * .075);
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x - half, top + height * .55); ctx.lineTo(x + half, top + height * .55); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawFachwerkHouse(x, y, scale, accent) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#efe2c4"; ctx.fillRect(-48, -75, 96, 75);
    ctx.fillStyle = "#544039";
    ctx.beginPath(); ctx.moveTo(-60, -72); ctx.lineTo(0, -116); ctx.lineTo(60, -72); ctx.closePath(); ctx.fill();
    ctx.fillRect(-45, -70, 7, 70); ctx.fillRect(38, -70, 7, 70); ctx.fillRect(-4, -77, 7, 77); ctx.fillRect(-45, -42, 90, 6);
    ctx.lineWidth = 5; ctx.strokeStyle = "#544039";
    ctx.beginPath(); ctx.moveTo(-43, -68); ctx.lineTo(-2, -42); ctx.lineTo(42, -69); ctx.stroke();
    ctx.fillStyle = accent; ctx.fillRect(-26, -31, 20, 31); ctx.fillStyle = "#f4cd68"; ctx.fillRect(12, -29, 19, 18);
    ctx.restore();
  }

  function drawMineHeadframe(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#33433f"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(-65, 0); ctx.lineTo(-28, -135); ctx.lineTo(28, -135); ctx.lineTo(65, 0); ctx.moveTo(-48, -65); ctx.lineTo(48, -65); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -143, 29, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i += 1) { const a = i * TAU / 8; ctx.beginPath(); ctx.moveTo(0, -143); ctx.lineTo(Math.cos(a) * 29, -143 + Math.sin(a) * 29); ctx.stroke(); }
    ctx.restore();
  }

  function drawMill(x, y, scale) {
    drawFachwerkHouse(x, y, scale, "#4b96a3");
    ctx.save(); ctx.translate(x + 65 * scale, y - 18 * scale); ctx.scale(scale, scale);
    ctx.rotate(game.time * .55);
    ctx.strokeStyle = "#77523a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = i * TAU / 8;
      ctx.strokeStyle = i % 2 ? "#8c623f" : "#a2774c";
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 38, Math.sin(a) * 38); ctx.stroke();
    }
    ctx.fillStyle = "#644630"; ctx.beginPath(); ctx.arc(0, 0, 8, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRiverValley(x, y, scale) {
    ctx.save();
    ctx.globalAlpha = .9;
    drawWaterfall(x - 132 * scale, y + 8 * scale, scale);
    drawMill(x + 32 * scale, y, scale * .78);
    ctx.fillStyle = "rgba(49,139,159,.82)";
    ctx.beginPath();
    ctx.ellipse(x - 35 * scale, y + 12 * scale, 150 * scale, 24 * scale, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "rgba(230,250,240,.72)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      const ripple = Math.sin(game.time * 2.2 + i * 1.7) * 8;
      ctx.beginPath(); ctx.ellipse(x - 72 * scale + i * 50 * scale + ripple, y + 8 * scale, 23 * scale, 4 * scale, 0, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  }

  function drawWaterfall(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#63756c";
    ctx.beginPath(); ctx.moveTo(-82, 5); ctx.lineTo(-72, -150); ctx.lineTo(50, -150); ctx.lineTo(69, 5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#4c625e";
    for (let i = 0; i < 4; i += 1) { ctx.beginPath(); ctx.roundRect(-68 + i * 29, -132 + (i % 2) * 16, 22, 72, 8); ctx.fill(); }
    const sway = Math.sin(game.time * 2.5) * 5;
    ctx.fillStyle = "rgba(204,244,245,.76)";
    ctx.beginPath();
    ctx.moveTo(-33 + sway, -151); ctx.lineTo(25 - sway, -151); ctx.quadraticCurveTo(12 + sway, -74, 23 - sway, -5); ctx.lineTo(-31 + sway, -5); ctx.quadraticCurveTo(-18 - sway, -78, -33 + sway, -151); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.62)";
    for (let i = 0; i < 5; i += 1) { const foam = Math.sin(game.time * 3 + i) * 5; ctx.beginPath(); ctx.arc(-32 + i * 15 + foam, -2 - i % 2 * 5, 7, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawTrain(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#3d4946"; ctx.beginPath(); ctx.roundRect(-80, -48, 155, 48, 8); ctx.fill();
    ctx.fillStyle = "#913f43"; ctx.fillRect(-20, -82, 60, 36); ctx.fillStyle = "#2b3634"; ctx.fillRect(-61, -92, 21, 45);
    ctx.fillStyle = "#f2c457"; ctx.fillRect(0, -71, 22, 17);
    ctx.fillStyle = "#252f2d"; ctx.beginPath(); ctx.arc(-43, 1, 19, 0, TAU); ctx.arc(41, 1, 19, 0, TAU); ctx.fill();
    ctx.fillStyle = "rgba(244,244,233,.5)"; ctx.beginPath(); ctx.arc(-52, -112, 16, 0, TAU); ctx.arc(-35, -132, 22, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawSchwibbogen(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#f3c969"; ctx.lineWidth = 8; ctx.shadowColor = "#f3c969"; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, 0, 110, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(110, 0); ctx.stroke();
    for (let i = -4; i <= 4; i += 1) { const cx = i * 23; const cy = -Math.sqrt(Math.max(0, 108 ** 2 - cx ** 2)); ctx.fillStyle = "#f7dc8f"; ctx.beginPath(); ctx.arc(cx, cy, 6, 0, TAU); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.restore();
  }

  function drawRockTowers(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = "#77766b";
    const towers = [[0, 0, 54, 150], [72, 0, 42, 118], [140, 0, 47, 172], [210, 0, 38, 130]];
    for (const [rx, ry, rw, rh] of towers) { ctx.beginPath(); ctx.roundRect(rx, ry - rh, rw, rh, 18); ctx.fill(); ctx.fillStyle = "#6b6c61"; ctx.fillRect(rx + 8, ry - rh + 34, rw - 10, 8); ctx.fillStyle = "#77766b"; }
    ctx.restore();
  }

  function drawCastle(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = "#7d796d";
    ctx.fillRect(-85, -95, 170, 95); ctx.fillRect(-105, -135, 50, 135); ctx.fillRect(55, -155, 50, 155);
    ctx.fillStyle = "#5c5552";
    ctx.beginPath(); ctx.moveTo(-115, -135); ctx.lineTo(-80, -180); ctx.lineTo(-45, -135); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(45, -155); ctx.lineTo(80, -205); ctx.lineTo(115, -155); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#eac36a"; ctx.fillRect(-10, -55, 20, 55); ctx.fillRect(-88, -112, 14, 20); ctx.fillRect(73, -125, 14, 20);
    ctx.restore();
  }

  function drawSummitTower(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#716f68"; ctx.fillRect(-48, -122, 96, 122); ctx.fillStyle = "#4c514d"; ctx.fillRect(-18, -205, 36, 83);
    ctx.strokeStyle = "#4c514d"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -205); ctx.lineTo(0, -252); ctx.stroke();
    ctx.fillStyle = "#b54d50"; ctx.beginPath(); ctx.moveTo(3, -247); ctx.lineTo(44, -232); ctx.lineTo(3, -217); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#f0cf75"; ctx.fillRect(-30, -91, 19, 25); ctx.fillRect(11, -91, 19, 25);
    ctx.restore();
  }

  function drawSignpost(x, y, symbol) {
    ctx.fillStyle = "#6b4b35"; ctx.fillRect(x - 4, y - 72, 8, 72);
    ctx.fillStyle = "#b77a43"; ctx.beginPath(); ctx.roundRect(x - 32, y - 73, 72, 28, 5); ctx.fill();
    ctx.fillStyle = "#f5e5c2"; ctx.font = "bold 17px system-ui"; ctx.textAlign = "center"; ctx.fillText(symbol, x + 4, y - 52);
  }

  function drawMineSupport(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = "#594838"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-64, 0); ctx.lineTo(-49, -115); ctx.lineTo(49, -115); ctx.lineTo(64, 0); ctx.stroke();
    ctx.strokeStyle = "#856344"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-50, -112); ctx.lineTo(49, -112); ctx.stroke();
    ctx.fillStyle = "#ffd15f"; ctx.globalAlpha = .78;
    ctx.beginPath(); ctx.arc(0, -95, 5, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function drawRiverWater(x, y, width, seed) {
    ctx.save(); ctx.globalAlpha = .72;
    ctx.fillStyle = "#3e9eaa"; ctx.fillRect(x, y, width, 28);
    ctx.strokeStyle = "rgba(230,255,246,.65)"; ctx.lineWidth = 2;
    for (let i = 0; i < 4; i += 1) {
      const waveX = x + i * 66 + Math.sin(game.time * 2 + seed + i) * 10;
      ctx.beginPath(); ctx.moveTo(waveX, y + 9 + i % 2 * 7); ctx.quadraticCurveTo(waveX + 16, y + 3, waveX + 33, y + 9 + i % 2 * 7); ctx.stroke();
    }
    ctx.restore();
  }

  function drawRailTrack(x, y, width) {
    ctx.save(); ctx.strokeStyle = "#454946"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + width, y); ctx.moveTo(x, y + 13); ctx.lineTo(x + width, y + 13); ctx.stroke();
    ctx.strokeStyle = "#72513a"; ctx.lineWidth = 5;
    for (let px = x + 10; px < x + width; px += 28) { ctx.beginPath(); ctx.moveTo(px, y - 5); ctx.lineTo(px, y + 18); ctx.stroke(); }
    ctx.restore();
  }

  function drawChimney(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#734f4b"; ctx.fillRect(-12, -104, 24, 104); ctx.fillStyle = "#4c403d"; ctx.fillRect(-17, -109, 34, 9);
    for (let i = 0; i < 3; i += 1) { ctx.globalAlpha = .15 - i * .03; ctx.fillStyle = "#f1eee2"; ctx.beginPath(); ctx.arc(Math.sin(game.time + i) * 6, -126 - i * 17, 9 + i * 4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  function drawLantern(x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.fillStyle = "#63462f"; ctx.fillRect(-3, -105, 6, 105); ctx.fillRect(-22, -103, 38, 6);
    ctx.shadowColor = "#f6cf72"; ctx.shadowBlur = 14; ctx.fillStyle = "#f6cf72"; ctx.beginPath(); ctx.roundRect(-12, -94, 22, 31, 5); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = "#885c37"; ctx.fillRect(-15, -100, 28, 7); ctx.restore();
  }

  function drawClimbingFlag(x, y) {
    ctx.save(); ctx.fillStyle = "#654736"; ctx.fillRect(x, y - 62, 4, 62); ctx.fillStyle = "#d65156";
    ctx.beginPath(); ctx.moveTo(x + 3, y - 61); ctx.lineTo(x + 34, y - 50); ctx.lineTo(x + 3, y - 39); ctx.closePath(); ctx.fill(); ctx.restore();
  }

  function drawWindRibbon(x, y, seed) {
    ctx.save(); ctx.globalAlpha = .35; ctx.strokeStyle = "#f5f1dc"; ctx.lineWidth = 3; ctx.lineCap = "round";
    const drift = Math.sin(game.time * 1.6 + seed) * 16;
    ctx.beginPath(); ctx.moveTo(x - 65 + drift, y); ctx.bezierCurveTo(x - 28 + drift, y - 13, x + 8 + drift, y + 13, x + 55 + drift, y - 5); ctx.stroke(); ctx.restore();
  }


  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    const fullscreen = Boolean(
      document.fullscreenElement
      || document.webkitFullscreenElement
      || window.matchMedia?.("(display-mode: fullscreen)")?.matches
      || (window.screen
        && Math.abs(window.innerWidth - window.screen.width) < 10
        && window.innerHeight >= window.screen.height * .86),
    );
    renderProfile = computeCanvasMetrics(rect.width, rect.height, window.devicePixelRatio || 1, fullscreen);
    game.performanceMode = renderProfile.performanceMode;
    if (canvas.width !== renderProfile.width) canvas.width = renderProfile.width;
    if (canvas.height !== renderProfile.height) canvas.height = renderProfile.height;
    document.body.classList.toggle("is-performance-mode", renderProfile.performanceMode);
  }

  function getViewWidth() {
    if (!canvas.height) return W;
    return Math.max(320, H * (canvas.width / canvas.height));
  }

  function getRenderProfile() {
    return { ...renderProfile };
  }


    return {
      draw,
      resizeCanvas,
      getViewWidth,
      getRenderProfile,
      currentOutfitLoadout,
      singleOutfitLoadout,
      renderOutfitVariantInto,
    };
  }

  Object.assign(window.SchorschGame ||= {}, { computeCanvasMetrics, createRenderer });
})();
