document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const btnLogout = document.getElementById('btn-logout');
  const userDisplay = document.getElementById('user-display');
  const userRoleBadge = document.getElementById('user-role-badge');
  const loadingScreen = document.getElementById('loading-screen');

  // Sidebar & Navigation Elements
  const appSidebar = document.getElementById('app-sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const navItemLinks = document.querySelectorAll('.nav-item-link');
  const contentViews = document.querySelectorAll('.content-view');
  
  // Sidebar Badges
  const badgePendingCount = document.getElementById('badge-pending-count');
  const badgeCompleteCount = document.getElementById('badge-complete-count');
  const badgeAllCount = document.getElementById('badge-all-count');

  // Views Title
  const teamsViewTitle = document.getElementById('teams-view-title');
  const teamsViewSubtitle = document.getElementById('teams-view-subtitle');

  // Home & QR Scanner Elements
  const btnToggleScanner = document.getElementById('btn-toggle-scanner');
  const mobileHomeQrBtn = document.getElementById('mobile-home-qr-btn');
  const scannerWrapper = document.getElementById('scanner-wrapper');
  const homeSearchInput = document.getElementById('home-search-input');
  const homeTeamsList = document.getElementById('home-teams-list');
  const homeResultsTitle = document.getElementById('home-results-title');
  const btnHomeRefresh = document.getElementById('btn-home-refresh');

  // Teams View Elements
  const teamsTbody = document.getElementById('teams-tbody');
  const teamsMobileContainer = document.getElementById('teams-mobile-container');
  const searchTeams = document.getElementById('search-teams');
  const filterStatus = document.getElementById('filter-status');
  const teamsCount = document.getElementById('teams-count');
  const refreshTeamsBtn = document.getElementById('btn-refresh-teams');

  // Team Members View Elements
  const searchMembers = document.getElementById('search-members');
  const membersListContainer = document.getElementById('members-list-container');

  // Leaderboard Elements
  const leaderboardTbody = document.getElementById('leaderboard-tbody');
  const leaderboardMobileContainer = document.getElementById('leaderboard-mobile-container');
  const leaderboardBtns = document.querySelectorAll('[data-sort]');

  // Modal Scoring Elements
  const evaluationModal = document.getElementById('evaluationModal');
  const evaluationForm = document.getElementById('evaluation-form');
  const evalTeamDetails = document.getElementById('eval-team-details');
  const evalTeamId = document.getElementById('eval-team-id');
  const evalDayTitle = document.getElementById('eval-day-title');
  const evalRoundDuration = document.getElementById('eval-round-duration');
  const liveTotalDisplay = document.getElementById('live-total-display');
  const evalFeedback = document.getElementById('eval-feedback');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const roundSwitchBtns = document.querySelectorAll('.btn-round-switch');

  // --- App State ---
  let token = sessionStorage.getItem('eval_token');
  let username = sessionStorage.getItem('eval_username');
  let role = sessionStorage.getItem('eval_role');
  let allTeams = [];
  let currentSort = 'overall';
  let currentSelectedTeam = null;
  let activeModalRound = 'day1';
  let html5QrcodeScanner = null;
  let isScannerRunning = false;

  // Initialize Auth Check
  checkAuth();

  // --- Theme Toggler ---
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('color-scheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('color-scheme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun me-1.5';
    } else {
      icon.className = 'fa-solid fa-moon me-1.5';
    }
  }

  // --- Mobile Navigation Drawer Controls ---
  function toggleMobileSidebar(show) {
    if (show) {
      if (appSidebar) appSidebar.classList.add('show');
      if (sidebarOverlay) sidebarOverlay.classList.add('show');
    } else {
      if (appSidebar) appSidebar.classList.remove('show');
      if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    }
  }

  if (sidebarToggle) sidebarToggle.addEventListener('click', () => toggleMobileSidebar(true));
  if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', () => toggleMobileSidebar(false));
  if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => toggleMobileSidebar(false));

  // --- Authentication Flow ---
  function checkAuth() {
    if (token && role && username) {
      loginSection.classList.add('d-none');
      dashboardSection.classList.remove('d-none');
      if (userDisplay) userDisplay.textContent = username;
      if (userRoleBadge) userRoleBadge.textContent = getRoleLabel(role);
      loadDashboardData();
    } else {
      loginSection.classList.remove('d-none');
      dashboardSection.classList.add('d-none');
    }
  }

  function getRoleLabel(roleName) {
    switch (roleName) {
      case 'eval_admin': return 'Super Admin Evaluator';
      default: return 'Evaluator';
    }
  }

  // Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userVal = document.getElementById('username').value.trim();
    const passVal = document.getElementById('password').value;

    showLoading(true);
    try {
      const response = await fetch('/api/evaluation/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userVal, password: passVal })
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Authentication failed');

      sessionStorage.setItem('eval_token', data.token);
      sessionStorage.setItem('eval_username', data.username);
      sessionStorage.setItem('eval_role', data.role);

      token = data.token;
      username = data.username;
      role = data.role;

      showToast('Successfully authenticated!', 'success');
      checkAuth();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      showLoading(false);
    }
  });

  // Logout Event
  btnLogout.addEventListener('click', () => {
    stopQrScanner();
    sessionStorage.removeItem('eval_token');
    sessionStorage.removeItem('eval_username');
    sessionStorage.removeItem('eval_role');
    token = null;
    username = null;
    role = null;
    showToast('Logged out successfully', 'info');
    checkAuth();
  });

  // Refresh Buttons
  if (btnHomeRefresh) btnHomeRefresh.addEventListener('click', loadDashboardData);
  if (refreshTeamsBtn) refreshTeamsBtn.addEventListener('click', loadDashboardData);

  // --- View Switcher ---
  navItemLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetView = link.getAttribute('data-view');
      switchView(targetView);
      toggleMobileSidebar(false);
    });
  });

  function switchView(viewName) {
    contentViews.forEach(v => v.classList.add('d-none'));

    navItemLinks.forEach(item => {
      const v = item.getAttribute('data-view');
      if (v === viewName || (viewName === 'pending' && v === 'pending') || (viewName === 'complete' && v === 'complete')) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    if (viewName === 'home') {
      document.getElementById('view-home').classList.remove('d-none');
    } else if (viewName === 'leaderboard') {
      document.getElementById('view-leaderboard').classList.remove('d-none');
      loadLeaderboard();
    } else if (viewName === 'members') {
      document.getElementById('view-members').classList.remove('d-none');
      renderMembersView();
    } else {
      document.getElementById('view-teams').classList.remove('d-none');
      if (viewName === 'pending') {
        filterStatus.value = 'pending';
        teamsViewTitle.textContent = 'Pending Evaluations';
        teamsViewSubtitle.textContent = 'Teams waiting for your evaluation score';
      } else if (viewName === 'complete') {
        filterStatus.value = 'complete';
        teamsViewTitle.textContent = 'Graded Teams';
        teamsViewSubtitle.textContent = 'Teams you have already evaluated';
      } else {
        filterStatus.value = 'all';
        teamsViewTitle.textContent = 'All Registered Teams';
        teamsViewSubtitle.textContent = 'Complete list of registered teams';
      }
      renderTeamsTable();
    }
  }

  // --- Dashboard Data Loader ---
  async function loadDashboardData() {
    showLoading(true);
    try {
      const response = await fetch('/api/evaluation/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch teams data');
      allTeams = await response.json();

      updateSidebarBadges();
      renderHomeTeams();
      renderTeamsTable();
      renderMembersView();
      await loadLeaderboard();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      showLoading(false);
    }
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch(`/api/evaluation/leaderboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leaderboard data');
      const leaderboardData = await res.json();
      renderLeaderboard(leaderboardData);
    } catch (err) {
      console.error(err);
    }
  }

  function getActiveDayKey() {
    return 'day1';
  }

  function isEvaluationComplete(team, dayKey = 'day1') {
    const scores = team.evaluation?.[dayKey] || team.evaluation;
    return !!(scores && (scores.evaluatedBy || scores.total > 0));
  }

  function updateSidebarBadges() {
    let pendingCount = 0;
    let completeCount = 0;

    allTeams.forEach(team => {
      if (isEvaluationComplete(team, 'day1')) completeCount++;
      else pendingCount++;
    });

    if (badgeAllCount) badgeAllCount.textContent = allTeams.length;
    if (badgePendingCount) badgePendingCount.textContent = pendingCount;
    if (badgeCompleteCount) badgeCompleteCount.textContent = completeCount;

    const mobAll = document.getElementById('mob-badge-all');
    const mobPending = document.getElementById('mob-badge-pending');
    const mobComplete = document.getElementById('mob-badge-complete');
    if (mobAll) mobAll.textContent = allTeams.length;
    if (mobPending) mobPending.textContent = pendingCount;
    if (mobComplete) mobComplete.textContent = completeCount;
  }

  // --- HOME VIEW ---
  if (homeSearchInput) {
    homeSearchInput.addEventListener('input', renderHomeTeams);
  }

  function renderHomeTeams() {
    if (!homeTeamsList) return;
    const query = (homeSearchInput ? homeSearchInput.value : '').toLowerCase().trim();

    if (!query) {
      if (homeResultsTitle) homeResultsTitle.textContent = '';
      homeTeamsList.innerHTML = `
        <div class="text-center py-5 px-3 glass-card border-dashed">
          <div class="mb-3">
            <i class="fa-solid fa-qrcode fa-3x text-cyan animate-pulse"></i>
          </div>
          <h4 class="font-outfit text-white fw-bold mb-2">Ready to Evaluate</h4>
          <p class="text-muted small mb-0" style="max-width: 440px; margin: 0 auto;">
            Use the <strong>Camera QR Scanner</strong> above or type a <strong>Team ID</strong> (e.g. <code>RTIC0001</code>) / <strong>Project Name</strong> / <strong>Leader Name</strong> in the search box to load team details.
          </p>
        </div>
      `;
      return;
    }

    let filtered = allTeams.filter(team => {
      const pName = (team.projectName || '').toLowerCase();
      return (
        team.teamId.toLowerCase().includes(query) ||
        team.teamName.toLowerCase().includes(query) ||
        pName.includes(query) ||
        team.college.toLowerCase().includes(query) ||
        (team.leaderName && team.leaderName.toLowerCase().includes(query)) ||
        (team.leaderPhone && team.leaderPhone.toLowerCase().includes(query)) ||
        (team.leaderEmail && team.leaderEmail.toLowerCase().includes(query))
      );
    });

    if (homeResultsTitle) {
      homeResultsTitle.textContent = `Search Results (${filtered.length})`;
    }

    if (filtered.length === 0) {
      homeTeamsList.innerHTML = `
        <div class="text-center text-muted py-5 glass-card">
          <i class="fa-solid fa-magnifying-glass fa-2x mb-2 text-cyan"></i>
          <div>No matching team found for "${query}".</div>
        </div>
      `;
      return;
    }

    homeTeamsList.innerHTML = filtered.map(team => {
      const done = isEvaluationComplete(team, 'day1');
      const statusHtml = done 
        ? `<span class="badge-status complete"><i class="fa-solid fa-circle-check me-1"></i>Graded</span>`
        : `<span class="badge-status pending"><i class="fa-solid fa-clock me-1"></i>Pending</span>`;

      return `
        <div class="mobile-team-card mb-3">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <div>
              <span class="badge bg-cyan text-dark font-outfit px-2.5 py-1 fw-bold mb-1">${team.teamId}</span>
              <h5 class="fw-bold text-white mb-0" style="font-size: 1.1rem;">${team.teamName}</h5>
              <small class="text-cyan d-block fw-semibold mb-1" style="font-size: 13px;"><i class="fa-solid fa-lightbulb me-1"></i>Project: ${team.projectName || team.teamName}</small>
              <small class="text-muted d-block">${team.college}</small>
              <small class="text-info" style="font-size: 12px;"><i class="fa-solid fa-user me-1"></i>Leader: ${team.leaderName || 'N/A'}</small>
            </div>
            <div>${statusHtml}</div>
          </div>
          <button class="btn btn-gradient-eval w-100 py-2.5 font-outfit fw-bold btn-eval-team mt-2" data-id="${team._id}">
            <i class="fa-solid fa-pen-to-square me-1.5"></i> Open Evaluation Sheet
          </button>
        </div>
      `;
    }).join('');
  }

  homeTeamsList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eval-team');
    if (!btn) return;
    openEvaluationModal(btn.getAttribute('data-id'));
  });

  // --- LIVE CAMERA QR CODE SCANNER ---
  if (btnToggleScanner) btnToggleScanner.addEventListener('click', toggleQrScanner);
  if (mobileHomeQrBtn) {
    mobileHomeQrBtn.addEventListener('click', () => {
      switchView('home');
      startQrScanner();
    });
  }

  function toggleQrScanner() {
    if (isScannerRunning) {
      stopQrScanner();
    } else {
      startQrScanner();
    }
  }

  function startQrScanner() {
    if (typeof Html5Qrcode === 'undefined') {
      showToast('QR Code scanner library failed to load', 'danger');
      return;
    }

    scannerWrapper.classList.remove('d-none');
    btnToggleScanner.innerHTML = '<i class="fa-solid fa-square-xmark me-1.5"></i> Stop Camera Scanner';
    btnToggleScanner.classList.replace('btn-gradient-eval', 'btn-outline-danger');

    if (!html5QrcodeScanner) {
      html5QrcodeScanner = new Html5Qrcode("qr-reader");
    }

    html5QrcodeScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        handleQrScannedText(decodedText);
      },
      (errorMessage) => {}
    ).then(() => {
      isScannerRunning = true;
    }).catch(err => {
      console.error("Camera scanner error:", err);
      showToast('Camera access failed. Please check browser permissions.', 'warning');
      stopQrScanner();
    });
  }

  function stopQrScanner() {
    if (html5QrcodeScanner && isScannerRunning) {
      html5QrcodeScanner.stop().then(() => {
        isScannerRunning = false;
        scannerWrapper.classList.add('d-none');
        btnToggleScanner.innerHTML = '<i class="fa-solid fa-qrcode me-1.5"></i> Start Camera Scan';
        btnToggleScanner.classList.replace('btn-outline-danger', 'btn-gradient-eval');
      }).catch(err => console.error(err));
    } else {
      scannerWrapper.classList.add('d-none');
      btnToggleScanner.innerHTML = '<i class="fa-solid fa-qrcode me-1.5"></i> Start Camera Scan';
      btnToggleScanner.classList.replace('btn-outline-danger', 'btn-gradient-eval');
    }
  }

  function handleQrScannedText(scannedText) {
    if (!scannedText) return;
    const clean = scannedText.trim().toLowerCase();

    const matched = allTeams.find(team => {
      const tId = (team.teamId || '').toLowerCase();
      const tName = (team.teamName || '').toLowerCase();
      const pName = (team.projectName || '').toLowerCase();
      const leader = (team.leaderName || '').toLowerCase();
      const leaderPhone = (team.leaderPhone || '').toLowerCase();
      const leaderEmail = (team.leaderEmail || '').toLowerCase();

      return clean.includes(tId) || 
             tId.includes(clean) || 
             clean.includes(tName) || 
             tName.includes(clean) ||
             (pName && (clean.includes(pName) || pName.includes(clean))) ||
             clean.includes(leader) ||
             (leaderPhone && clean.includes(leaderPhone)) ||
             (leaderEmail && clean.includes(leaderEmail));
    });

    if (matched) {
      stopQrScanner();
      if (homeSearchInput) {
        homeSearchInput.value = matched.teamId;
        renderHomeTeams();
      }
      showToast(`QR Scanned: Matched Team ${matched.teamId} (${matched.teamName})!`, 'success');
      openEvaluationModal(matched._id);
    } else {
      showToast(`No team matched scanned code: "${scannedText}"`, 'warning');
    }
  }

  // --- TEAMS VIEW ---
  if (searchTeams) searchTeams.addEventListener('input', renderTeamsTable);
  if (filterStatus) filterStatus.addEventListener('change', renderTeamsTable);

  function renderTeamsTable() {
    const searchVal = searchTeams ? searchTeams.value.toLowerCase().trim() : '';
    const filterVal = filterStatus ? filterStatus.value : 'all';

    let filtered = allTeams.filter(team => {
      const pName = (team.projectName || '').toLowerCase();
      const matchSearch = 
        team.teamId.toLowerCase().includes(searchVal) ||
        team.teamName.toLowerCase().includes(searchVal) ||
        pName.includes(searchVal) ||
        team.college.toLowerCase().includes(searchVal) ||
        (team.leaderName && team.leaderName.toLowerCase().includes(searchVal));

      if (!matchSearch) return false;
      if (filterVal === 'all') return true;
      
      const isComplete = isEvaluationComplete(team, 'day1');
      if (filterVal === 'complete') return isComplete;
      if (filterVal === 'pending') return !isComplete;

      return true;
    });

    if (teamsCount) teamsCount.textContent = `${filtered.length} Team${filtered.length === 1 ? '' : 's'} Found`;

    if (filtered.length === 0) {
      const emptyHtml = `
        <div class="text-center text-muted py-5">
          <i class="fa-solid fa-folder-open fa-2x mb-2"></i>
          <div>No matching teams found.</div>
        </div>
      `;
      if (teamsTbody) teamsTbody.innerHTML = `<tr><td colspan="7">${emptyHtml}</td></tr>`;
      if (teamsMobileContainer) teamsMobileContainer.innerHTML = emptyHtml;
      return;
    }

    if (teamsTbody) {
      teamsTbody.innerHTML = filtered.map(team => {
        const scoreVal = team.evaluation?.day1?.total || team.evaluation?.overallTotal || 0;
        const done = isEvaluationComplete(team, 'day1');
        const statusHtml = done 
          ? `<span class="badge-status complete"><i class="fa-solid fa-circle-check me-1"></i>Graded</span>`
          : `<span class="badge-status pending"><i class="fa-solid fa-clock me-1"></i>Pending</span>`;

        return `
          <tr>
            <td><strong class="font-outfit text-white">${team.teamId}</strong></td>
            <td><div class="fw-bold text-white">${team.teamName}</div></td>
            <td><div class="fw-bold text-cyan">${team.projectName || team.teamName}</div></td>
            <td><small class="text-muted">${team.college}</small></td>
            <td>${team.leaderName || 'N/A'}</td>
            <td><span class="text-info fw-bold">${scoreVal}</span>/100</td>
            <td class="text-center">
              <div class="d-flex align-items-center justify-content-center gap-2">
                ${statusHtml}
                <button class="btn btn-sm btn-gradient-eval px-3 font-outfit btn-eval-team" data-id="${team._id}">
                  <i class="fa-solid fa-pen-to-square me-1"></i> Evaluate
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    if (teamsMobileContainer) {
      teamsMobileContainer.innerHTML = filtered.map(team => {
        const done = isEvaluationComplete(team, 'day1');
        const statusHtml = done 
          ? `<span class="badge-status complete"><i class="fa-solid fa-circle-check me-1"></i>Graded</span>`
          : `<span class="badge-status pending"><i class="fa-solid fa-clock me-1"></i>Pending</span>`;

        return `
          <div class="mobile-team-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span class="badge bg-cyan text-dark font-outfit px-2.5 py-1 fw-bold mb-1">${team.teamId}</span>
                <h5 class="fw-bold text-white mb-0" style="font-size: 1.05rem;">${team.teamName}</h5>
                <small class="text-cyan d-block fw-semibold mb-1" style="font-size: 13px;"><i class="fa-solid fa-lightbulb me-1"></i>Project: ${team.projectName || team.teamName}</small>
                <small class="text-muted d-block">${team.college}</small>
                <small class="text-info" style="font-size: 12px;"><i class="fa-solid fa-user me-1"></i>Leader: ${team.leaderName || 'N/A'}</small>
              </div>
              <div>${statusHtml}</div>
            </div>
            <button class="btn btn-gradient-eval w-100 py-2.5 font-outfit fw-bold btn-eval-team mt-2" data-id="${team._id}">
              <i class="fa-solid fa-pen-to-square me-1.5"></i> Evaluate Team
            </button>
          </div>
        `;
      }).join('');
    }
  }

  if (teamsTbody) {
    teamsTbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-eval-team');
      if (!btn) return;
      openEvaluationModal(btn.getAttribute('data-id'));
    });
  }

  if (teamsMobileContainer) {
    teamsMobileContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-eval-team');
      if (!btn) return;
      openEvaluationModal(btn.getAttribute('data-id'));
    });
  }

  // --- TEAM MEMBERS ROSTER VIEW ---
  if (searchMembers) {
    searchMembers.addEventListener('input', renderMembersView);
  }

  function renderMembersView() {
    if (!membersListContainer) return;
    const query = (searchMembers ? searchMembers.value : '').toLowerCase().trim();

    let filtered = allTeams.filter(team => {
      if (!query) return true;
      const pName = (team.projectName || '').toLowerCase();
      const leader = (team.leaderName || '').toLowerCase();
      const leaderEmail = (team.leaderEmail || '').toLowerCase();
      const m2 = (team.member2Name || '').toLowerCase();
      const m2Reg = (team.member2RegNo || '').toLowerCase();
      const m3 = (team.member3Name || '').toLowerCase();
      const m3Reg = (team.member3RegNo || '').toLowerCase();
      const m4 = (team.member4Name || '').toLowerCase();
      const m4Reg = (team.member4RegNo || '').toLowerCase();

      return (
        team.teamId.toLowerCase().includes(query) ||
        team.teamName.toLowerCase().includes(query) ||
        pName.includes(query) ||
        leader.includes(query) ||
        leaderEmail.includes(query) ||
        m2.includes(query) || m2Reg.includes(query) ||
        m3.includes(query) || m3Reg.includes(query) ||
        m4.includes(query) || m4Reg.includes(query)
      );
    });

    if (filtered.length === 0) {
      membersListContainer.innerHTML = `
        <div class="text-center text-muted py-5 glass-card">
          <i class="fa-solid fa-users-slash fa-2x mb-2 text-cyan"></i>
          <div>No matching team members found for "${query}".</div>
        </div>
      `;
      return;
    }

    membersListContainer.innerHTML = filtered.map(team => {
      return `
        <div class="glass-card mb-4">
          <div class="d-flex justify-content-between align-items-start pb-3 border-bottom border-secondary mb-3 flex-wrap gap-2">
            <div>
              <span class="badge bg-cyan text-dark font-outfit px-3 py-1 fw-bold mb-1">${team.teamId}</span>
              <h4 class="fw-bold text-white mb-0">${team.teamName}</h4>
              <small class="text-cyan d-block fw-semibold" style="font-size: 13px;"><i class="fa-solid fa-lightbulb me-1"></i>Project: ${team.projectName || team.teamName}</small>
              <small class="text-muted"><i class="fa-solid fa-building-columns me-1"></i>${team.college}</small>
            </div>
            <button class="btn btn-sm btn-gradient-eval font-outfit px-3 btn-eval-team" data-id="${team._id}">
              <i class="fa-solid fa-pen-to-square me-1"></i> Evaluate Team
            </button>
          </div>

          <div class="row g-3">
            <!-- Team Leader -->
            <div class="col-md-6 col-lg-3">
              <div class="p-3 rounded-3 bg-dark bg-opacity-75 border border-cyan">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="fa-solid fa-user-astronaut text-cyan"></i>
                  <strong class="text-cyan small font-outfit">Team Leader</strong>
                </div>
                <div class="fw-bold text-white">${team.leaderName || 'N/A'}</div>
                <small class="text-muted d-block"><i class="fa-solid fa-envelope me-1"></i>${team.leaderEmail || 'N/A'}</small>
                <small class="text-muted d-block"><i class="fa-solid fa-phone me-1"></i>${team.leaderPhone || 'N/A'}</small>
              </div>
            </div>

            <!-- Member 2 -->
            <div class="col-md-6 col-lg-3">
              <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="fa-solid fa-user text-info"></i>
                  <strong class="text-info small font-outfit">Member 2</strong>
                </div>
                <div class="fw-bold text-white">${team.member2Name || 'N/A'}</div>
                <small class="text-muted d-block">${team.member2RegNo ? 'Reg: ' + team.member2RegNo : ''}</small>
              </div>
            </div>

            <!-- Member 3 -->
            <div class="col-md-6 col-lg-3">
              <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="fa-solid fa-user text-warning"></i>
                  <strong class="text-warning small font-outfit">Member 3</strong>
                </div>
                <div class="fw-bold text-white">${team.member3Name || 'N/A'}</div>
                <small class="text-muted d-block">${team.member3RegNo ? 'Reg: ' + team.member3RegNo : ''}</small>
              </div>
            </div>

            <!-- Member 4 -->
            <div class="col-md-6 col-lg-3">
              <div class="p-3 rounded-3 bg-dark bg-opacity-50 border border-secondary">
                <div class="d-flex align-items-center gap-2 mb-1">
                  <i class="fa-solid fa-user text-success"></i>
                  <strong class="text-success small font-outfit">Member 4</strong>
                </div>
                <div class="fw-bold text-white">${team.member4Name || 'N/A'}</div>
                <small class="text-muted d-block">${team.member4RegNo ? 'Reg: ' + team.member4RegNo : ''}</small>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  membersListContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eval-team');
    if (!btn) return;
    openEvaluationModal(btn.getAttribute('data-id'));
  });

  // --- LEADERBOARD ---
  leaderboardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      leaderboardBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.getAttribute('data-sort');
      loadLeaderboard();
    });
  });

  function renderLeaderboard(data) {
    if (!data || data.length === 0) {
      const emptyLeaderboard = `
        <div class="text-center text-muted py-5">
          <i class="fa-solid fa-trophy fa-2x mb-2 text-cyan"></i>
          <div>No leaderboard data available yet.</div>
        </div>
      `;
      if (leaderboardTbody) leaderboardTbody.innerHTML = `<tr><td colspan="6">${emptyLeaderboard}</td></tr>`;
      if (leaderboardMobileContainer) leaderboardMobileContainer.innerHTML = emptyLeaderboard;
      return;
    }

    if (leaderboardTbody) {
      leaderboardTbody.innerHTML = data.map((entry, index) => {
        const rank = index + 1;
        let rankHtml = `#${rank}`;
        if (rank === 1) rankHtml = `<i class="fa-solid fa-crown text-warning me-1"></i> Rank 1`;
        else if (rank === 2) rankHtml = `<i class="fa-solid fa-medal text-secondary me-1"></i> Rank 2`;
        else if (rank === 3) rankHtml = `<i class="fa-solid fa-medal me-1" style="color:#cd7f32;"></i> Rank 3`;

        const scoreVal = entry.day1?.total || entry.overallTotal || 0;
        const projName = entry.teamId?.projectName || entry.teamId?.teamName || 'N/A';

        return `
          <tr>
            <td><strong class="font-outfit">${rankHtml}</strong></td>
            <td><span class="badge bg-dark text-white border border-secondary px-2.5 py-1.5">${entry.teamId?.teamId || 'N/A'}</span></td>
            <td><strong class="text-white">${entry.teamId?.teamName || 'N/A'}</strong></td>
            <td><strong class="text-cyan">${projName}</strong></td>
            <td><small class="text-muted">${entry.teamId?.college || 'N/A'}</small></td>
            <td><span class="badge bg-purple text-dark font-outfit px-3 py-1.5 fw-bold" style="font-size: 13px;">${scoreVal} / 100 Marks</span></td>
          </tr>
        `;
      }).join('');
    }

    if (leaderboardMobileContainer) {
      leaderboardMobileContainer.innerHTML = data.map((entry, index) => {
        const rank = index + 1;
        let rankLabel = `#${rank}`;
        if (rank === 1) rankLabel = `<i class="fa-solid fa-crown text-warning me-1"></i> Rank 1`;
        else if (rank === 2) rankLabel = `<i class="fa-solid fa-medal text-secondary me-1"></i> Rank 2`;
        else if (rank === 3) rankLabel = `<i class="fa-solid fa-medal me-1" style="color:#cd7f32;"></i> Rank 3`;

        const scoreVal = entry.day1?.total || entry.overallTotal || 0;
        const projName = entry.teamId?.projectName || entry.teamId?.teamName || 'N/A';

        return `
          <div class="mobile-team-card">
            <div class="d-flex justify-content-between align-items-center mb-1.5">
              <span class="font-outfit fw-bold text-warning" style="font-size: 1rem;">${rankLabel}</span>
              <span class="badge bg-dark text-white border border-secondary px-2.5 py-1">${entry.teamId?.teamId || 'N/A'}</span>
            </div>
            <h5 class="fw-bold text-white mb-0" style="font-size: 1.05rem;">${entry.teamId?.teamName || 'N/A'}</h5>
            <small class="text-cyan d-block fw-semibold mb-1" style="font-size: 13px;"><i class="fa-solid fa-lightbulb me-1"></i>Project: ${projName}</small>
            <small class="text-muted d-block mb-2">${entry.teamId?.college || 'N/A'}</small>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
              <span class="badge bg-purple text-dark font-outfit px-3 py-1.5 fw-bold" style="font-size: 13px;">${scoreVal} / 100 Marks</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- MODAL SCORING DIALOG HANDLING ---
  function openEvaluationModal(mongoId) {
    currentSelectedTeam = allTeams.find(t => String(t._id) === String(mongoId));
    if (!currentSelectedTeam) {
      showToast('Error opening evaluation for team', 'danger');
      return;
    }

    evalTeamId.value = mongoId;
    evalTeamDetails.textContent = `${currentSelectedTeam.teamId} | ${currentSelectedTeam.teamName}`;

    activeModalRound = 'day1';
    setupFormForDay('day1', currentSelectedTeam.evaluation);

    try {
      if (typeof evaluationModal.showModal === 'function') {
        evaluationModal.showModal();
      } else {
        evaluationModal.setAttribute('open', 'true');
      }
    } catch (err) {
      evaluationModal.setAttribute('open', 'true');
    }
  }

  function setupFormForDay(dayKey, currentEvaluation) {
    if (evalDayTitle) {
      evalDayTitle.innerHTML = '<i class="fa-solid fa-clipboard-check me-1.5 text-warning"></i> Project Evaluation (100 Marks)';
    }
    if (evalRoundDuration) {
      evalRoundDuration.innerHTML = '<i class="fa-solid fa-clock me-1 text-cyan"></i>Duration: 15 min/team (10 min Pitch + 5 min Q&A)';
    }

    const day1Group = document.getElementById('criteria-day1-group');
    if (day1Group) day1Group.classList.remove('d-none');

    const dayData = (currentEvaluation && (currentEvaluation.day1 || currentEvaluation)) || {};
    if (evalFeedback) evalFeedback.value = dayData.feedback || '';

    const inputs = document.querySelectorAll('.score-input');
    inputs.forEach(input => {
      input.disabled = false;
      const scoreKey = input.name;
      input.value = dayData[scoreKey] || 0;
    });

    calculateLiveTotal();
  }

  evaluationForm.addEventListener('input', calculateLiveTotal);

  function calculateLiveTotal() {
    const activeGroup = document.querySelector('.day-group:not(.d-none)');
    if (!activeGroup) return;

    const inputs = activeGroup.querySelectorAll('.score-input');
    let sum = 0;
    inputs.forEach(input => {
      sum += Number(input.value || 0);
    });

    liveTotalDisplay.textContent = `${sum} / 100 Marks`;
  }

  // Step score buttons (+ / -)
  evaluationModal.addEventListener('click', (e) => {
    const stepBtn = e.target.closest('.btn-step-score');
    if (!stepBtn) return;
    
    const action = stepBtn.getAttribute('data-action');
    const input = stepBtn.parentElement.querySelector('.score-input');
    if (!input || input.disabled) return;

    let val = Number(input.value || 0);
    const min = Number(input.getAttribute('min') || 0);
    const max = Number(input.getAttribute('max') || 100);

    if (action === 'inc' && val < max) val += 1;
    else if (action === 'dec' && val > min) val -= 1;

    input.value = val;
    calculateLiveTotal();
  });

  function closeModal() {
    try {
      if (typeof evaluationModal.close === 'function') evaluationModal.close();
    } catch (e) {}
    evaluationModal.removeAttribute('open');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  // Form Submit Scores
  evaluationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mongoId = evalTeamId.value;
    const activeGroup = document.querySelector('.day-group:not(.d-none)');
    const dayKey = activeGroup ? activeGroup.id.replace('criteria-', '').replace('-group', '') : 'day1';

    const inputs = activeGroup.querySelectorAll('.score-input');
    const scores = {};
    inputs.forEach(input => {
      scores[input.name] = Number(input.value || 0);
    });

    const fbVal = evalFeedback.value.trim();

    showLoading(true);
    try {
      const response = await fetch('/api/evaluation/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          teamId: mongoId,
          day: dayKey,
          scores: scores,
          feedback: fbVal
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to save evaluation');

      showToast('Scores saved successfully!', 'success');
      closeModal();
      loadDashboardData();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      showLoading(false);
    }
  });

  // UI Helpers
  function showLoading(visible) {
    if (visible) loadingScreen.classList.remove('d-none');
    else loadingScreen.classList.add('d-none');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast-custom p-3 mb-2 animate-fade-in d-flex justify-content-between align-items-center border-start border-${type} border-3`;
    
    let iconClass = 'fa-circle-info text-info';
    if (type === 'success') iconClass = 'fa-circle-check text-success';
    if (type === 'danger') iconClass = 'fa-triangle-exclamation text-danger';
    if (type === 'warning') iconClass = 'fa-exclamation text-warning';

    toast.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="fa-solid ${iconClass} me-2.5 fa-lg"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white ms-2" style="font-size: 10px;" onclick="this.parentElement.remove()"></button>
    `;

    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4500);
  }
});
