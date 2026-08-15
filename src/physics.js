(() => {
  "use strict";

  function groundAt(level, x) {
    return level.platforms.find((platform) => platform.ground && x >= platform.x && x <= platform.x + platform.w);
  }

  function applyRegionalMechanics(level, player, dt) {
    for (const current of level.currents || []) {
      const centerX = player.x + player.w / 2;
      const centerY = player.y + player.h / 2;
      const insideX = centerX > current.x && centerX < current.x + current.w;
      const insideY = current.y == null ? player.y > 430 : centerY > current.y && centerY < current.y + current.h;
      if (insideX && insideY) {
        player.vx += current.push * dt;
        if (current.lift) player.vy += current.lift * dt;
      }
    }
    for (const wind of level.windZones || []) {
      const inside = player.x + player.w / 2 > wind.x && player.x + player.w / 2 < wind.x + wind.w && player.y < 535;
      if (inside) player.vx += wind.push * dt;
    }
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function hash(value) {
    const x = Math.sin(value * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function wrap(value, min, max) {
    const range = max - min;
    return ((value - min) % range + range) % range + min;
  }


  function movementTuning({ underwater, onGround, icy, sprintTalent, sunPowered }) {
    const speedFactor = (sprintTalent ? 1.14 : 1) * (sunPowered ? 1.28 : 1);
    const accelerationFactor = (sprintTalent ? 1.12 : 1) * (sunPowered ? 1.24 : 1);
    return {
      acceleration: (underwater ? 980 : onGround ? (icy ? 1780 : 2550) : 1550) * accelerationFactor,
      maxSpeed: (underwater ? 285 : 385) * speedFactor,
      idleDrag: underwater ? .035 : onGround ? (icy ? .34 : .0007) : .085,
    };
  }

  function landingFeedback(impact) {
    const strength = Math.min(1, Math.max(0, (impact - 300) / 520));
    return {
      strength,
      duration: .1 + strength * .07,
      cameraKick: .7 + strength * 2.1,
      shake: strength * .028,
    };
  }

  Object.assign(window.SchorschGame ||= {}, {
    groundAt,
    applyRegionalMechanics,
    rectsOverlap,
    hash,
    wrap,
    movementTuning,
    landingFeedback,
  });
})();
