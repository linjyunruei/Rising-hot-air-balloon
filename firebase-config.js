/* ==========================================================================
   熱氣球升空挑戰 (Rising Hot Air Balloon) - Firebase & Leaderboard Service
   ========================================================================== */

// Firebase standard configuration from specification
const firebaseConfig = {
  apiKey: "AIzaSyBuayHyl-s9ZQU_Oxdsxn-B3X75RR3irng",
  authDomain: "rising-hot-air-balloon-283a6.firebaseapp.com",
  projectId: "rising-hot-air-balloon-283a6",
  storageBucket: "rising-hot-air-balloon-283a6.firebasestorage.app",
  messagingSenderId: "99052375911",
  appId: "1:99052375911:web:397cc87549912a1f74e9c2"
};

class LeaderboardService {
  constructor() {
    this.db = null;
    this.auth = null;
    this.isFirebaseReady = false;
    this.initFirebase();
  }

  async initFirebase() {
    try {
      if (window.firebase) {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.firestore();
        this.auth = firebase.auth();
        this.isFirebaseReady = true;
        console.log("Firebase initialized successfully.");
      } else {
        console.warn("Firebase SDK not detected. Using LocalStorage fallback mode.");
      }
    } catch (err) {
      console.warn("Firebase initialization failed, falling back to LocalStorage:", err);
      this.isFirebaseReady = false;
    }
  }

  // Upload score entry to Firestore / LocalStorage
  async submitScore(playerName, score, maxCombo, mode) {
    const entry = {
      playerName: playerName || '匿名玩家',
      score: Math.round(score),
      maxCombo: Math.max(0, maxCombo),
      mode: mode || 'endless',
      timestamp: new Date().toISOString()
    };

    if (this.isFirebaseReady && this.db) {
      try {
        await this.db.collection('leaderboard').add(entry);
        console.log("Score submitted to Firestore successfully.");
      } catch (err) {
        console.error("Error submitting to Firestore, saving locally:", err);
        this.saveLocalScore(entry);
      }
    } else {
      this.saveLocalScore(entry);
    }

    return entry;
  }

  // Fallback LocalStorage score saver
  saveLocalScore(entry) {
    const records = this.getLocalScores();
    entry.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    records.push(entry);
    localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
  }

  // Get LocalStorage scores
  getLocalScores() {
    try {
      const data = localStorage.getItem('balloon_leaderboard');
      return data ? JSON.parse(data) : this.getDefaultDemoScores();
    } catch (e) {
      return this.getDefaultDemoScores();
    }
  }

  getDefaultDemoScores() {
    return [
      { id: '1', playerName: '氣球大師', score: 8520, maxCombo: 142, mode: 'endless', timestamp: new Date().toISOString() },
      { id: '2', playerName: '極速手速王', score: 6200, maxCombo: 98, mode: 'time_60s', timestamp: new Date().toISOString() },
      { id: '3', playerName: '雲端飛行員', score: 4800, maxCombo: 85, mode: 'time_40s', timestamp: new Date().toISOString() },
      { id: '4', playerName: '熱氣球新手', score: 2150, maxCombo: 45, mode: 'time_20s', timestamp: new Date().toISOString() },
      { id: '5', playerName: '狂熱連爆手', score: 9400, maxCombo: 160, mode: 'endless', timestamp: new Date().toISOString() }
    ];
  }

  // Query scores filtered by mode & sorted by score descending
  async fetchLeaderboard(modeFilter = 'endless', limitCount = 30) {
    if (this.isFirebaseReady && this.db) {
      try {
        const snapshot = await this.db.collection('leaderboard')
          .where('mode', '==', modeFilter)
          .orderBy('score', 'desc')
          .limit(limitCount)
          .get();

        const results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });

        // If firestore returns empty, mix in fallback for demonstration
        if (results.length === 0) {
          return this.getLocalScores().filter(item => item.mode === modeFilter).sort((a, b) => b.score - a.score);
        }
        return results;
      } catch (err) {
        console.warn("Firestore query failed (possibly missing index), using local filtering:", err);
        return this.getLocalScores().filter(item => item.mode === modeFilter).sort((a, b) => b.score - a.score);
      }
    } else {
      return this.getLocalScores().filter(item => item.mode === modeFilter).sort((a, b) => b.score - a.score);
    }
  }

  // Fetch all records for Admin Panel
  async fetchAllRecords() {
    if (this.isFirebaseReady && this.db) {
      try {
        const snapshot = await this.db.collection('leaderboard').get();
        const results = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() });
        });
        return results.sort((a, b) => b.score - a.score);
      } catch (err) {
        return this.getLocalScores().sort((a, b) => b.score - a.score);
      }
    } else {
      return this.getLocalScores().sort((a, b) => b.score - a.score);
    }
  }

  // Update specific record (Admin privilege)
  async updateRecord(id, newScore, newPlayerName) {
    if (this.isFirebaseReady && this.db && !id.startsWith('local_')) {
      try {
        await this.db.collection('leaderboard').doc(id).update({
          score: Number(newScore),
          playerName: newPlayerName
        });
        return true;
      } catch (err) {
        console.error("Failed to update Firestore record:", err);
      }
    }

    // Local Storage update
    const records = this.getLocalScores();
    const target = records.find(item => item.id === id);
    if (target) {
      target.score = Number(newScore);
      target.playerName = newPlayerName;
      localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
      return true;
    }
    return false;
  }

  // Delete record (Admin privilege)
  async deleteRecord(id) {
    if (this.isFirebaseReady && this.db && !id.startsWith('local_')) {
      try {
        await this.db.collection('leaderboard').doc(id).delete();
        return true;
      } catch (err) {
        console.error("Failed to delete Firestore record:", err);
      }
    }

    // Local Storage delete
    let records = this.getLocalScores();
    records = records.filter(item => item.id !== id);
    localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
    return true;
  }

  // Admin Firebase Authentication Login
  async adminLogin(usernameOrEmail, password) {
    const email = usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@admin.com`;
    
    // Check preset specification credentials: linjyunruei / meps786039
    const isPresetAdmin = (usernameOrEmail === 'linjyunruei' || email === 'linjyunruei@admin.com') && password === 'meps786039';

    if (this.isFirebaseReady && this.auth) {
      try {
        const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
      } catch (err) {
        if (isPresetAdmin) {
          return { success: true, user: { email: 'linjyunruei@admin.com', uid: 'admin_preset' } };
        }
        throw new Error(err.message);
      }
    } else {
      if (isPresetAdmin) {
        return { success: true, user: { email: 'linjyunruei@admin.com', uid: 'admin_preset' } };
      }
      throw new Error("管理者帳號或密碼錯誤");
    }
  }
}

window.leaderboardService = new LeaderboardService();
