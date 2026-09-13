/* ==========================================================================
   熱氣球升空挑戰 (Rising Hot Air Balloon) - Admin Panel Service
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const btnOpenAdmin = document.getElementById('btnOpenAdmin');
  const adminModal = document.getElementById('adminModal');
  const btnCloseAdmin = document.getElementById('btnCloseAdmin');

  const adminAuthSection = document.getElementById('adminAuthSection');
  const adminPanelSection = document.getElementById('adminPanelSection');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminAccountInput = document.getElementById('adminAccountInput');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminAuthError = document.getElementById('adminAuthError');

  const adminModeFilter = document.getElementById('adminModeFilter');
  const adminTableBody = document.getElementById('adminTableBody');

  // Bulk action buttons
  const btnDeleteByMode = document.getElementById('btnDeleteByMode');
  const btnDeleteAll = document.getElementById('btnDeleteAll');

  // Edit Modal
  const editModal = document.getElementById('editRecordModal');
  const editForm = document.getElementById('editRecordForm');
  const btnCancelEdit = document.getElementById('btnCancelEdit');

  let currentRecords = [];
  let editingId = null;

  // Open Admin Modal
  btnOpenAdmin.addEventListener('click', () => {
    adminModal.classList.add('active');
  });

  // Close Admin Modal
  btnCloseAdmin.addEventListener('click', () => {
    adminModal.classList.remove('active');
  });

  // Admin Login Handler
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    adminAuthError.style.display = 'none';

    const account = adminAccountInput.value.trim();
    const password = adminPasswordInput.value.trim();

    try {
      await window.leaderboardService.adminLogin(account, password);
      adminAuthSection.style.display = 'none';
      adminPanelSection.style.display = 'block';
      loadAdminRecords();
    } catch (err) {
      adminAuthError.textContent = err.message || '帳號或密碼錯誤 (預設帳號: linjyunruei / meps786039)';
      adminAuthError.style.display = 'block';
    }
  });

  // Load Records into Admin Table
  async function loadAdminRecords() {
    adminTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">載入中...</td></tr>';
    currentRecords = await window.leaderboardService.fetchAllRecords();
    renderAdminTable();
  }

  // Render Table based on filter
  function renderAdminTable() {
    const filter = adminModeFilter.value;
    const filtered = filter === 'all' ? currentRecords : currentRecords.filter(r => r.mode === filter);

    // Update delete-by-mode button label
    const modeLabels = { endless: '無盡模式', time_20s: '20秒模式', time_40s: '40秒模式', time_60s: '60秒模式' };
    if (filter !== 'all') {
      btnDeleteByMode.textContent = `🗑️ 刪除全部「${modeLabels[filter] || filter}」資料`;
      btnDeleteByMode.style.display = 'inline-block';
    } else {
      btnDeleteByMode.style.display = 'none';
    }

    if (filtered.length === 0) {
      adminTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748B;">無數據紀錄</td></tr>';
      return;
    }

    adminTableBody.innerHTML = filtered.map(item => `
      <tr>
        <td>${escapeHtml(item.playerName)}</td>
        <td><strong>${item.score} m</strong></td>
        <td>${item.maxCombo}</td>
        <td><span class="mode-badge">${item.mode}</span></td>
        <td>${item.timestamp ? new Date(item.timestamp).toLocaleString('zh-TW') : '-'}</td>
        <td>${item.id || '-'}</td>
        <td>
          <button class="action-btn btn-edit" data-id="${item.id}">✏️ 編輯</button>
          <button class="action-btn btn-delete" data-id="${item.id}">🗑️ 刪除</button>
        </td>
      </tr>
    `).join('');

    // Attach Action Listeners
    adminTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    adminTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
  }

  adminModeFilter.addEventListener('change', renderAdminTable);

  // -------------------------------------------------------------------------
  // Edit Modal – open with pre-filled data
  // -------------------------------------------------------------------------
  function openEditModal(id) {
    const record = currentRecords.find(r => r.id === id);
    if (!record) return;

    editingId = id;

    document.getElementById('editPlayerName').value = record.playerName || '';
    document.getElementById('editScore').value = record.score || 0;
    document.getElementById('editMaxCombo').value = record.maxCombo || 0;
    document.getElementById('editMode').value = record.mode || 'endless';
    document.getElementById('editTimestamp').value = record.timestamp
      ? record.timestamp.substring(0, 16)   // datetime-local format: YYYY-MM-DDTHH:MM
      : new Date().toISOString().substring(0, 16);

    editModal.classList.add('active');
  }

  btnCancelEdit.addEventListener('click', () => {
    editModal.classList.remove('active');
    editingId = null;
  });

  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!editingId) return;

    const updatedFields = {
      playerName: document.getElementById('editPlayerName').value.trim() || '匿名玩家',
      score: parseInt(document.getElementById('editScore').value, 10) || 0,
      maxCombo: parseInt(document.getElementById('editMaxCombo').value, 10) || 0,
      mode: document.getElementById('editMode').value,
      timestamp: new Date(document.getElementById('editTimestamp').value).toISOString()
    };

    const success = await window.leaderboardService.updateRecord(editingId, updatedFields);
    if (success) {
      editModal.classList.remove('active');
      editingId = null;
      showToast('✅ 修改成功！');
      loadAdminRecords();
    } else {
      showToast('❌ 修改失敗，請檢查權限或連線', true);
    }
  });

  // -------------------------------------------------------------------------
  // Delete single record
  // -------------------------------------------------------------------------
  async function handleDelete(id) {
    const record = currentRecords.find(r => r.id === id);
    if (!record) return;

    if (confirm(`確定要刪除玩家「${record.playerName}」的這筆紀錄 (${record.score} m / ${record.mode}) 嗎？`)) {
      const success = await window.leaderboardService.deleteRecord(id);
      if (success) {
        showToast('✅ 刪除成功！');
        loadAdminRecords();
      } else {
        showToast('❌ 刪除失敗', true);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Delete all records for current selected mode
  // -------------------------------------------------------------------------
  btnDeleteByMode.addEventListener('click', async () => {
    const filter = adminModeFilter.value;
    if (filter === 'all') return;
    const modeLabels = { endless: '無盡模式', time_20s: '20秒模式', time_40s: '40秒模式', time_60s: '60秒模式' };
    const label = modeLabels[filter] || filter;
    const count = currentRecords.filter(r => r.mode === filter).length;

    if (confirm(`確定要刪除全部「${label}」的 ${count} 筆紀錄嗎？此操作無法復原！`)) {
      const success = await window.leaderboardService.deleteByMode(filter);
      if (success) {
        showToast(`✅ 已刪除全部「${label}」資料！`);
        loadAdminRecords();
      } else {
        showToast('❌ 刪除失敗', true);
      }
    }
  });

  // -------------------------------------------------------------------------
  // Delete ALL records (one-click full wipe)
  // -------------------------------------------------------------------------
  btnDeleteAll.addEventListener('click', async () => {
    const total = currentRecords.length;
    if (!confirm(`⚠️ 警告！確定要刪除全部 ${total} 筆遊戲紀錄嗎？\n\n此操作將清空排行榜，無法復原！`)) return;
    if (!confirm('🚨 最後確認：真的要清空所有資料？')) return;

    const success = await window.leaderboardService.deleteAllRecords();
    if (success) {
      showToast('✅ 已清空所有遊戲紀錄！');
      loadAdminRecords();
    } else {
      showToast('❌ 刪除失敗', true);
    }
  });

  // -------------------------------------------------------------------------
  // Toast Notification
  // -------------------------------------------------------------------------
  function showToast(msg, isError = false) {
    let toast = document.getElementById('adminToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'adminToast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'admin-toast' + (isError ? ' admin-toast-error' : '');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
