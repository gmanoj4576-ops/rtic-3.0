document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const btnLogout = document.getElementById('btn-logout');
  const userDisplay = document.getElementById('user-display');
  const loadingScreen = document.getElementById('loading-screen');
  const teamsTbody = document.getElementById('teams-tbody');
  const teamsMobileContainer = document.getElementById('teams-mobile-container');
  const searchTeams = document.getElementById('search-teams');
  const filterStatus = document.getElementById('filter-status');
  const teamsCount = document.getElementById('teams-count');
  const refreshBtn = document.getElementById('btn-refresh');
  
  const leaderboardTbody = document.getElementById('leaderboard-tbody');
  const leaderboardMobileContainer = document.getElementById('leaderboard-mobile-container');
  const leaderboardBtns = document.querySelectorAll('[data-sort]');
  
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
  
  // App State
  let token = sessionStorage.getItem('eval_token');
  let username = sessionStorage.getItem('eval_username');
  let role = sessionStorage.getItem('eval_role');
  let allTeams = [];
  let currentSort = 'overall'; // 'overall', 'day1', 'day2', 'day3'
  let currentSelectedTeam = null;
  let activeModalRound = 'day1';

  // Initialize
  checkAuth();

  // Theme Toggler
  const themeToggle = document.getElementById('theme-toggle');
  const savedTheme = localStorage.getItem('color-scheme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('color-scheme', newTheme);
    updateThemeIcon(newTheme);
  });

  function updateThemeIcon(theme) {
    const icon = themeToggle.querySelector('i');
    if (theme === 'dark') {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  }

  // --- Authentication Flow ---
  function checkAuth() {
    if (token && role && username) {
      loginSection.classList.add('d-none');
      dashboardSection.classList.remove('d-none');
      btnLogout.classList.remove('d-none');
      userDisplay.textContent = `${username} (${getRoleLabel(role)})`;
      loadDashboardData();
    } else {
      loginSection.classList.remove('d-none');
      dashboardSection.classList.add('d-none');
      btnLogout.classList.add('d-none');
    }
  }

  function getRoleLabel(roleName) {
    switch (roleName) {
      case 'evaluator1': return 'Round 1 Evaluator';
      case 'evaluator2': return 'Round 2 Evaluator';
      case 'evaluator3': return 'Round 3 Evaluator';
      case 'eval_admin': return 'Super Admin Evaluator';
      default: return 'Evaluator';
    }
  }

  // Form Submit: Login
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

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save credentials in session storage
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

  // Logout Click
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('eval_token');
    sessionStorage.removeItem('eval_username');
    sessionStorage.removeItem('eval_role');
    token = null;
    username = null;
    role = null;
    showToast('Logged out successfully', 'info');
    checkAuth();
  });

  // Refresh data click
  refreshBtn.addEventListener('click', loadDashboardData);

  // --- Fetch and Render Data ---
  async function loadDashboardData() {
    showLoading(true);
    try {
      // 1. Load Teams List
      const response = await fetch('/api/evaluation/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch teams data');
      allTeams = await response.json();
      renderTeamsTable();

      // 2. Load Leaderboard
      await loadLeaderboard();
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      showLoading(false);
    }
  }

  async function loadLeaderboard() {
    try {
      const res = await fetch(`/api/evaluation/leaderboard?sortBy=${currentSort}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch leaderboard data');
      const leaderboardData = await res.json();
      renderLeaderboard(leaderboardData);
    } catch (err) {
      console.error(err);
      showToast('Leaderboard sync failed', 'danger');
    }
  }

  function getActiveDayKey() {
    if (role === 'evaluator1') return 'day1';
    if (role === 'evaluator2') return 'day2';
    if (role === 'evaluator3') return 'day3';
    return null; // admin can edit all
  }

  function isEvaluationComplete(team, dayKey) {
    if (!dayKey) return false;
    const scores = team.evaluation?.[dayKey];
    return !!(scores && scores.evaluatedBy);
  }

  function renderTeamsTable() {
    const searchVal = searchTeams.value.toLowerCase().trim();
    const filterVal = filterStatus.value;
    const activeDayKey = getActiveDayKey();

    let filtered = allTeams.filter(team => {
      // Search matches
      const matchSearch = 
        team.teamId.toLowerCase().includes(searchVal) ||
        team.teamName.toLowerCase().includes(searchVal) ||
        team.college.toLowerCase().includes(searchVal) ||
        (team.leaderName && team.leaderName.toLowerCase().includes(searchVal));

      if (!matchSearch) return false;

      // Status filter matches
      if (filterVal === 'all') return true;
      
      const isComplete = isEvaluationComplete(team, activeDayKey);
      if (filterVal === 'complete') return isComplete;
      if (filterVal === 'pending') return !isComplete;

      return true;
    });

    teamsCount.textContent = `${filtered.length} Team${filtered.length === 1 ? '' : 's'} Found`;

    if (filtered.length === 0) {
      const emptyHtml = `
        <div class="text-center text-muted py-5">
          <i class="fa-solid fa-folder-open fa-2x mb-2 text-glow"></i>
          <div>No matching teams found.</div>
        </div>
      `;
      teamsTbody.innerHTML = `<tr><td colspan="8">${emptyHtml}</td></tr>`;
      if (teamsMobileContainer) teamsMobileContainer.innerHTML = emptyHtml;
      return;
    }

    // Desktop Table Render
    teamsTbody.innerHTML = filtered.map(team => {
      const d1Total = team.evaluation?.day1?.total || 0;
      const d2Total = team.evaluation?.day2?.total || 0;
      const d3Total = team.evaluation?.day3?.total || 0;
      const overall = team.evaluation?.overallTotal || 0;

      let statusHtml = '';
      if (activeDayKey) {
        const done = isEvaluationComplete(team, activeDayKey);
        statusHtml = done 
          ? `<span class="badge-status complete"><i class="fa-solid fa-circle-check me-1"></i>Graded</span>`
          : `<span class="badge-status pending"><i class="fa-solid fa-circle-notch fa-spin me-1"></i>Pending</span>`;
      }

      return `
        <tr>
          <td><strong class="font-outfit text-white">${team.teamId}</strong></td>
          <td>
            <div class="fw-bold text-glow-cyan">${team.teamName}</div>
            <small class="text-muted">${team.college}</small>
          </td>
          <td>${team.leaderName || 'N/A'}</td>
          <td><span class="text-info fw-bold">${d1Total}</span>/100</td>
          <td><span class="text-warning fw-bold">${d2Total}</span>/100</td>
          <td><span class="text-success fw-bold">${d3Total}</span>/100</td>
          <td><strong class="text-purple" style="font-size: 16px;">${overall}</strong>/300</td>
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

    // Mobile Card List Render
    if (teamsMobileContainer) {
      teamsMobileContainer.innerHTML = filtered.map(team => {
        const d1Total = team.evaluation?.day1?.total || 0;
        const d2Total = team.evaluation?.day2?.total || 0;
        const d3Total = team.evaluation?.day3?.total || 0;
        const overall = team.evaluation?.overallTotal || 0;

        let statusHtml = '';
        if (activeDayKey) {
          const done = isEvaluationComplete(team, activeDayKey);
          statusHtml = done 
            ? `<span class="badge-status complete"><i class="fa-solid fa-circle-check me-1"></i>Graded</span>`
            : `<span class="badge-status pending"><i class="fa-solid fa-circle-notch fa-spin me-1"></i>Pending</span>`;
        }

        return `
          <div class="mobile-team-card">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <span class="badge bg-cyan text-dark font-outfit px-2.5 py-1 fw-bold mb-1">${team.teamId}</span>
                <h5 class="fw-bold text-white mb-0" style="font-size: 1.05rem;">${team.teamName}</h5>
                <small class="text-muted">${team.college}</small>
              </div>
              <div>${statusHtml}</div>
            </div>
            <div class="row g-1 text-center my-2 py-2 border-top border-bottom border-secondary bg-dark bg-opacity-50 rounded">
              <div class="col-3">
                <small class="text-muted d-block font-outfit" style="font-size: 10px;">Round 1</small>
                <span class="text-info fw-bold">${d1Total}</span>
              </div>
              <div class="col-3">
                <small class="text-muted d-block font-outfit" style="font-size: 10px;">Round 2</small>
                <span class="text-warning fw-bold">${d2Total}</span>
              </div>
              <div class="col-3">
                <small class="text-muted d-block font-outfit" style="font-size: 10px;">Round 3</small>
                <span class="text-success fw-bold">${d3Total}</span>
              </div>
              <div class="col-3">
                <small class="text-muted d-block font-outfit" style="font-size: 10px;">Overall</small>
                <span class="text-purple fw-bold">${overall}</span>
              </div>
            </div>
            <button class="btn btn-gradient-eval w-100 py-2.5 font-outfit fw-bold btn-eval-team mt-1" data-id="${team._id}">
              <i class="fa-solid fa-pen-to-square me-1.5"></i> Evaluate Team Sheet
            </button>
          </div>
        `;
      }).join('');
    }
  }

  function renderLeaderboard(data) {
    if (!data || data.length === 0) {
      const emptyLeaderboard = `
        <div class="text-center text-muted py-5">
          <i class="fa-solid fa-trophy fa-2x mb-2 text-glow"></i>
          <div>No leaderboard data available yet.</div>
        </div>
      `;
      leaderboardTbody.innerHTML = `<tr><td colspan="8">${emptyLeaderboard}</td></tr>`;
      if (leaderboardMobileContainer) leaderboardMobileContainer.innerHTML = emptyLeaderboard;
      return;
    }

    // Desktop Leaderboard
    leaderboardTbody.innerHTML = data.map((entry, index) => {
      const rank = index + 1;
      let rankHtml = rank;
      if (rank === 1) rankHtml = `<i class="fa-solid fa-crown fa-lg text-warning animate-bounce"></i> <span class="fw-bold text-warning">1</span>`;
      else if (rank === 2) rankHtml = `<i class="fa-solid fa-medal fa-lg text-secondary"></i> <span class="fw-bold text-white">2</span>`;
      else if (rank === 3) rankHtml = `<i class="fa-solid fa-medal fa-lg text-bronze" style="color: #cd7f32;"></i> <span class="fw-bold" style="color: #cd7f32;">3</span>`;

      return `
        <tr>
          <td><strong class="font-outfit">${rankHtml}</strong></td>
          <td><span class="badge bg-dark text-white border border-secondary px-2.5 py-1.5">${entry.teamId?.teamId || 'N/A'}</span></td>
          <td><strong class="text-glow-cyan">${entry.teamId?.teamName || 'N/A'}</strong></td>
          <td><small class="text-muted">${entry.teamId?.college || 'N/A'}</small></td>
          <td class="text-info font-outfit fw-bold">${entry.day1?.total || 0}</td>
          <td class="text-warning font-outfit fw-bold">${entry.day2?.total || 0}</td>
          <td class="text-success font-outfit fw-bold">${entry.day3?.total || 0}</td>
          <td><span class="badge bg-purple text-dark font-outfit px-3 py-1.5 fw-bold" style="font-size: 14px;">${entry.overallTotal || 0}</span></td>
        </tr>
      `;
    }).join('');

    // Mobile Leaderboard Cards
    if (leaderboardMobileContainer) {
      leaderboardMobileContainer.innerHTML = data.map((entry, index) => {
        const rank = index + 1;
        let rankLabel = `#${rank}`;
        if (rank === 1) rankLabel = `<i class="fa-solid fa-crown text-warning me-1"></i> Rank 1`;
        else if (rank === 2) rankLabel = `<i class="fa-solid fa-medal text-secondary me-1"></i> Rank 2`;
        else if (rank === 3) rankLabel = `<i class="fa-solid fa-medal me-1" style="color:#cd7f32;"></i> Rank 3`;

        return `
          <div class="mobile-leaderboard-card">
            <div class="d-flex justify-content-between align-items-center mb-1.5">
              <span class="font-outfit fw-bold text-warning" style="font-size: 1rem;">${rankLabel}</span>
              <span class="badge bg-dark text-white border border-secondary px-2.5 py-1">${entry.teamId?.teamId || 'N/A'}</span>
            </div>
            <h5 class="fw-bold text-glow-cyan mb-0" style="font-size: 1.05rem;">${entry.teamId?.teamName || 'N/A'}</h5>
            <small class="text-muted d-block mb-2">${entry.teamId?.college || 'N/A'}</small>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top border-secondary">
              <div class="small">
                <span class="text-info me-2">R1: ${entry.day1?.total || 0}</span>
                <span class="text-warning me-2">R2: ${entry.day2?.total || 0}</span>
                <span class="text-success">R3: ${entry.day3?.total || 0}</span>
              </div>
              <span class="badge bg-purple text-dark font-outfit px-3 py-1.5 fw-bold" style="font-size: 13px;">${entry.overallTotal || 0} / 300</span>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // --- Filtering & Sorting Event Listeners ---
  searchTeams.addEventListener('input', renderTeamsTable);
  filterStatus.addEventListener('change', renderTeamsTable);

  // Leaderboard Sorting Buttons
  leaderboardBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      leaderboardBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSort = btn.getAttribute('data-sort');
      loadLeaderboard();
    });
  });

  // --- Event Delegation for Evaluate Button Click (Desktop Table & Mobile Cards) ---
  teamsTbody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eval-team');
    if (!btn) return;
    const mongoId = btn.getAttribute('data-id');
    openEvaluationModal(mongoId);
  });

  if (teamsMobileContainer) {
    teamsMobileContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn-eval-team');
      if (!btn) return;
      const mongoId = btn.getAttribute('data-id');
      openEvaluationModal(mongoId);
    });
  }

  // --- Step Score (+ / -) Touch Controls for Mobile & Quick Scoring ---
  evaluationModal.addEventListener('click', (e) => {
    const stepBtn = e.target.closest('.btn-step-score');
    if (!stepBtn) return;
    
    const action = stepBtn.getAttribute('data-action');
    const input = stepBtn.parentElement.querySelector('.score-input');
    if (!input || input.disabled) return;

    let val = Number(input.value || 0);
    const min = Number(input.getAttribute('min') || 0);
    const max = Number(input.getAttribute('max') || 100);

    if (action === 'inc' && val < max) {
      val += 1;
    } else if (action === 'dec' && val > min) {
      val -= 1;
    }

    input.value = val;
    calculateLiveTotal();
  });

  // --- Modal Evaluation Handling ---
  function openEvaluationModal(mongoId) {
    currentSelectedTeam = allTeams.find(t => String(t._id) === String(mongoId));
    if (!currentSelectedTeam) {
      console.error("Team not found for ID:", mongoId);
      showToast('Error opening evaluation for team', 'danger');
      return;
    }

    evalTeamId.value = mongoId;
    evalTeamDetails.textContent = `${currentSelectedTeam.teamId} | ${currentSelectedTeam.teamName}`;

    // Determine initial active round
    if (role === 'evaluator1') activeModalRound = 'day1';
    else if (role === 'evaluator2') activeModalRound = 'day2';
    else if (role === 'evaluator3') activeModalRound = 'day3';
    else activeModalRound = 'day1';

    setupFormForDay(activeModalRound, currentSelectedTeam.evaluation);

    // Show modal securely with fallback
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

  // Switch Rounds inside the modal
  roundSwitchBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      roundSwitchBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeModalRound = btn.getAttribute('data-round');
      
      if (currentSelectedTeam) {
        setupFormForDay(activeModalRound, currentSelectedTeam.evaluation);
      }
    });
  });

  function setupFormForDay(dayKey, currentEvaluation) {
    // Update active button state
    roundSwitchBtns.forEach(btn => {
      if (btn.getAttribute('data-round') === dayKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Round Title & Duration
    if (dayKey === 'day1') {
      evalDayTitle.textContent = 'Round 1: Ideation (15 Aug)';
      evalRoundDuration.innerHTML = '<i class="fa-solid fa-clock me-1 text-cyan"></i>Duration: 15 min/team (10 min Presentation + 5 min Q&A)';
    } else if (dayKey === 'day2') {
      evalDayTitle.textContent = 'Round 2: Prototype (29 Aug)';
      evalRoundDuration.innerHTML = '<i class="fa-solid fa-clock me-1 text-cyan"></i>Duration: 20 min/team (12 min Demo + 8 min Discussion)';
    } else if (dayKey === 'day3') {
      evalDayTitle.textContent = 'Grand Finale: Demo (05 Sep)';
      evalRoundDuration.innerHTML = '<i class="fa-solid fa-clock me-1 text-cyan"></i>Duration: 25 min/team (15 min Demo + 10 min Jury Interaction)';
    }

    // Toggle fields visibility
    document.getElementById('criteria-day1-group').classList.add('d-none');
    document.getElementById('criteria-day2-group').classList.add('d-none');
    document.getElementById('criteria-day3-group').classList.add('d-none');
    document.getElementById(`criteria-${dayKey}-group`).classList.remove('d-none');

    // Populate marks and input states
    const dayData = (currentEvaluation && currentEvaluation[dayKey]) || {};
    
    // Fill text area feedback
    evalFeedback.value = dayData.feedback || '';

    // Check authorization for editing
    const isAuthorized = (role === 'eval_admin') || 
      (role === 'evaluator1' && dayKey === 'day1') || 
      (role === 'evaluator2' && dayKey === 'day2') || 
      (role === 'evaluator3' && dayKey === 'day3');

    // Bind inputs
    const inputs = document.querySelectorAll(`.score-input`);
    inputs.forEach(input => {
      // Enable input only if current evaluator is authorized for this day
      if (input.classList.contains(`${dayKey}-score`)) {
        input.disabled = !isAuthorized;
        const scoreKey = input.name;
        input.value = dayData[scoreKey] || 0;
      }
    });

    calculateLiveTotal();
  }

  // Live Score calculations on input
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

  // Close modal helper
  function closeModal() {
    try {
      if (typeof evaluationModal.close === 'function') {
        evaluationModal.close();
      }
    } catch (e) {}
    evaluationModal.removeAttribute('open');
  }

  modalCloseBtn.addEventListener('click', closeModal);
  modalCancelBtn.addEventListener('click', closeModal);

  // Form Submit: Save Scores
  evaluationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const mongoId = evalTeamId.value;
    const activeGroup = document.querySelector('.day-group:not(.d-none)');
    const dayKey = activeGroup.id.replace('criteria-', '').replace('-group', ''); // 'day1', 'day2', 'day3'

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

  // --- Native Dialog light-dismiss Safari Fallback ---
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    evaluationModal.addEventListener('click', (event) => {
      if (event.target !== evaluationModal) return;

      const rect = evaluationModal.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (isDialogContent) return;
      closeModal();
    });
  }

  // --- UI Helpers ---
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
    
    setTimeout(() => {
      toast.remove();
    }, 4500);
  }
});
