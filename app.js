(() => {
  'use strict';
  const entrance = document.getElementById('entrance');
  const home = document.getElementById('home');
  const powerButton = document.getElementById('power-button');
  const identityText = document.getElementById('identity-text');
  const accessText = document.getElementById('access-text');
  const letteringHatch = document.getElementById('lettering-hatch');
  const welcomeCorners = Array.from(document.querySelectorAll('.welcome-corners polygon'), polygon => ({
    polygon, angle: Number(polygon.dataset.angle), length: Number(polygon.dataset.length)
  }));
  const globe = new window.HakamoriParticles.PointGlobe(document.getElementById('prelude-particles'));
  const helixes = new window.HakamoriParticles.ParticleHelixes(document.getElementById('helix-particles'));
  const cursorSparks = new window.HakamoriParticles.CursorSparks(document.getElementById('home-cursor-sparks'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let state = 'prelude';
  let animationFrame = 0;
  let helixFrame = 0;
  let sequenceStartedAt = 0;
  let bootStartedAt = 0;
  let blurStartedAt = 0;
  const blurDuration = 600;
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

  // Percentage follows the animation timeline, not resource loading.
  // This visual sequence performs no account or permission checks.
  const flashStart = 4350;
  const flashFrameMs = 1000 / 30;
  const processingStart = flashStart + 5 * flashFrameMs;
  const authorizationStart = processingStart + 3000;
  const splitStart = authorizationStart + 2200;
  const splitLeadMs = 100;
  const splitHoldMs = 50;
  const splitOpenMs = 400;
  const welcomeStart = splitStart + splitLeadMs + splitHoldMs + splitOpenMs;
  const letteringStart = splitStart + 3290;
  const letteringFrameMs = 1000 / 25;
  const ghostStartFrame = 53;
  const ghostEndFrame = 66;
  const letteringCues = [
    [0, 'bars'],
    [7, 'interference'],
    [8, 'interference-return'],
    [9, 'bars'],
    [11, 'title'],
    [18, 'tear'],
    [20, 'blank'],
    [22, 'lock'],
    [ghostStartFrame, 'echo'],
    [56, 'flash-lock'],
    [57, 'lock'],
    [58, 'echo'],
    [65, 'flash-lock'],
    [ghostEndFrame, 'scan-lock'],
    [70, 'lock']
  ];
  const letteringSignals = {
    40: 'lower', 41: 'lower',
    42: 'edge', 43: 'edge',
    46: 'upper', 47: 'upper',
    55: 'lower', 56: 'lower',
    59: 'tail', 60: 'tail',
    76: 'both', 77: 'both'
  };
  const welcomeComplete = letteringStart + 4480;
  const phases = [
    { at: 0, name: 'identity' },
    { at: 1750, name: 'verified' },
    { at: 2650, name: 'frames' },
    { at: flashStart, name: 'flash' },
    { at: processingStart, name: 'processing' },
    { at: authorizationStart, name: 'authorized' },
    { at: splitStart, name: 'split' },
    { at: welcomeStart, name: 'welcome' },
    // Assemble the logo as the halves open, then hold it for 1000ms.
    { at: welcomeComplete + 1000, name: 'blur' }
  ];
  const confirmation = 'ID CONFIRMED';

  function sizeProgress() {
    entrance.style.setProperty('--progress-scale', (innerWidth * .48 / 175).toFixed(4));
  }
  sizeProgress();

  function animateHelixes(now) {
    if (state === 'entered' || state === 'blurring') return;
    const phase = entrance.dataset.phase;
    if (!['boot-prelude', 'processing', 'authorized', 'split', 'welcome'].includes(phase)) helixes.draw(now);
    if (!reducedMotion.matches) helixFrame = requestAnimationFrame(animateHelixes);
  }

  function readyToStart() {
    if (state !== 'loading' && state !== 'prelude') return;
    state = 'waiting';
    entrance.dataset.phase = 'boot-ready';
    powerButton.hidden = false;
    powerButton.disabled = false;
    if (reducedMotion.matches) helixes.draw(performance.now());
  }

  function playBoot(now) {
    if (state !== 'prelude' && state !== 'loading') return;
    if (!bootStartedAt) bootStartedAt = now;
    const elapsed = now - bootStartedAt;
    if (elapsed < 1850) {
      globe.draw(elapsed);
      const message = 'ACCESS PERMISSION REQUIRED';
      const length = Math.max(0, Math.floor((elapsed - 120) / 22));
      accessText.textContent = message.slice(0, length);
      entrance.classList.toggle('access-complete', length >= message.length);
      entrance.classList.toggle('prelude-finish', elapsed > 1500);
    } else if (state === 'prelude') {
      state = 'loading';
      entrance.dataset.phase = 'boot-loading';
      powerButton.hidden = false;
    }
    if (elapsed >= 3600) readyToStart();
    else animationFrame = requestAnimationFrame(playBoot);
  }

  function finishHome() {
    if (state === 'entered') return;
    state = 'entered';
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(helixFrame);
    entrance.hidden = true;
    entrance.inert = true;
    home.hidden = false;
    home.inert = false;
    cursorSparks.canvas.hidden = false;
    cursorSparks.resize();
    home.style.opacity = '';
    for (const element of [entrance, home]) {
      element.style.filter = '';
      element.style.removeProperty('--text-warp');
      element.classList.remove('blur-transition');
    }
    home.querySelector('h1').focus({preventScroll: true});
  }

  function showStillWelcome() {
    state = 'still-welcome';
    entrance.dataset.phase = 'welcome';
    entrance.dataset.lettering = 'lock';
    window.setTimeout(finishHome, 1000);
  }

  function playBlur(now) {
    if (state !== 'blurring') return;
    const progress = Math.max(0, Math.min(1, (now - blurStartedAt) / blurDuration));
    const outgoingWarp = smooth(progress / .5);
    const incomingWarp = 1 - smooth((progress - .5) / .5);
    const mix = smooth((progress - .3) / .4);
    entrance.style.filter = `blur(${outgoingWarp * 32}px)`;
    entrance.style.opacity = 1 - mix;
    entrance.style.setProperty('--text-warp', outgoingWarp);
    home.style.filter = `blur(${incomingWarp * 32}px)`;
    home.style.opacity = mix;
    home.style.setProperty('--text-warp', incomingWarp);
    entrance.dataset.blurStage = progress < .5 ? 'blurring' : 'clarifying';
    if (progress >= 1) finishHome();
    else animationFrame = requestAnimationFrame(playBlur);
  }

  function beginBlur(now) {
    state = 'blurring';
    blurStartedAt = now;
    entrance.classList.add('capture-freeze', 'blur-transition');
    home.classList.add('blur-transition');
    entrance.dataset.transition = 'blur';
    home.hidden = false;
    home.style.opacity = '0';
    playBlur(now);
  }

  function drawWelcomeCorners(elapsed) {
    const turn = smooth((elapsed - 1020) / 330);
    const extend = smooth((elapsed - 1230) / 560);
    const halfWidth = 6 - 4.8 * smooth((elapsed - 1590) / 370);
    const triangle = [[0, -8], [9, 7], [0, 7], [-9, 7]];
    for (const { polygon, angle, length } of welcomeCorners) {
      const edge = [[5, -halfWidth], [length, -halfWidth], [length, halfWidth], [-5, halfWidth]];
      const points = triangle.map(([x, y], index) => {
        const [edgeX, edgeY] = edge[index];
        return `${x + (edgeX - x) * extend},${y + (edgeY - y) * extend}`;
      });
      polygon.setAttribute('points', points.join(' '));
      polygon.setAttribute('transform', `rotate(${angle * turn})`);
    }
  }

  function playSequence(now) {
    if (state !== 'playing') return;
    if (!sequenceStartedAt) sequenceStartedAt = now;
    const elapsed = now - sequenceStartedAt;
    const phase = phases.findLast(item => elapsed >= item.at).name;
    if (phase === 'blur') {
      beginBlur(now);
      return;
    }
    if (entrance.dataset.phase !== phase) {
      if (phase === 'split') window.HakamoriParticles.prepareSplit(entrance);
      else if (entrance.dataset.phase === 'split') document.getElementById('center-split').replaceChildren();
      entrance.dataset.phase = phase;
    }
    if (phase === 'split') {
      const splitElapsed = elapsed - splitStart;
      let opening = .1;
      if (splitElapsed < splitLeadMs) {
        opening = .1 * splitElapsed / splitLeadMs;
        entrance.dataset.splitStage = 'lead';
      } else if (splitElapsed < splitLeadMs + splitHoldMs) {
        entrance.dataset.splitStage = 'hold';
      } else {
        const progress = Math.max(0, Math.min(1, (splitElapsed - splitLeadMs - splitHoldMs) / splitOpenMs));
        opening = .1 + .9 * progress;
        entrance.dataset.splitStage = 'open';
      }
      entrance.style.setProperty('--split-open', opening);
    }
    if (phase === 'identity' || phase === 'verified') {
      const characters = Math.max(0, Math.floor((elapsed - 250) / 64));
      identityText.textContent = confirmation.slice(0, characters);
      entrance.classList.toggle('identity-complete', characters >= confirmation.length);
    }
    if (phase === 'processing') {
      const fraction = Math.max(0, Math.min(1, (elapsed - processingStart) / 2800));
      const progress = Math.round((1 - Math.pow(1 - fraction, 1.6)) * 100);
      document.getElementById('opening-progress').textContent = progress;
      document.getElementById('progress-fill').style.transform = `scaleX(${fraction})`;
    }
    if (phase === 'authorized') {
      const text = 'PERMISSION AUTHORIZED';
      const count = Math.max(0, Math.floor((elapsed - authorizationStart - 100) / 35));
      document.getElementById('permission-text').textContent = text.slice(0, count);
      entrance.classList.toggle('authorization-complete', count >= text.length);
    }
    if (phase === 'flash') entrance.dataset.flashFrame = Math.min(4, Math.floor((elapsed - flashStart) / flashFrameMs));
    if (phase === 'split' || phase === 'welcome') {
      const welcomeElapsed = elapsed - splitStart;
      if (welcomeElapsed < 1960) drawWelcomeCorners(welcomeElapsed);
      if (elapsed >= letteringStart) {
        const framePosition = (elapsed - letteringStart) / letteringFrameMs;
        const frame = Math.floor(framePosition);
        if (frame >= ghostStartFrame && frame < ghostEndFrame) {
          const ghostProgress = (framePosition - ghostStartFrame) / (ghostEndFrame - ghostStartFrame);
          letteringHatch.setAttribute('width', (8 + 8 * ghostProgress).toFixed(2));
        }
        const [, cue] = letteringCues.findLast(([at]) => frame >= at);
        if (entrance.dataset.lettering !== cue) entrance.dataset.lettering = cue;
        const signal = letteringSignals[frame] ?? '';
        if (entrance.dataset.letteringSignal !== signal) entrance.dataset.letteringSignal = signal;
      }
      entrance.dataset.welcomeState = elapsed >= welcomeComplete ? 'holding' : 'revealing';
    }
    animationFrame = requestAnimationFrame(playSequence);
  }

  powerButton.addEventListener('click', event => {
    if (event.button !== 0 || state !== 'waiting') return;
    state = 'playing';
    powerButton.disabled = true;
    powerButton.hidden = true;
    helixes.burst(performance.now());
    cancelAnimationFrame(animationFrame);
    if (reducedMotion.matches) showStillWelcome();
    else animationFrame = requestAnimationFrame(playSequence);
  });

  for (const [id, offset] of [['wave-a', 0], ['wave-b', Math.PI]]) {
    const points = [];
    for (let x = -100; x <= 1700; x += 12) {
      points.push([x, 450 + Math.sin(x * .0052 + offset) * 49 + Math.cos(x * .002) * 15]);
    }
    const pathData = points.map((point, index) => `${index ? 'L' : 'M'}${point[0]},${point[1].toFixed(1)}`).join(' ');
    document.getElementById(id).setAttribute('d', pathData);
    document.getElementById('flash-' + id).setAttribute('d', pathData);
  }

  reducedMotion.addEventListener('change', () => {
    if (!reducedMotion.matches) {
      if (state !== 'entered') helixFrame = requestAnimationFrame(animateHelixes);
      return;
    }
    cancelAnimationFrame(animationFrame);
    cancelAnimationFrame(helixFrame);
    cursorSparks.clear();
    if (state === 'prelude' || state === 'loading') readyToStart();
    else if (state === 'playing') showStillWelcome();
    else if (state === 'blurring') finishHome();
  });

  Promise.all([
    Promise.race([document.fonts.ready, new Promise(resolve => window.setTimeout(resolve, 1000))]),
    globe.ready
  ]).then(() => {
    if (reducedMotion.matches) readyToStart();
    else {
      animationFrame = requestAnimationFrame(playBoot);
      helixFrame = requestAnimationFrame(animateHelixes);
    }
  }).catch(error => {
    console.error('Could not prepare the opening assets', error);
    readyToStart();
  });

  window.addEventListener('resize', () => {
    sizeProgress();
    if (state === 'prelude') globe.resize();
    if (state !== 'entered') helixes.resize();
    else cursorSparks.resize();
  });

  window.addEventListener('pointermove', event => {
    if (state !== 'entered' || event.pointerType !== 'mouse' || reducedMotion.matches) return;
    cursorSparks.move(event.clientX, event.clientY);
    const x = 2 * event.clientX / innerWidth - 1;
    const y = 2 * event.clientY / innerHeight - 1;
    const scale = 1 + Math.max(Math.abs(x), Math.abs(y)) * .045;
    home.style.setProperty('--home-tilt', `scale(${scale}) rotateX(${-10 * y}deg) rotateY(${10 * x}deg)`);
  });
  function resetHomeTilt() {
    home.style.removeProperty('--home-tilt');
    cursorSparks.stop();
  }
  document.documentElement.addEventListener('pointerleave', resetHomeTilt);
  window.addEventListener('blur', resetHomeTilt);
})();
