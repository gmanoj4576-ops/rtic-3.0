document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
    ? (window.location.port === "5000" ? "" : "http://localhost:5000")
    : "";

  // Variables
  const loginOverlay = document.getElementById("admin-login-overlay");
  const dashboardContainer = document.getElementById("admin-dashboard");
  const loginForm = document.getElementById("admin-login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const teamsTableBody = document.getElementById("teams-table-body");
  const searchInput = document.getElementById("search-input");
  const statusFilter = document.getElementById("status-filter");
  const exportCsvBtn = document.getElementById("export-csv-btn");
  const exportExcelBtn = document.getElementById("export-excel-btn");
  const printBtn = document.getElementById("print-btn");

  let allTeamsData = []; // caches loaded teams for search & exports

  // Check initial authentication state
  const token = localStorage.getItem("rtic_admin_token");
  if (token) {
    showDashboard();
  } else {
    showLogin();
  }

  // ----------------------------------------------------
  // 1. Auth Panel Actions
  // ----------------------------------------------------
  function showLogin() {
    loginOverlay.classList.remove("d-none");
    dashboardContainer.classList.add("d-none");
  }

  function showDashboard() {
    loginOverlay.classList.add("d-none");
    dashboardContainer.classList.remove("d-none");
    
    // Initialize dashboard data
    loadStats();
    loadTeams();
  }

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem("rtic_admin_token", data.token);
        localStorage.setItem("rtic_admin_username", data.username);
        
        Swal.fire({
          icon: 'success',
          title: 'Authenticated!',
          text: `Welcome back, ${data.username}`,
          timer: 1500,
          showConfirmButton: false
        });

        showDashboard();
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Authentication Failed',
          text: data.message || 'Incorrect credentials!'
        });
      }
    } catch (err) {
      console.error("Login API Error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Could not connect to authentication service.'
      });
    }
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("rtic_admin_token");
    localStorage.removeItem("rtic_admin_username");
    window.location.reload();
  });

  // Helper for authorized fetch headers
  function getAuthHeaders() {
    return {
      "Authorization": `Bearer ${localStorage.getItem("rtic_admin_token")}`,
      "Content-Type": "application/json"
    };
  }

  // Handle unauthorized responses (token expired)
  function handleApiError(res, data) {
    if (res.status === 401) {
      localStorage.removeItem("rtic_admin_token");
      localStorage.removeItem("rtic_admin_username");
      Swal.fire({
        icon: 'warning',
        title: 'Session Expired',
        text: 'Your login session has expired. Please authenticate again.'
      }).then(() => {
        window.location.reload();
      });
      return true;
    }
    return false;
  }

  // ----------------------------------------------------
  // 2. Metrics & Stats Loading
  // ----------------------------------------------------
  async function loadStats() {
    try {
      const response = await fetch(`${API_BASE}/api/teams/stats`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (handleApiError(response, data)) return;

      if (response.ok) {
        document.getElementById("stat-total-teams").innerText = data.totalTeams || 0;
        document.getElementById("stat-total-participants").innerText = data.totalParticipants || 0;
        document.getElementById("stat-amount-collected").innerText = `₹${data.amountCollected || 0}`;
        document.getElementById("stat-pending-teams").innerText = data.pendingTeams || 0;
        document.getElementById("stat-approved-teams").innerText = data.approvedTeams || 0;
        document.getElementById("stat-rejected-teams").innerText = data.rejectedTeams || 0;
      }
    } catch (err) {
      console.error("Fetch Stats error:", err);
    }
  }

  // ----------------------------------------------------
  // 3. Team Lists Rendering
  // ----------------------------------------------------
  async function loadTeams() {
    const status = statusFilter.value;
    const search = searchInput.value.trim();
    
    let url = `${API_BASE}/api/teams?status=${status}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    try {
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });
      const data = await response.json();

      if (handleApiError(response, data)) return;

      if (response.ok) {
        allTeamsData = data;
        renderTeamsTable(data);
      }
    } catch (err) {
      console.error("Fetch teams error:", err);
      teamsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error connecting to server.</td></tr>`;
    }
  }

  function renderTeamsTable(teams) {
    if (teams.length === 0) {
      teamsTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No registrations found matching the filters.</td></tr>`;
      return;
    }

    teamsTableBody.innerHTML = "";
    teams.forEach(team => {
      let statusBadge = "";
      if (team.status === "approved") {
        statusBadge = `<span class="badge bg-success text-uppercase">Approved</span>`;
      } else if (team.status === "rejected") {
        statusBadge = `<span class="badge bg-danger text-uppercase">Rejected</span>`;
      } else {
        statusBadge = `<span class="badge bg-warning text-dark text-uppercase">Pending</span>`;
      }

      const regDate = new Date(team.registrationDate).toLocaleDateString('en-IN');

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="font-monospace fw-bold">${team.teamId}</td>
        <td>${team.teamName}</td>
        <td>
          <div class="small fw-bold">${team.college}</div>
          <div class="text-muted" style="font-size: 11px;">${team.department}</div>
        </td>
        <td>
          <div class="small fw-bold">${team.leader.name}</div>
          <div class="text-muted" style="font-size: 11px;"><i class="fa-solid fa-envelope me-1"></i>${team.leader.email}</div>
          <div class="text-muted" style="font-size: 11px;"><i class="fa-solid fa-phone me-1"></i>${team.leader.phone}</div>
        </td>
        <td class="font-monospace text-muted small">${team.transactionId}</td>
        <td>${statusBadge}</td>
        <td class="no-print">
          <div class="d-flex gap-1">
            <button class="btn btn-sm btn-info btn-view-proof" data-id="${team._id}" data-file="${team.paymentScreenshot}" title="View Proof"><i class="fa-solid fa-eye"></i></button>
            <button class="btn btn-sm btn-warning btn-edit-team" data-id="${team._id}" title="Edit Team"><i class="fa-solid fa-pen-to-square"></i></button>
            ${team.status !== 'approved' ? `<button class="btn btn-sm btn-success btn-approve" data-id="${team._id}" title="Approve"><i class="fa-solid fa-check"></i></button>` : ''}
            ${team.status !== 'rejected' ? `<button class="btn btn-sm btn-danger btn-reject" data-id="${team._id}" title="Reject"><i class="fa-solid fa-xmark"></i></button>` : ''}
            <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${team._id}" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      `;

      teamsTableBody.appendChild(tr);
    });

    attachTableActionListeners();
  }

  // ----------------------------------------------------
  // 4. Verification Actions (Approve, Reject, Delete, Edit)
  // ----------------------------------------------------
  function attachTableActionListeners() {
    // Approve Registration
    document.querySelectorAll(".btn-approve").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        updateStatus(id, "approved");
      });
    });

    // Reject Registration
    document.querySelectorAll(".btn-reject").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        updateStatus(id, "rejected");
      });
    });

    // Delete Registration
    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        confirmDelete(id);
      });
    });

    // View Screenshot Modal trigger
    document.querySelectorAll(".btn-view-proof").forEach(btn => {
      btn.addEventListener("click", () => {
        const filePath = btn.getAttribute("data-file");
        const container = document.getElementById("screenshot-viewer-container");
        const downloadLink = document.getElementById("download-screenshot-link");
        
        // Ensure path is absolute URL if it doesn't start with http/https
        const fullFilePath = filePath.startsWith("http") ? filePath : `${API_BASE}${filePath}`;
        downloadLink.href = fullFilePath;

        // Reset viewer container
        container.innerHTML = "";
        
        if (filePath.toLowerCase().endsWith(".pdf")) {
          // Embed PDF inside iframe
          container.innerHTML = `<iframe src="${fullFilePath}" style="width: 100%; height: 500px;" frameborder="0"></iframe>`;
        } else {
          // Render image
          container.innerHTML = `<img src="${fullFilePath}" alt="Screenshot" class="img-fluid rounded" style="max-height: 500px; object-fit: contain;">`;
        }

        const modal = new bootstrap.Modal(document.getElementById("screenshotModal"));
        modal.show();
      });
    });

    // Edit Team details modal trigger
    document.querySelectorAll(".btn-edit-team").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const team = allTeamsData.find(t => t._id === id);
        if (!team) return;

        // Fill form fields
        document.getElementById("edit-team-id-ref").value = id;
        document.getElementById("editTeamName").value = team.teamName;
        document.getElementById("editTransactionId").value = team.transactionId;
        document.getElementById("editCollege").value = team.college;
        document.getElementById("editDepartment").value = team.department;

        // Leader
        document.getElementById("editLeaderName").value = team.leader.name;
        document.getElementById("editLeaderRegister").value = team.leader.registerNumber;
        document.getElementById("editLeaderEmail").value = team.leader.email;
        document.getElementById("editLeaderPhone").value = team.leader.phone;

        // Member 2
        document.getElementById("editM2Name").value = team.member2.name;
        document.getElementById("editM2Register").value = team.member2.registerNumber;
        document.getElementById("editM2Email").value = team.member2.email;
        document.getElementById("editM2Phone").value = team.member2.phone;

        // Member 3
        document.getElementById("editM3Name").value = team.member3.name;
        document.getElementById("editM3Register").value = team.member3.registerNumber;
        document.getElementById("editM3Email").value = team.member3.email;
        document.getElementById("editM3Phone").value = team.member3.phone;

        // Member 4
        document.getElementById("editM4Name").value = team.member4.name;
        document.getElementById("editM4Register").value = team.member4.registerNumber;
        document.getElementById("editM4Email").value = team.member4.email;
        document.getElementById("editM4Phone").value = team.member4.phone;

        const modal = new bootstrap.Modal(document.getElementById("editTeamModal"));
        modal.show();
      });
    });
  }

  // Edit Team detail submission
  document.getElementById("edit-team-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-team-id-ref").value;

    const payload = {
      teamName: document.getElementById("editTeamName").value.trim(),
      transactionId: document.getElementById("editTransactionId").value.trim(),
      college: document.getElementById("editCollege").value.trim(),
      department: document.getElementById("editDepartment").value.trim(),
      leader: {
        name: document.getElementById("editLeaderName").value.trim(),
        registerNumber: document.getElementById("editLeaderRegister").value.trim(),
        email: document.getElementById("editLeaderEmail").value.trim(),
        phone: document.getElementById("editLeaderPhone").value.trim()
      },
      member2: {
        name: document.getElementById("editM2Name").value.trim(),
        registerNumber: document.getElementById("editM2Register").value.trim(),
        email: document.getElementById("editM2Email").value.trim(),
        phone: document.getElementById("editM2Phone").value.trim()
      },
      member3: {
        name: document.getElementById("editM3Name").value.trim(),
        registerNumber: document.getElementById("editM3Register").value.trim(),
        email: document.getElementById("editM3Email").value.trim(),
        phone: document.getElementById("editM3Phone").value.trim()
      },
      member4: {
        name: document.getElementById("editM4Name").value.trim(),
        registerNumber: document.getElementById("editM4Register").value.trim(),
        email: document.getElementById("editM4Email").value.trim(),
        phone: document.getElementById("editM4Phone").value.trim()
      }
    };

    Swal.fire({
      title: 'Saving changes...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const response = await fetch(`${API_BASE}/api/teams/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (handleApiError(response, data)) return;

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'Team details updated successfully!',
          timer: 1500,
          showConfirmButton: false
        });

        // Hide modal
        const modalEl = document.getElementById("editTeamModal");
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        // Refresh lists
        loadTeams();
        loadStats();
      } else {
        Swal.fire({ icon: 'error', title: 'Edit Failed', text: data.message || 'Error occurred!' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Connection failed.' });
    }
  });

  async function updateStatus(id, status) {
    Swal.fire({
      title: 'Updating status...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    try {
      const response = await fetch(`${API_BASE}/api/teams/${id}/status`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      const data = await response.json();

      if (handleApiError(response, data)) return;

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Status Updated!',
          text: `Registration is now ${status}. Notification email sent.`,
          timer: 2000,
          showConfirmButton: false
        });

        // Refresh
        loadTeams();
        loadStats();
      } else {
        Swal.fire({ icon: 'error', title: 'Action Failed', text: data.message || 'Error occurred!' });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Connection failed.' });
    }
  }

  function confirmDelete(id) {
    Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the team registration and delete their uploaded payment screenshot file. This cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete Team',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef5350'
    }).then(async (result) => {
      if (result.isConfirmed) {
        Swal.fire({
          title: 'Deleting registration...',
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        try {
          const response = await fetch(`${API_BASE}/api/teams/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders()
          });
          const data = await response.json();

          if (handleApiError(response, data)) return;

          if (response.ok) {
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Team registration has been deleted.',
              timer: 1500,
              showConfirmButton: false
            });

            loadTeams();
            loadStats();
          } else {
            Swal.fire({ icon: 'error', title: 'Delete Failed', text: data.message || 'Error occurred!' });
          }
        } catch (err) {
          console.error(err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Connection failed.' });
        }
      }
    });
  }

  // ----------------------------------------------------
  // 5. Filters & Export Handlers
  // ----------------------------------------------------
  searchInput.addEventListener("input", debounce(loadTeams, 300));
  statusFilter.addEventListener("change", loadTeams);

  function debounce(func, delay) {
    let debounceTimer;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
  }

  // Export CSV
  exportCsvBtn.addEventListener("click", () => {
    if (allTeamsData.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'There are no registrations to export.' });
      return;
    }
    const csvContent = convertToCSV(allTeamsData);
    downloadFile(csvContent, "rtic_registrations.csv", "text/csv;charset=utf-8;");
  });

  // Export Excel using SheetJS for a proper Excel file download
  exportExcelBtn.addEventListener("click", () => {
    if (allTeamsData.length === 0) {
      Swal.fire({ icon: 'info', title: 'No Data', text: 'There are no registrations to export.' });
      return;
    }

    const headers = [
      "Team ID", "Team Name", "College", "Department",
      "Leader Name", "Leader Reg No", "Leader Email", "Leader Phone",
      "Member 2 Name", "Member 2 Reg No", "Member 2 Email", "Member 2 Phone",
      "Member 3 Name", "Member 3 Reg No", "Member 3 Email", "Member 3 Phone",
      "Member 4 Name", "Member 4 Reg No", "Member 4 Email", "Member 4 Phone",
      "Transaction ID", "Amount", "Status", "Registration Date"
    ];

    const data = [headers];

    allTeamsData.forEach(item => {
      data.push([
        item.teamId || "",
        item.teamName || "",
        item.college || "",
        item.department || "",
        (item.leader && item.leader.name) || "",
        (item.leader && item.leader.registerNumber) || "",
        (item.leader && item.leader.email) || "",
        (item.leader && item.leader.phone) || "",
        (item.member2 && item.member2.name) || "",
        (item.member2 && item.member2.registerNumber) || "",
        (item.member2 && item.member2.email) || "",
        (item.member2 && item.member2.phone) || "",
        (item.member3 && item.member3.name) || "",
        (item.member3 && item.member3.registerNumber) || "",
        (item.member3 && item.member3.email) || "",
        (item.member3 && item.member3.phone) || "",
        (item.member4 && item.member4.name) || "",
        (item.member4 && item.member4.registerNumber) || "",
        (item.member4 && item.member4.email) || "",
        (item.member4 && item.member4.phone) || "",
        item.transactionId || "",
        item.amount || "",
        item.status || "",
        item.registrationDate ? new Date(item.registrationDate).toISOString() : ""
      ]);
    });

    try {
      if (typeof XLSX === "undefined") {
        throw new Error("SheetJS (XLSX) library is not loaded.");
      }
      const worksheet = XLSX.utils.aoa_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Registrations");

      // Auto-fit column widths
      const max_width = headers.map((val, colIdx) =>
        Math.max(...data.map(row => row[colIdx] ? row[colIdx].toString().length : 0))
      );
      worksheet["!cols"] = max_width.map(w => ({ w: Math.min(Math.max(w + 2, 10), 50) }));

      // Write and trigger download
      XLSX.writeFile(workbook, "rtic_registrations.xlsx");
    } catch (err) {
      console.error("Excel generation failed, falling back to legacy CSV download method:", err);
      // Fallback to legacy tab-separated CSV/BOM format
      const csvContent = "\uFEFF" + convertToCSV(allTeamsData);
      downloadFile(csvContent, "rtic_registrations.xlsx", "text/csv;charset=utf-8;");
    }
  });

  // Print Page
  printBtn.addEventListener("click", () => {
    window.print();
  });

  function convertToCSV(objArray) {
    const headers = [
      "Team ID", "Team Name", "College", "Department",
      "Leader Name", "Leader Reg No", "Leader Email", "Leader Phone",
      "Member 2 Name", "Member 2 Reg No", "Member 2 Email", "Member 2 Phone",
      "Member 3 Name", "Member 3 Reg No", "Member 3 Email", "Member 3 Phone",
      "Member 4 Name", "Member 4 Reg No", "Member 4 Email", "Member 4 Phone",
      "Transaction ID", "Amount", "Status", "Registration Date"
    ];

    let str = headers.join(",") + "\r\n";

    objArray.forEach(item => {
      const row = [
        item.teamId || "",
        `"${(item.teamName || "").replace(/"/g, '""')}"`,
        `"${(item.college || "").replace(/"/g, '""')}"`,
        item.department || "",
        `"${((item.leader && item.leader.name) || "").replace(/"/g, '""')}"`,
        (item.leader && item.leader.registerNumber) || "",
        (item.leader && item.leader.email) || "",
        (item.leader && item.leader.phone) || "",
        `"${((item.member2 && item.member2.name) || "").replace(/"/g, '""')}"`,
        (item.member2 && item.member2.registerNumber) || "",
        (item.member2 && item.member2.email) || "",
        (item.member2 && item.member2.phone) || "",
        `"${((item.member3 && item.member3.name) || "").replace(/"/g, '""')}"`,
        (item.member3 && item.member3.registerNumber) || "",
        (item.member3 && item.member3.email) || "",
        (item.member3 && item.member3.phone) || "",
        `"${((item.member4 && item.member4.name) || "").replace(/"/g, '""')}"`,
        (item.member4 && item.member4.registerNumber) || "",
        (item.member4 && item.member4.email) || "",
        (item.member4 && item.member4.phone) || "",
        item.transactionId || "",
        item.amount || "",
        item.status || "",
        item.registrationDate ? new Date(item.registrationDate).toISOString() : ""
      ];
      str += row.join(",") + "\r\n";
    });

    return str;
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // ----------------------------------------------------
  // 6. Particles.js Init inside Admin Dashboard
  // ----------------------------------------------------
  if (typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
      particles: {
        number: { value: 30, density: { enable: true, value_area: 800 } },
        color: { value: ["#00e5ff", "#9d4edd"] },
        shape: { type: "circle" },
        opacity: { value: 0.25, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#00e5ff", opacity: 0.1, width: 1 },
        move: { enable: true, speed: 1.5, direction: "none", random: true, out_mode: "out" }
      },
      interactivity: { detect_on: "canvas", events: { resize: true } }
    });
  }

});
