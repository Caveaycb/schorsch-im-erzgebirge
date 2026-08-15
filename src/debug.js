(() => {
  "use strict";

  function createDebugTools({ canvas, ctx, game, H, getViewWidth }) {
    let enabled = false;
    let fps = 0;
    let fpsElapsed = 0;
    let fpsFrames = 0;
    let checkpointCursor = 0;

    function toggle() {
      enabled = !enabled;
      return enabled;
    }

    function sample(dt) {
      fpsElapsed += dt;
      fpsFrames += 1;
      if (fpsElapsed >= .25) {
        fps = fpsFrames / fpsElapsed;
        fpsElapsed = 0;
        fpsFrames = 0;
      }
    }

    function jumpToNextCheckpoint() {
      const level = game.level;
      const player = game.player;
      if (!level || !player) return null;
      const checkpoints = level.checkpoints?.length ? level.checkpoints : level.checkpoint ? [level.checkpoint] : [];
      const targets = [
        { x: level.start.x, y: level.start.y, label: "Levelstart" },
        ...checkpoints.map((checkpoint, index) => ({
          x: checkpoint.x - 20,
          y: checkpoint.y - 10,
          label: checkpoint.label || `Checkpoint ${index + 1}`,
        })),
      ];
      if (!targets.length) return null;
      checkpointCursor = (checkpointCursor + 1) % targets.length;
      const target = targets[checkpointCursor];
      player.x = Math.max(0, target.x);
      player.y = target.y;
      player.prevY = player.y;
      player.vx = 0;
      player.vy = 0;
      player.invincible = 1;
      player.respawnX = player.x;
      player.respawnY = player.y;
      game.cameraX = Math.max(0, player.x - 220);
      game.cameraY = 0;
      game.cameraLookX = 0;
      game.cameraKick = 0;
      return target.label;
    }

    function strokeRect(box, color, width = 2) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    }

    function drawWorldHitboxes(level, player) {
      ctx.save();
      ctx.translate(-game.cameraX, -game.cameraY - game.cameraKick);
      ctx.globalAlpha = .82;

      for (const platform of level.platforms || []) {
        if (platform.active === false) continue;
        strokeRect(platform, platform.ground ? "#53e18b" : "#61c5ff", platform.ground ? 2 : 1.5);
      }
      for (const spring of level.springs || []) strokeRect(spring, "#f2c94c", 2);
      for (const checkpoint of level.checkpoints || []) {
        ctx.strokeStyle = checkpoint.active ? "#7df2a7" : "#ffe278";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(checkpoint.x, checkpoint.y - 70);
        ctx.lineTo(checkpoint.x, checkpoint.y + 30);
        ctx.stroke();
      }
      for (const hazard of level.hazards || []) {
        if (hazard.collected) continue;
        ctx.strokeStyle = hazard.kind === "sunBoost" ? "#ffe35e" : "#ff6574";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, hazard.r + 25, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (const crystal of level.collectibles || []) {
        if (!crystal.collected) strokeRect({ x: crystal.x - 17, y: crystal.y - 22, w: 34, h: 44 }, "#8be5ff", 1);
      }
      for (const node of level.chapter?.task.nodes || []) {
        ctx.strokeStyle = node.active ? "#71dd9a" : "#ffcf57";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 54, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (level.goal) strokeRect(level.goal, level.chapter?.finale.state === "complete" ? "#71e49b" : "#ff9d62", 3);
      if (player) strokeRect(player, "#ff4fe1", 3);
      ctx.restore();
    }

    function drawPanel(level, player) {
      const visibleWidth = getViewWidth();
      const panelWidth = 340;
      const x = Math.max(10, visibleWidth - panelWidth - 14);
      ctx.save();
      ctx.fillStyle = "rgba(7,18,23,.9)";
      ctx.strokeStyle = "rgba(117,225,200,.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, 14, panelWidth, 142, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8df2cf";
      ctx.font = "900 13px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText(`DEBUG · ${fps.toFixed(0)} FPS`, x + 14, 36);
      ctx.fillStyle = "#eef8ef";
      ctx.font = "12px ui-monospace, SFMono-Regular, monospace";
      const rows = [
        `${level.index + 1}. ${level.short || level.name}`,
        `x ${player?.x.toFixed(1) ?? "–"}  y ${player?.y.toFixed(1) ?? "–"}`,
        `vx ${player?.vx.toFixed(1) ?? "–"}  vy ${player?.vy.toFixed(1) ?? "–"}`,
        `state ${player?.state || "–"}  ground ${player?.onGround ? "yes" : "no"}`,
        `F3 Overlay · F4 nächster Checkpoint`,
      ];
      rows.forEach((row, index) => ctx.fillText(row, x + 14, 57 + index * 19, panelWidth - 28));
      ctx.restore();
    }

    function draw() {
      if (!enabled || !game.level) return;
      const scale = canvas.height / H;
      ctx.save();
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      drawWorldHitboxes(game.level, game.player);
      drawPanel(game.level, game.player);
      ctx.restore();
    }

    function state() {
      return { enabled, fps, checkpointCursor };
    }

    return { toggle, sample, draw, jumpToNextCheckpoint, state };
  }

  Object.assign(window.SchorschGame ||= {}, { createDebugTools });
})();
