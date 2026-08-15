(() => {
  "use strict";

  function createAudioEngine({ game, LEVELS, LEVEL_MUSIC, SECRET_MUSIC }) {
    let audioContext = null;

  function ensureAudio() {
    if (!game.sound) return null;
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
    return audioContext;
  }

  function playRegionalIntro(level) {
    const theme = musicThemeFor(level);
    const introNotes = theme.melody.filter((note) => note !== null).slice(0, 4);
    game.musicStep = 0;
    game.musicBeatAt = game.time + (theme.secret ? .72 : .9);
    playFolkChord(theme.root - 12, theme.mode, theme.secret ? "bell" : "accordion", .006, 0);
    introNotes.forEach((offset, index) => {
      playFolkVoice(theme.root + offset, .2 + index * .025, theme.lead, .016, .08 + index * .12);
    });
    if (theme.secret) playFolkPercussion("chime", .008, .53);
  }

  function updateRegionalMusic(level) {
    if (!game.sound || game.time < game.musicBeatAt) return;
    const theme = musicThemeFor(level);
    const stepLength = 30 / theme.tempo;
    playMusicStep(theme, game.musicStep, stepLength);
    game.musicStep += 1;
    game.musicBeatAt = game.time + stepLength;
  }

  function musicThemeFor(level) {
    const index = Math.max(0, Math.min(LEVELS.length - 1, level.index || 0));
    return level.isBonusRoom ? (SECRET_MUSIC[index] || SECRET_MUSIC[0]) : (LEVEL_MUSIC[index] || LEVEL_MUSIC[0]);
  }

  function playMusicStep(theme, step, stepLength) {
    const position = step % theme.melody.length;
    const beat = step % theme.meter;
    const bar = Math.floor(step / theme.meter);
    const chordOffset = theme.progression[bar % theme.progression.length];
    const chordRoot = theme.root - 12 + chordOffset;
    const melodyOffset = theme.melody[position];

    if (melodyOffset !== null) {
      playFolkVoice(theme.root + melodyOffset, stepLength * (theme.secret ? .82 : 1.05), theme.lead, theme.secret ? .009 : .0115);
    }

    if (theme.rhythm === "waltz" || theme.rhythm === "minuet") {
      if (beat === 0) {
        playFolkVoice(chordRoot - 12, stepLength * 1.65, "bass", .009);
        playFolkPercussion("stomp", .006);
      }
      if (beat === 2 || beat === 4) playFolkChord(chordRoot, theme.mode, "accordion", .0036);
      if (theme.rhythm === "minuet" && beat === 4) playFolkPercussion("wood", .004);
    } else if (theme.rhythm === "polka") {
      if (beat === 0 || beat === 4) {
        playFolkVoice(chordRoot - 12, stepLength * 1.25, "bass", .0095);
        playFolkPercussion("stomp", .007);
      }
      if (beat === 2 || beat === 6) {
        playFolkChord(chordRoot, theme.mode, "accordion", .0038);
        playFolkPercussion("wood", .0045);
      }
    } else if (theme.rhythm === "flow") {
      if (beat === 0) playFolkVoice(chordRoot - 12, stepLength * 2.4, "bass", .008);
      if (beat === 2 || beat === 6) playFolkChord(chordRoot, theme.mode, "strings", .0032);
      if (beat === 4) playFolkVoice(chordRoot + 12, stepLength * 1.8, "bell", .0038);
    } else if (theme.rhythm === "secret") {
      if (beat === 0) {
        playFolkVoice(chordRoot - 12, stepLength * 2.1, "bass", .0068);
        playFolkVoice(chordRoot + 12, stepLength * 1.5, "bell", .0035, .04);
      }
      if (beat === 3 || beat === 6) playFolkChord(chordRoot, theme.mode, "strings", .0028);
      if (beat === theme.meter - 1) playFolkPercussion("chime", .0045);
    } else {
      if (beat === 0 || beat === 4) {
        playFolkVoice(chordRoot - 12, stepLength * 1.5, "bass", .009);
        playFolkPercussion("stomp", .007);
      }
      if (beat === 2 || beat === 6) playFolkChord(chordRoot, theme.mode, theme.lead === "horn" ? "strings" : "accordion", .0034);
      if (beat % 2 === 1) playFolkPercussion("wood", .0032);
    }

    if (!theme.secret && beat === Math.floor(theme.meter / 2)) {
      const answer = chordRoot + (theme.mode === "major" ? 16 : 15);
      playFolkVoice(answer, stepLength * .72, theme.lead === "flute" ? "zither" : "flute", .0036, .025);
    }
  }

  function playFolkChord(rootMidi, mode, voice, volume, delay = 0) {
    const third = mode === "major" ? 4 : 3;
    [0, third, 7].forEach((offset, index) => {
      playFolkVoice(rootMidi + offset, .42, voice, volume * (index === 0 ? 1 : .78), delay + index * .012);
    });
  }

  function playFolkVoice(midi, duration, voice = "zither", volume = .01, delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const profiles = {
      zither: { partials: [["triangle", 1, 1], ["sine", 2, .22]], attack: .004, filter: 3100, pluck: true },
      dulcimer: { partials: [["triangle", 1, 1], ["square", 2, .12], ["sine", 3, .08]], attack: .003, filter: 2600, pluck: true },
      accordion: { partials: [["sawtooth", 1, .56, -6], ["sawtooth", 1, .56, 6]], attack: .045, filter: 1500 },
      flute: { partials: [["sine", 1, 1], ["triangle", 2, .09]], attack: .035, filter: 3600, vibrato: .72 },
      clarinet: { partials: [["square", 1, .46], ["sine", 1, .58], ["sine", 3, .09]], attack: .025, filter: 2100, vibrato: .28 },
      strings: { partials: [["triangle", 1, .72, -4], ["triangle", 1, .72, 4]], attack: .07, filter: 1250, vibrato: .2 },
      bell: { partials: [["sine", 1, 1], ["sine", 2.01, .28], ["sine", 3.98, .1]], attack: .003, filter: 4200, pluck: true },
      horn: { partials: [["sawtooth", 1, .36], ["triangle", 1, .72], ["sine", 2, .12]], attack: .055, filter: 1100, vibrato: .18 },
      bass: { partials: [["triangle", 1, .88], ["sine", 1, .52]], attack: .012, filter: 620, pluck: true },
    };
    const profile = profiles[voice] || profiles.zither;
    const start = audio.currentTime + Math.max(0, delay);
    const end = start + Math.max(.055, duration);
    const frequency = 440 * 2 ** ((midi - 69) / 12);
    const envelope = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(profile.filter, start);
    filter.Q.setValueAtTime(voice === "accordion" ? 1.4 : .7, start);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.linearRampToValueAtTime(volume, start + profile.attack);
    if (profile.pluck) envelope.gain.exponentialRampToValueAtTime(Math.max(.0002, volume * .24), start + duration * .48);
    envelope.gain.exponentialRampToValueAtTime(.0001, end);
    filter.connect(envelope).connect(audio.destination);

    const oscillators = [];
    for (const [type, harmonic, level, detune = 0] of profile.partials) {
      const oscillator = audio.createOscillator();
      const partialGain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency * harmonic, start);
      oscillator.detune.setValueAtTime(detune, start);
      partialGain.gain.setValueAtTime(level, start);
      oscillator.connect(partialGain).connect(filter);
      oscillator.start(start);
      oscillator.stop(end + .03);
      oscillators.push(oscillator);
    }

    if (profile.vibrato) {
      const lfo = audio.createOscillator();
      const lfoGain = audio.createGain();
      lfo.frequency.setValueAtTime(5.2, start);
      lfoGain.gain.setValueAtTime(profile.vibrato, start);
      lfo.connect(lfoGain);
      oscillators.forEach((oscillator) => lfoGain.connect(oscillator.frequency));
      lfo.start(start);
      lfo.stop(end + .03);
    }
  }

  function playFolkPercussion(kind, volume = .006, delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + Math.max(0, delay);
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = kind === "stomp" ? "sine" : kind === "chime" ? "triangle" : "square";
    const startFrequency = kind === "stomp" ? 115 : kind === "chime" ? 1250 : 760;
    const endFrequency = kind === "stomp" ? 54 : kind === "chime" ? 720 : 260;
    const duration = kind === "stomp" ? .14 : kind === "chime" ? .11 : .055;
    oscillator.frequency.setValueAtTime(startFrequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + .02);
  }

  function playTone(frequency, duration, type = "sine", volume = 0.04, slide = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.linearRampToValueAtTime(Math.max(60, frequency + slide), audio.currentTime + duration);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  function playJingle() {
    [0, 110, 220, 360].forEach((delay, index) => {
      window.setTimeout(() => playTone([440, 554, 659, 880][index], .18, "sine", .04, 50), delay);
    });
  }


    return {
      ensureAudio,
      playRegionalIntro,
      updateRegionalMusic,
      musicThemeFor,
      playTone,
      playJingle,
    };
  }

  Object.assign(window.SchorschGame ||= {}, { createAudioEngine });
})();
