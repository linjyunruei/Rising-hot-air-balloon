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
    const records = this.getRawLocalScores();
    entry.id = 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    records.push(entry);
    localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
  }

  // Get LocalStorage scores (raw real player records, no fake data)
  getRawLocalScores() {
    try {
      const data = localStorage.getItem('balloon_leaderboard');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  // Get LocalStorage scores
  getLocalScores() {
    return this.getRawLocalScores();
  }

  // Query scores filtered by mode & sorted by score descending (NEVER return fake data)
  async fetchLeaderboard(modeFilter = 'endless', limitCount = 30) {
    const firestoreResults = [];

    if (this.isFirebaseReady && this.db) {
      try {
        // Simple collection fetch to avoid composite index requirements
        const snapshot = await this.db.collection('leaderboard').get();
        snapshot.forEach(doc => {
          firestoreResults.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn("Firestore query failed, using local records:", err);
      }
    }

    const localResults = this.getRawLocalScores();

    // Merge firestore and local results avoiding duplicates
    const resultMap = new Map();
    firestoreResults.forEach(item => {
      if (item.id) resultMap.set(item.id, item);
    });
    localResults.forEach(item => {
      if (item.id && !resultMap.has(item.id)) {
        resultMap.set(item.id, item);
      }
    });

    const merged = Array.from(resultMap.values());

    // Filter by mode and sort by score descending
    const filtered = merged
      .filter(item => item.mode === modeFilter)
      .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));

    return filtered.slice(0, limitCount);
  }

  // Fetch all records for Admin Panel
  async fetchAllRecords() {
    const firestoreResults = [];

    if (this.isFirebaseReady && this.db) {
      try {
        const snapshot = await this.db.collection('leaderboard').get();
        snapshot.forEach(doc => {
          firestoreResults.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn("Firestore fetchAllRecords failed, using local records:", err);
      }
    }

    const localResults = this.getRawLocalScores();
    const resultMap = new Map();
    firestoreResults.forEach(item => {
      if (item.id) resultMap.set(item.id, item);
    });
    localResults.forEach(item => {
      if (item.id && !resultMap.has(item.id)) {
        resultMap.set(item.id, item);
      }
    });

    const merged = Array.from(resultMap.values());
    return merged.sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
  }

  // Update specific record – full fields (Admin privilege)
  async updateRecord(id, updatedFields) {
    const { score, playerName, maxCombo, mode } = updatedFields;
    const updateData = {};
    if (score !== undefined) updateData.score = Number(score);
    if (playerName !== undefined) updateData.playerName = playerName;
    if (maxCombo !== undefined) updateData.maxCombo = Number(maxCombo);
    if (mode !== undefined) updateData.mode = mode;

    if (this.isFirebaseReady && this.db && !id.startsWith('local_')) {
      try {
        await this.db.collection('leaderboard').doc(id).update(updateData);
        return true;
      } catch (err) {
        console.error("Failed to update Firestore record:", err);
      }
    }

    // Local Storage update
    const records = this.getRawLocalScores();
    const target = records.find(item => item.id === id);
    if (target) {
      Object.assign(target, updateData);
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
        // Also remove from local if exists
        let records = this.getRawLocalScores();
        records = records.filter(item => item.id !== id);
        localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
        return true;
      } catch (err) {
        console.error("Failed to delete Firestore record:", err);
        return false;
      }
    }

    // Local Storage delete
    let records = this.getRawLocalScores();
    records = records.filter(item => item.id !== id);
    localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
    return true;
  }

  // Delete all records for a specific game mode (Admin privilege)
  async deleteByMode(mode) {
    if (this.isFirebaseReady && this.db) {
      try {
        const snapshot = await this.db.collection('leaderboard').where('mode', '==', mode).get();
        const batch = this.db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.error("Failed to delete Firestore records by mode:", err);
      }
    }

    // Always clean local too
    let records = this.getRawLocalScores();
    records = records.filter(item => item.mode !== mode);
    localStorage.setItem('balloon_leaderboard', JSON.stringify(records));
    return true;
  }

  // Delete ALL records (Admin privilege)
  async deleteAllRecords() {
    if (this.isFirebaseReady && this.db) {
      try {
        const snapshot = await this.db.collection('leaderboard').get();
        const batch = this.db.batch();
        snapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      } catch (err) {
        console.error("Failed to delete all Firestore records:", err);
      }
    }

    // Clear local storage
    localStorage.removeItem('balloon_leaderboard');
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
