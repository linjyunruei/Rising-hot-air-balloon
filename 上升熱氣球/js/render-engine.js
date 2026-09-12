/* ==========================================================================
   熱氣球升空挑戰 (Rising Hot Air Balloon) - Visual & Canvas Render Engine
   ========================================================================== */

class RenderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    // Camera & Background State
    this.altitude = 0;
    this.speed = 0;
    this.shakeAmount = 0;

    // Objects
    this.clouds = [];
    this.stars = [];
    this.particles = [];
    this.floatingTexts = [];

    // Balloon Animation State
    this.balloonY = 0;
    this.balloonWobble = 0;
    this.flameIntensity = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initBackgroundElements();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    this.balloonY = this.height * 0.65;
  }

  initBackgroundElements() {
    // Generate Clouds
    this.clouds = [];
    for (let i = 0; i < 16; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height * 2 - this.height,
        size: Math.random() * 60 + 40,
        speed: Math.random() * 0.4 + 0.2,
        opacity: Math.random() * 0.5 + 0.3
      });
    }

    // Generate Stars for High Altitude
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        twinkleSpeed: Math.random() * 0.03 + 0.01
      });
    }
  }

  // Add Flame / Burst Particle
  addFlameParticles(count = 5, combo = 1) {
    this.flameIntensity = Math.min(1, 0.4 + combo * 0.02);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.width / 2 + (Math.random() * 20 - 10),
        y: this.balloonY + 30,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 4 + 3,
        size: Math.random() * 10 + 5,
        color: Math.random() > 0.3 ? '#FF5E62' : '#FFD200',
        alpha: 1,
        decay: Math.random() * 0.04 + 0.03
      });
    }
  }

  // Add floating text popup (+10m, PERFECT!)
  addFloatingText(text, color = '#00F2FE') {
    this.floatingTexts.push({
      text,
      color,
      x: this.width / 2 + (Math.random() * 60 - 30),
      y: this.balloonY - 70,
      vy: -2,
      alpha: 1
    });
  }

  triggerShake(amount = 8) {
    this.shakeAmount = amount;
  }

  // Compute dynamic sky gradient based on current altitude
  getSkyGradient(alt) {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);

    if (alt < 1500) {
      // Daytime Blue Sky
      const factor = alt / 1500;
      grad.addColorStop(0, '#3A7BD5');
      grad.addColorStop(1, '#3a6073');
    } else if (alt < 5000) {
      // Sunset Golden / Orange Sky
      grad.addColorStop(0, '#FF5E62');
      grad.addColorStop(0.5, '#FF9966');
      grad.addColorStop(1, '#4B1248');
    } else if (alt < 12000) {
      // Twilight Purple
      grad.addColorStop(0, '#283E51');
      grad.addColorStop(0.6, '#4B1248');
      grad.addColorStop(1, '#0F2027');
    } else if (alt < 30000) {
      // Stratosphere Deep Space Navy
      grad.addColorStop(0, '#02010A');
      grad.addColorStop(0.7, '#0F2027');
      grad.addColorStop(1, '#203A43');
    } else {
      // Outer Space
      grad.addColorStop(0, '#000000');
      grad.addColorStop(0.8, '#050515');
      grad.addColorStop(1, '#110022');
    }

    return grad;
  }

  update(dt, currentAltitude, currentSpeed, combo) {
    this.altitude = currentAltitude;
    this.speed = currentSpeed;

    // Camera Shake Decay
    if (this.shakeAmount > 0) {
      this.shakeAmount *= 0.9;
      if (this.shakeAmount < 0.2) this.shakeAmount = 0;
    }

    // Wobble Animation
    this.balloonWobble += dt * 3;

    // Update Clouds (Scroll Down when ascending)
    const cloudSpeedMult = 1 + Math.min(this.speed * 0.05, 5);
    this.clouds.forEach(cloud => {
      cloud.y += cloud.speed * cloudSpeedMult;
      if (cloud.y > this.height + 100) {
        cloud.y = -100;
        cloud.x = Math.random() * this.width;
      }
    });

    // Update Flame Intensity Decay
    if (this.flameIntensity > 0) {
      this.flameIntensity -= dt * 1.5;
      if (this.flameIntensity < 0) this.flameIntensity = 0;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;
      p.size *= 0.96;

      if (p.alpha <= 0 || p.size < 0.5) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.alpha -= 0.02;

      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Twinkle Stars
    if (this.altitude > 4000) {
      this.stars.forEach(star => {
        star.alpha += star.twinkleSpeed;
        if (star.alpha > 1 || star.alpha < 0.2) {
          star.twinkleSpeed = -star.twinkleSpeed;
        }
      });
    }
  }

  render() {
    this.ctx.save();

    // Apply Camera Shake
    if (this.shakeAmount > 0) {
      const rx = (Math.random() - 0.5) * this.shakeAmount;
      const ry = (Math.random() - 0.5) * this.shakeAmount;
      this.ctx.translate(rx, ry);
    }

    // 1. Render Sky Background
    this.ctx.fillStyle = this.getSkyGradient(this.altitude);
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. Render Stars (visible at high altitude)
    if (this.altitude > 4000) {
      const starVisibility = Math.min(1, (this.altitude - 4000) / 6000);
      this.ctx.save();
      this.stars.forEach(star => {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * starVisibility})`;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        this.ctx.fill();
      });
      this.ctx.restore();
    }

    // 3. Render Clouds
    const cloudAlphaMult = Math.max(0.1, 1 - this.altitude / 35000);
    this.clouds.forEach(cloud => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity * cloudAlphaMult})`;
      this.ctx.beginPath();
      this.ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      this.ctx.arc(cloud.x + cloud.size * 0.5, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
      this.ctx.arc(cloud.x - cloud.size * 0.5, cloud.y - cloud.size * 0.1, cloud.size * 0.6, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 4. Render Particles (Burner Flames)
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.globalAlpha = 1;

    // 5. Render Hot Air Balloon
    this.renderBalloon();

    // 6. Render Floating Popups
    this.ctx.font = 'bold 24px Outfit, sans-serif';
    this.ctx.textAlign = 'center';
    this.floatingTexts.forEach(ft => {
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.fillText(ft.text, ft.x, ft.y);
    });
    this.ctx.globalAlpha = 1;

    this.ctx.restore();
  }

  renderBalloon() {
    const cx = this.width / 2;
    const cy = this.balloonY + Math.sin(this.balloonWobble) * 6;
    const scale = 1.1;

    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.scale(scale, scale);

    // Burner Flame Burst (under canopy)
    if (this.flameIntensity > 0) {
      this.ctx.fillStyle = `rgba(255, 120, 0, ${this.flameIntensity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(-15, 20);
      this.ctx.lineTo(0, 45 + Math.random() * 15 * this.flameIntensity);
      this.ctx.lineTo(15, 20);
      this.ctx.closePath();
      this.ctx.fill();

      // Inner Core Flame
      this.ctx.fillStyle = `rgba(255, 255, 200, ${this.flameIntensity})`;
      this.ctx.beginPath();
      this.ctx.moveTo(-8, 20);
      this.ctx.lineTo(0, 32 + Math.random() * 10 * this.flameIntensity);
      this.ctx.lineTo(8, 20);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // Balloon Canopy (Striated Colorful Sphere)
    const r = 55;

    // Canopy Shadow / Glow
    this.ctx.shadowColor = 'rgba(255, 94, 98, 0.4)';
    this.ctx.shadowBlur = 20;

    // Main Body
    this.ctx.beginPath();
    this.ctx.arc(0, -40, r, 0, Math.PI * 2);
    const grad = this.ctx.createLinearGradient(-r, -40 - r, r, -40 + r);
    grad.addColorStop(0, '#FFD200');
    grad.addColorStop(0.3, '#FF9966');
    grad.addColorStop(0.7, '#FF5E62');
    grad.addColorStop(1, '#990033');
    this.ctx.fillStyle = grad;
    this.ctx.fill();

    this.ctx.shadowBlur = 0; // reset shadow

    // Stripe Overlays
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.lineWidth = 3;

    // Vertical Curved Stripes
    this.ctx.beginPath();
    this.ctx.ellipse(0, -40, r * 0.4, r, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.ellipse(0, -40, r * 0.8, r, 0, 0, Math.PI * 2);
    this.ctx.stroke();

    // Ropes linking canopy to basket
    this.ctx.strokeStyle = '#CBD5E1';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(-25, 5);
    this.ctx.lineTo(-12, 35);
    this.ctx.moveTo(25, 5);
    this.ctx.lineTo(12, 35);
    this.ctx.moveTo(-10, 10);
    this.ctx.lineTo(-6, 35);
    this.ctx.moveTo(10, 10);
    this.ctx.lineTo(6, 35);
    this.ctx.stroke();

    // Burner Unit
    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(-12, 18, 24, 6);

    // Basket
    const basketGrad = this.ctx.createLinearGradient(-16, 35, 16, 55);
    basketGrad.addColorStop(0, '#8B4513');
    basketGrad.addColorStop(1, '#5C2E0B');
    this.ctx.fillStyle = basketGrad;
    this.ctx.beginPath();
    this.ctx.roundRect(-16, 35, 32, 22, 5);
    this.ctx.fill();

    // Basket Weave Lines
    this.ctx.strokeStyle = '#D2691E';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(-16, 42);
    this.ctx.lineTo(16, 42);
    this.ctx.moveTo(-16, 49);
    this.ctx.lineTo(16, 49);
    this.ctx.stroke();

    this.ctx.restore();
  }
}

window.RenderEngine = RenderEngine;
