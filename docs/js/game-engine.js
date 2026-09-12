/* ==========================================================================
   熱氣球升空挑戰 (Rising Hot Air Balloon) - Core Game Engine
   ========================================================================== */

class GameEngine {
  constructor(renderEngine, soundEngine) {
    this.render = renderEngine;
    this.sound = soundEngine;

    // Game States: 'IDLE', 'RUNNING', 'PAUSED', 'GAMEOVER'
    this.state = 'IDLE';
    this.playerName = '匿名玩家';
    this.mode = 'endless'; // 'endless', 'time_20s', 'time_40s', 'time_60s'
    this.timeLimit = 0;   // in seconds
    this.timeRemaining = 0;

    // Gameplay Vars
    this.altitude = 0;
    this.speed = 0;       // m/s
    this.combo = 0;
    this.maxCombo = 0;
    this.expectedKey = 'F'; // Must alternate 'F' and 'J'
    this.lastKeyPressTime = 0;
    this.maxInterval = 0.8; // seconds allowed between keypresses

    // Callbacks
    this.onStateChange = null;
    this.onHudUpdate = null;

    // Loop Control
    this.lastTime = 0;
    this.animFrameId = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'RUNNING') return;

      const key = e.key.toUpperCase();
      // F / 左方向鍵 → 對應 F 鍵操作
      // J / 右方向鍵 → 對應 J 鍵操作
      if (key === 'F' || key === 'ARROWLEFT') {
        e.preventDefault();
        this.handleKeyPress('F');
      } else if (key === 'J' || key === 'ARROWRIGHT') {
        e.preventDefault();
        this.handleKeyPress('J');
      }
    });
  }

  start(playerName, mode) {
    this.playerName = playerName || '匿名玩家';
    this.mode = mode || 'endless';

    // Set Time Limit based on mode
    if (this.mode === 'time_20s') this.timeLimit = 20;
    else if (this.mode === 'time_40s') this.timeLimit = 40;
    else if (this.mode === 'time_60s') this.timeLimit = 60;
    else this.timeLimit = 0; // Endless

    this.timeRemaining = this.timeLimit;
    this.altitude = 0;
    this.speed = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.expectedKey = 'F';
    this.lastKeyPressTime = performance.now() / 1000;

    this.state = 'RUNNING';
    this.lastTime = performance.now();

    if (this.onStateChange) this.onStateChange(this.state);
    this.loop(performance.now());
  }

  handleKeyPress(key) {
    const currentTime = performance.now() / 1000;
    const interval = currentTime - this.lastKeyPressTime;
    this.lastKeyPressTime = currentTime;

    // Check if correct alternating key and within max interval
    const isCorrectKey = (key === this.expectedKey);
    const isWithinTime = (interval <= this.maxInterval);

    if (isCorrectKey && isWithinTime) {
      // SUCCESS HIT!
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;

      // Calculate Boost based on Combo level
      let boostGain = 1.0; // Base gain
      if (this.combo > 50) boostGain = 7.0;
      else if (this.combo > 30) boostGain = 4.0;
      else if (this.combo > 10) boostGain = 2.0;

      this.altitude += boostGain;
      this.speed = 20 + this.combo * 1.5;

      // Sound & Visuals
      const pitch = Math.min(2.0, 1.0 + this.combo * 0.015);
      this.sound.playHit(pitch);
      this.render.addFlameParticles(3 + Math.floor(this.combo / 10), this.combo);
      this.render.addFloatingText(`+${boostGain}m`, '#00F2FE');

      if (this.combo % 10 === 0) {
        this.sound.playBurnerSound();
        this.render.triggerShake(5 + Math.min(15, this.combo * 0.2));
      }

      // Toggle Expected Key for next press
      this.expectedKey = (this.expectedKey === 'F') ? 'J' : 'F';

      if (this.onHudUpdate) {
        this.onHudUpdate({
          altitude: this.altitude,
          combo: this.combo,
          expectedKey: this.expectedKey,
          feedback: this.combo > 20 ? 'PERFECT!' : 'GREAT!'
        });
      }
    } else {
      // MISTAKE / TIMEOUT FAILURE
      this.sound.playMiss();
      this.render.addFloatingText('MISS!', '#FF5E62');

      if (this.mode === 'endless') {
        // Strict Endless Mode -> GAME OVER immediately on mistake!
        this.gameOver('Combo 中斷！無法突破更高等級！');
      } else {
        // Time Attack Mode -> Reset Combo & Speed, but continue game!
        this.combo = 0;
        this.speed = Math.max(0, this.speed * 0.2);
        this.expectedKey = 'F'; // Reset key prompt

        if (this.onHudUpdate) {
          this.onHudUpdate({
            altitude: this.altitude,
            combo: 0,
            expectedKey: this.expectedKey,
            feedback: 'MISS!'
          });
        }
      }
    }
  }

  loop(timestamp) {
    if (this.state !== 'RUNNING') return;

    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    // Time Attack Timer countdown
    if (this.timeLimit > 0) {
      this.timeRemaining -= dt;
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.gameOver("Time's Up! 時間到！");
        return;
      }
    }

    // Check interval timeout for Endless Mode if user paused keypresses
    const currentTime = timestamp / 1000;
    if (this.combo > 0 && (currentTime - this.lastKeyPressTime) > this.maxInterval) {
      if (this.mode === 'endless') {
        this.sound.playMiss();
        this.gameOver('間隔時間過長！Combo 中斷！');
        return;
      } else {
        // Reset combo in Time Attack
        this.combo = 0;
        this.expectedKey = 'F';
      }
    }

    // Gravity Decay on Speed and Altitude when not clicking fast
    if (this.speed > 0) {
      this.speed -= dt * 15; // Speed decay
      if (this.speed < 0) this.speed = 0;
    } else if (this.altitude > 0 && this.combo === 0) {
      // Balloon slowly falls if idle in Time Attack
      this.altitude -= dt * 2;
      if (this.altitude < 0) this.altitude = 0;
    }

    // Update & Render Frame
    this.render.update(dt, this.altitude, this.speed, this.combo);
    this.render.render();

    if (this.onHudUpdate) {
      this.onHudUpdate({
        altitude: this.altitude,
        combo: this.combo,
        timeRemaining: this.timeRemaining,
        expectedKey: this.expectedKey
      });
    }

    this.animFrameId = requestAnimationFrame((t) => this.loop(t));
  }

  gameOver(reason = '') {
    this.state = 'GAMEOVER';
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    this.sound.playGameOver();

    // Submit score to Leaderboard
    window.leaderboardService.submitScore(
      this.playerName,
      this.altitude,
      this.maxCombo,
      this.mode
    );

    if (this.onStateChange) {
      this.onStateChange(this.state, {
        altitude: Math.round(this.altitude),
        maxCombo: this.maxCombo,
        mode: this.mode,
        playerName: this.playerName,
        reason: reason
      });
    }
  }
}

window.GameEngine = GameEngine;
