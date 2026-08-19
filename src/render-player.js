(() => {
  "use strict";

  function createPlayerRenderer(runtime) {
    const { ctx, game, TAU, HAND_ITEMS, characterImage, divingCharacterImage } = runtime;

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

    return {
      drawPlayer,
      currentOutfitLoadout,
      singleOutfitLoadout,
      renderOutfitVariantInto,
    };
  }

  Object.assign(window.SchorschGame ||= {}, { createPlayerRenderer });
})();
