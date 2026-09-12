/* ==========================================================================
   熱氣球升空挑戰 (Rising Hot Air Balloon) - UI & Screen Manager
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const sound = window.soundEngine;
  const render = new window.RenderEngine(canvas);
  const game = new window.GameEngine(render, sound);

  // Screens
  const startScreen = document.getElementById('startScreen');
  const gameHud = document.getElementById('gameHud');
  const gameOverScreen = document.getElementById('gameOverScreen');
  const leaderboardScreen = document.getElementById('leaderboardScreen');

  // Start Screen Elements
  const nicknameInput = document.getElementById('nicknameInput');
  const modeCards = document.querySelectorAll('.mode-card');
  const timeBtns = document.querySelectorAll('.time-btn');
  const btnStartGame = document.getElementById('btnStartGame');
  const btnViewLeaderboard = document.getElementById('btnViewLeaderboard');

  // HUD Elements
  const hudModePill = document.getElementById('hudModePill');
  const altitudeVal = document.getElementById('altitudeVal');
  const hudTimerBox = document.getElementById('hudTimerBox');
  const timerVal = document.getElementById('timerVal');
  const comboVal = document.getElementById('comboVal');
  const comboContainer = document.querySelector('.combo-container');
  const feedbackText = document.getElementById('feedbackText');
  const keyBtnF = document.getElementById('keyBtnF');
  const keyBtnJ = document.getElementById('keyBtnJ');

  // Game Over Elements
  const resultReason = document.getElementById('resultReason');
  const resultAltitude = document.getElementById('resultAltitude');
  const resultCombo = document.getElementById('resultCombo');
  const resultMode = document.getElementById('resultMode');
  const btnPlayAgain = document.getElementById('btnPlayAgain');
  const btnBackHome = document.getElementById('btnBackHome');

  // Leaderboard Elements
  const lbTabs = document.querySelectorAll('#leaderboardScreen .tab-btn');
  const leaderboardList = document.getElementById('leaderboardList');
  const btnLbBack = document.getElementById('btnLbBack');

  // Selected State
  let selectedMode = 'endless';

  // Load saved nickname if exists
  const savedName = localStorage.getItem('balloon_nickname');
  if (savedName) nicknameInput.value = savedName;

  // ------------------------------------------------------------------------
  // Mode Selection Interaction
  // ------------------------------------------------------------------------
  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      const modeType = card.dataset.mode;
      if (modeType === 'endless') {
        selectedMode = 'endless';
      } else if (modeType === 'time') {
        const activeTimeBtn = card.querySelector('.time-btn.active');
        selectedMode = activeTimeBtn ? activeTimeBtn.dataset.timeMode : 'time_20s';
      }
    });
  });

  timeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      timeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const timeCard = btn.closest('.mode-card');
      modeCards.forEach(c => c.classList.remove('selected'));
      timeCard.classList.add('selected');

      selectedMode = btn.dataset.timeMode;
    });
  });

  // ------------------------------------------------------------------------
  // On-Screen Key Buttons (Touch / Mouse input)
  // ------------------------------------------------------------------------
  [keyBtnF, keyBtnJ].forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (game.state !== 'RUNNING') return;
      btn.classList.add('pressed');
      const key = btn.dataset.key;
      game.handleKeyPress(key);
    });

    btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
    btn.addEventListener('pointerleave', () => btn.classList.remove('pressed'));
  });

  // ------------------------------------------------------------------------
  // Game Start & Restart
  // ------------------------------------------------------------------------
  btnStartGame.addEventListener('click', () => {
    const name = nicknameInput.value.trim() || '匿名玩家';
    localStorage.setItem('balloon_nickname', name);

    // Screen transition
    startScreen.classList.remove('active');
    gameHud.classList.add('active');

    // Configure HUD Mode Indicator
    const modeNames = {
      'endless': '無盡模式 (Strict)',
      'time_20s': '20s 限時模式',
      'time_40s': '40s 限時模式',
      'time_60s': '60s 限時模式'
    };
    hudModePill.textContent = modeNames[selectedMode] || '升空挑戰';

    if (selectedMode === 'endless') {
      hudTimerBox.style.display = 'none';
    } else {
      hudTimerBox.style.display = 'block';
    }

    game.start(name, selectedMode);
  });

  btnPlayAgain.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    gameHud.classList.add('active');
    game.start(nicknameInput.value.trim() || '匿名玩家', selectedMode);
  });

  btnBackHome.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
  });

  // ------------------------------------------------------------------------
  // HUD Update Handler
  // ------------------------------------------------------------------------
  game.onHudUpdate = (data) => {
    altitudeVal.textContent = Math.round(data.altitude);

    if (data.combo !== undefined) {
      comboVal.textContent = data.combo;
      comboContainer.classList.add('bump');
      setTimeout(() => comboContainer.classList.remove('bump'), 100);
    }

    if (data.timeRemaining !== undefined && selectedMode !== 'endless') {
      timerVal.textContent = Math.ceil(data.timeRemaining) + 's';
    }

    if (data.expectedKey) {
      if (data.expectedKey === 'F') {
        keyBtnF.classList.add('active-prompt');
        keyBtnJ.classList.remove('active-prompt');
      } else {
        keyBtnJ.classList.add('active-prompt');
        keyBtnF.classList.remove('active-prompt');
      }
    }

    if (data.feedback) {
      feedbackText.textContent = data.feedback;
      feedbackText.className = 'feedback-text show ' + (data.feedback === 'PERFECT!' ? 'feedback-perfect' : (data.feedback === 'GREAT!' ? 'feedback-great' : 'feedback-miss'));
      setTimeout(() => feedbackText.classList.remove('show'), 350);
    }
  };

  // ------------------------------------------------------------------------
  // Game Over Screen Handler
  // ------------------------------------------------------------------------
  game.onStateChange = (state, data) => {
    if (state === 'GAMEOVER') {
      gameHud.classList.remove('active');
      gameOverScreen.classList.add('active');

      resultReason.textContent = data.reason || '遊戲結束！';
      resultAltitude.textContent = data.altitude + ' m';
      resultCombo.textContent = data.maxCombo;

      const modeLabels = {
        'endless': '無盡模式',
        'time_20s': '20秒限時',
        'time_40s': '40秒限時',
        'time_60s': '60秒限時'
      };
      resultMode.textContent = modeLabels[data.mode] || data.mode;
    }
  };

  // ------------------------------------------------------------------------
  // Leaderboard Tab & View Handler
  // ------------------------------------------------------------------------
  async function renderLeaderboard(filterMode = 'endless') {
    leaderboardList.innerHTML = '<div class="empty-state">載入排行榜中...</div>';
    const list = await window.leaderboardService.fetchLeaderboard(filterMode);

    if (!list || list.length === 0) {
      leaderboardList.innerHTML = '<div class="empty-state">目前尚無此模式的遊玩紀錄</div>';
      return;
    }

    leaderboardList.innerHTML = list.map((item, idx) => {
      const rankClass = idx === 0 ? 'top-1' : (idx === 1 ? 'top-2' : (idx === 2 ? 'top-3' : ''));
      const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '';

      return `
        <div class="lb-item">
          <div class="lb-rank ${rankClass}">#${idx + 1}</div>
          <div class="lb-user-info">
            <div class="lb-name">${escapeHtml(item.playerName)}</div>
            <div class="lb-meta">${dateStr}</div>
          </div>
          <div class="lb-score-box">
            <div class="lb-score">${item.score} m</div>
            <div class="lb-combo">Max Combo: ${item.maxCombo}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  btnViewLeaderboard.addEventListener('click', () => {
    startScreen.classList.remove('active');
    leaderboardScreen.classList.add('active');
    renderLeaderboard('endless');
  });

  btnLbBack.addEventListener('click', () => {
    leaderboardScreen.classList.remove('active');
    startScreen.classList.add('active');
  });

  lbTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      lbTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderLeaderboard(tab.dataset.tabMode);
    });
  });

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
