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

  let currentRecords = [];

  // Open Modal
  btnOpenAdmin.addEventListener('click', () => {
    adminModal.classList.add('active');
  });

  // Close Modal
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
    adminTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">載入中...</td></tr>';
    currentRecords = await window.leaderboardService.fetchAllRecords();
    renderAdminTable();
  }

  // Render Table based on filter
  function renderAdminTable() {
    const filter = adminModeFilter.value;
    const filtered = filter === 'all' ? currentRecords : currentRecords.filter(r => r.mode === filter);

    if (filtered.length === 0) {
      adminTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#64748B;">無數據紀錄</td></tr>';
      return;
    }

    adminTableBody.innerHTML = filtered.map(item => `
      <tr>
        <td>${escapeHtml(item.playerName)}</td>
        <td><strong>${item.score} m</strong></td>
        <td>${item.maxCombo}</td>
        <td><span class="mode-badge">${item.mode}</span></td>
        <td>${item.timestamp ? new Date(item.timestamp).toLocaleString() : '-'}</td>
        <td>
          <button class="action-btn btn-edit" data-id="${item.id}">編輯</button>
          <button class="action-btn btn-delete" data-id="${item.id}">刪除</button>
        </td>
      </tr>
    `).join('');

    // Attach Action Listeners
    adminTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => handleEdit(btn.dataset.id));
    });

    adminTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => handleDelete(btn.dataset.id));
    });
  }

  adminModeFilter.addEventListener('change', renderAdminTable);

  // Edit Action
  async function handleEdit(id) {
    const record = currentRecords.find(r => r.id === id);
    if (!record) return;

    const newName = prompt('請輸入新的玩家暱稱:', record.playerName);
    if (newName === null) return;

    const newScoreStr = prompt('請輸入新的海拔高度 (m):', record.score);
    if (newScoreStr === null) return;

    const newScore = parseInt(newScoreStr, 10);
    if (isNaN(newScore)) {
      alert('請輸入有效的數字分數');
      return;
    }

    const success = await window.leaderboardService.updateRecord(id, newScore, newName.trim());
    if (success) {
      alert('修改成功！');
      loadAdminRecords();
    } else {
      alert('修改失敗，請檢查權限或連線');
    }
  }

  // Delete Action
  async function handleDelete(id) {
    const record = currentRecords.find(r => r.id === id);
    if (!record) return;

    if (confirm(`確定要刪除玩家「${record.playerName}」的這筆紀錄 (${record.score} m) 嗎？`)) {
      const success = await window.leaderboardService.deleteRecord(id);
      if (success) {
        alert('刪除成功！');
        loadAdminRecords();
      } else {
        alert('刪除失敗');
      }
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
