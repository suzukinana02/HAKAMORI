(() => {
  'use strict';
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
  const random = seed => { const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return value - Math.floor(value); };

  class PointGlobe {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.points = [];
      this.ready = this.loadLand();
      this.resize();
    }
    async loadLand() {
      const response = await fetch('assets/land-110m.geojson');
      if (!response.ok) throw new Error('Could not load the Earth land outline');
      const geography = await response.json();
      const mask = document.createElement('canvas');
      mask.width = 1440;
      mask.height = 720;
      const context = mask.getContext('2d', {willReadFrequently: true});
      context.fillStyle = '#fff';
      function paintPolygon(rings) {
        context.beginPath();
        for (const ring of rings) {
          ring.forEach(([longitude, latitude], index) => {
            const x = (longitude + 180) / 360 * mask.width;
            const y = (90 - latitude) / 180 * mask.height;
            if (index) context.lineTo(x, y);
            else context.moveTo(x, y);
          });
          context.closePath();
        }
        context.fill('evenodd');
      }
      for (const feature of geography.features) {
        const geometry = feature.geometry;
        if (geometry.type === 'Polygon') paintPolygon(geometry.coordinates);
        else if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(paintPolygon);
      }
      const pixels = context.getImageData(0, 0, mask.width, mask.height).data;
      const count = 60000;
      for (let index = 0; index < count; index++) {
        const y = 1 - 2 * index / (count - 1);
        const radius = Math.sqrt(1 - y * y);
        const angle = index * 2.399963229728653 % (Math.PI * 2);
        const longitude = angle / (Math.PI * 2) * 360 - 180;
        const latitude = Math.asin(y) * 180 / Math.PI;
        const mapX = Math.min(mask.width - 1, Math.floor((longitude + 180) / 360 * mask.width));
        const mapY = Math.min(mask.height - 1, Math.floor((90 - latitude) / 180 * mask.height));
        if (pixels[(mapY * mask.width + mapX) * 4 + 3] < 128) continue;
        const radians = longitude * Math.PI / 180;
        this.points.push({x: Math.cos(radians) * radius, y, z: Math.sin(radians) * radius, shade: .75 + random(index * 9) * .25, vanishAt: random(index * 11) * .92, driftX: random(index * 13) - .5, driftY: random(index * 17) - .5});
      }
      this.canvas.dataset.landPoints = this.points.length;
    }
    resize() {
      this.size = this.canvas.getBoundingClientRect().width || Math.min(innerWidth * .85, innerHeight * .85, 650);
      this.ratio = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.size * this.ratio);
      this.canvas.height = Math.round(this.size * this.ratio);
      this.ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
    }
    draw(elapsed) {
      const {ctx, size} = this;
      ctx.clearRect(0, 0, size, size);
      const rotationProgress = clamp(elapsed / 1350);
      const turn = -1.05 + 3.4 * (.5 - .5 * Math.cos(Math.PI * rotationProgress)) + elapsed * .00022;
      const dissolution = ease(elapsed / 1600);
      const radius = size * .46 * (1 - .22 * ease(elapsed / 1800));
      const cos = Math.cos(turn), sin = Math.sin(turn);
      ctx.fillStyle = '#30312d';
      let visiblePoints = 0;
      for (const point of this.points) {
        const dissolve = clamp((dissolution - point.vanishAt) / .08);
        if (dissolve >= 1) continue;
        visiblePoints++;
        const x = point.x * cos + point.z * sin + point.driftX * dissolve * .16;
        const z = point.z * cos - point.x * sin;
        const y = point.y * .985 - z * .174 + point.driftY * dissolve * .16;
        const depth = z * .985 + point.y * .174;
        const perspective = 1 + depth * .06;
        const dot = (.8 + (depth + 1) * .4) * (1 - dissolve * .45);
        const opacity = depth > 0 ? .32 + depth * .24 : .055 + (depth + 1) * .055;
        ctx.globalAlpha = (1 - dissolve) * opacity * point.shade;
        ctx.fillRect(size / 2 + x * radius * perspective, size / 2 - y * radius, dot, dot);
      }
      ctx.globalAlpha = 1;
      this.canvas.dataset.visibleLandPoints = visiblePoints;
    }
  }

  class ParticleHelixes {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.epoch = performance.now();
      this.burstAt = -Infinity;
      this.points = [];
      let seed = 0;
      for (let chain = 0; chain < 2; chain++) {
        for (let row = 0; row < 340; row++) {
          const u = -.2 + row / 339 * 1.4;
          const angle = u * Math.PI * 2 * 1.1 + chain * 1.6;
          for (let strand = 0; strand < 2; strand++) {
            const twist = angle + strand * Math.PI;
            for (let ring = 0; ring < 6; ring++) {
              const tube = ring / 6 * Math.PI * 2;
              this.points.push({chain, u, x: Math.cos(twist) + Math.cos(tube) * .014, z: Math.sin(twist) + Math.sin(tube) * .014, y: (random(seed + 8) - .5) * .0017, rx: random(seed) * 2 - 1, ry: random(seed + 1) * 2 - 1, rz: random(seed + 2) * 2 - 1, rung: false});
              seed++;
            }
          }
          if (row % 18 === 0) {
            for (let rung = 1; rung < 18; rung++) {
              const fraction = rung / 18 * 2 - 1;
              this.points.push({chain, u, x: Math.cos(angle) * fraction, z: Math.sin(angle) * fraction, y: 0, rx: random(seed) * 2 - 1, ry: random(seed + 1) * 2 - 1, rz: random(seed + 2) * 2 - 1, rung: true});
              seed++;
            }
          }
        }
      }
      canvas.dataset.particles = this.points.length;
      this.resize();
    }
    resize() {
      this.width = innerWidth;
      this.height = innerHeight;
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      this.canvas.width = Math.round(this.width * ratio);
      this.canvas.height = Math.round(this.height * ratio);
      this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    burst(now) { this.burstAt = now; }
    draw(now) {
      const {ctx, width, height} = this;
      ctx.clearRect(0, 0, width, height);
      // Constant angular velocity, also while the particles scatter/reform.
      const turn = (now - this.epoch) * .0004;
      const cos = Math.cos(turn), sin = Math.sin(turn);
      const burstTime = (now - this.burstAt) / 1000;
      const envelope = burstTime < 0 || burstTime > 1 ? 0 : burstTime < .32 ? ease(burstTime / .32) : 1 - ease((burstTime - .32) / .68);
      const spread = envelope * Math.min(26, width * .025);
      const radius = Math.min(132, width * .095);
      ctx.fillStyle = '#30312d';
      for (const point of this.points) {
        const x = point.x * cos + point.z * sin;
        const z = point.z * cos - point.x * sin;
        const axis = point.chain === 0 ? width * (.15 - point.u * .13) : width * (.9 + point.u * .07);
        const screenX = axis + x * radius + point.rx * spread;
        const screenY = point.u * height + point.y * height + z * radius * .12 + point.ry * spread * .8;
        const depth = z + point.rz * envelope * .2;
        const size = .55 + (depth + 1) * .28;
        ctx.globalAlpha = (point.rung ? .035 + (depth + 1) * .035 : .085 + (depth + 1) * .115) * (1 - envelope * .35);
        ctx.fillRect(screenX, screenY, size, size);
      }
      ctx.globalAlpha = 1;
      this.canvas.dataset.rotationAngle = turn.toFixed(5);
      this.canvas.dataset.motion = envelope === 0 ? 'rotating' : burstTime < .32 ? 'scattering' : 'reforming';
    }
  }

  class CursorSparks {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.sparks = [];
      this.pointer = null;
      this.frame = 0;
      this.lastTime = 0;
      this.nextSpark = 0;
      this.tick = this.tick.bind(this);
    }

    resize() {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(innerWidth * ratio);
      this.canvas.height = Math.round(innerHeight * ratio);
      this.ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    move(x, y) {
      if (!this.ctx) return;
      if (this.pointer) {
        const dx = x - this.pointer.x;
        const dy = y - this.pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= 2) {
          const count = Math.min(12, Math.ceil(distance / 10));
          for (let i = 1; i <= count; i++) {
            this.spawn(this.pointer.x + dx * i / count, this.pointer.y + dy * i / count);
          }
        }
      } else {
        this.spawn(x, y);
        this.nextSpark = performance.now() + 50;
      }
      this.pointer = {x, y};
      if (!this.frame) this.frame = requestAnimationFrame(this.tick);
    }

    spawn(x, y) {
      if (this.sparks.length >= 140) this.sparks.shift();
      this.sparks.push({
        x: x + (Math.random() - .5) * 5,
        y,
        vx: (Math.random() - .5) * 44,
        vy: 28 + Math.random() * 40,
        age: 0,
        life: .42 + Math.random() * .46,
        size: 1.5 + Math.random() * 2.6,
        color: Math.random() < .72 ? '#fffa00' : '#282922'
      });
    }

    tick(now) {
      this.frame = 0;
      const delta = this.lastTime ? Math.min(.05, (now - this.lastTime) / 1000) : 0;
      this.lastTime = now;
      if (this.pointer && now >= this.nextSpark) {
        this.spawn(this.pointer.x, this.pointer.y);
        this.nextSpark = now + 50;
      }
      const ctx = this.ctx;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      this.sparks = this.sparks.filter(spark => spark.age + delta < spark.life);
      for (const spark of this.sparks) {
        spark.age += delta;
        spark.vy += 230 * delta;
        spark.x += spark.vx * delta;
        spark.y += spark.vy * delta;
        ctx.globalAlpha = .68 * (1 - spark.age / spark.life);
        ctx.fillStyle = spark.color;
        ctx.fillRect(spark.x, spark.y, spark.size, spark.size);
      }
      ctx.globalAlpha = 1;
      if (this.pointer || this.sparks.length) this.frame = requestAnimationFrame(this.tick);
      else this.lastTime = 0;
    }

    stop() {
      this.pointer = null;
    }

    clear() {
      this.stop();
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.lastTime = 0;
      this.sparks = [];
      this.ctx?.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  function prepareSplit(root) {
    const host = root.querySelector('#center-split');
    const frozen = root.cloneNode(true);
    const sources = [root, ...root.querySelectorAll('*')];
    const copies = [frozen, ...frozen.querySelectorAll('*')];
    sources.forEach((source, index) => {
      const style = getComputedStyle(source);
      if (style.animationName !== 'none') {
        for (const property of ['transform', 'opacity', 'clip-path']) copies[index].style.setProperty(property, style.getPropertyValue(property));
      }
      copies[index].removeAttribute('id');
    });
    frozen.querySelector('.center-split').remove();
    frozen.classList.add('split-frozen');
    frozen.removeAttribute('role');
    frozen.inert = true;
    Object.assign(frozen.style, {position: 'absolute', width: `${innerWidth}px`, height: `${innerHeight}px`});
    for (const side of ['left', 'right']) {
      const pane = document.createElement('span');
      pane.className = `split-pane split-${side}`;
      pane.append(frozen.cloneNode(true));
      host.append(pane);
    }
  }

  window.HakamoriParticles = {PointGlobe, ParticleHelixes, CursorSparks, prepareSplit};
})();
