document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------------------------------
  // 1. Loading Screen & Fade-in Animations
  // ----------------------------------------------------
  const loadingScreen = document.getElementById("loading-screen");
  window.addEventListener("load", () => {
    if (loadingScreen) {
      loadingScreen.style.opacity = 0;
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
  });
  // Fallback in case load event takes too long
  setTimeout(() => {
    if (loadingScreen && loadingScreen.style.display !== "none") {
      loadingScreen.style.opacity = 0;
      setTimeout(() => {
        loadingScreen.style.display = "none";
      }, 500);
    }
  }, 2500);

  // Initialize AOS (Animate on Scroll)
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: true
    });
  }

  // ----------------------------------------------------
  // 2. Interactive Cursor Glow
  // ----------------------------------------------------
  const cursorGlow = document.getElementById("cursor-glow");
  document.addEventListener("mousemove", (e) => {
    if (cursorGlow) {
      cursorGlow.style.left = e.clientX + "px";
      cursorGlow.style.top = e.clientY + "px";
    }
  });

  // ----------------------------------------------------
  // 3. Particles.js Configuration Init
  // ----------------------------------------------------
  if (typeof particlesJS !== "undefined") {
    particlesJS("particles-js", {
      particles: {
        number: { value: 50, density: { enable: true, value_area: 800 } },
        color: { value: ["#ff0055", "#ffb703", "#ffffff"] },
        shape: { type: "circle" },
        opacity: { value: 0.35, random: true },
        size: { value: 3.5, random: true },
        line_linked: { enable: true, distance: 130, color: "#ff0055", opacity: 0.1, width: 1 },
        move: { enable: true, speed: 1.5, direction: "none", random: true, out_mode: "out" }
      },
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "grab" }, resize: true },
        modes: { grab: { distance: 150, line_linked: { opacity: 0.3 } } }
      }
    });
  }

  // ----------------------------------------------------
  // 4. Registration Extension Status
  // ----------------------------------------------------
  // Countdown timer removed as registrations have been extended.

  // ----------------------------------------------------
  // 5. Dark / Light Theme Switching
  // ----------------------------------------------------
  const themeToggle = document.getElementById("theme-toggle");
  
  function getTheme() {
    return document.documentElement.getAttribute("data-theme") || "dark";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("color-scheme", theme);
    
    if (themeToggle) {
      if (theme === "light") {
        themeToggle.innerHTML = `<i class="fa-solid fa-sun text-warning animate-pulse"></i>`;
      } else {
        themeToggle.innerHTML = `<i class="fa-solid fa-moon"></i>`;
      }
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = getTheme();
      const target = current === "dark" ? "light" : "dark";
      setTheme(target);
    });
    setTheme(getTheme());
  }

  // ----------------------------------------------------
  // 6. Navigation and Back-to-Top
  // ----------------------------------------------------
  const mainNav = document.getElementById("main-nav");
  const backToTop = document.getElementById("back-to-top");

  window.addEventListener("scroll", () => {
    if (mainNav && window.scrollY > 50) {
      mainNav.classList.add("nav-scrolled");
    } else if (mainNav) {
      mainNav.classList.remove("nav-scrolled");
    }

    if (backToTop) {
      if (window.scrollY > 400) {
        backToTop.classList.add("visible");
      } else {
        backToTop.classList.remove("visible");
      }
    }
  });

  if (backToTop) {
    backToTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Bulletproof copy helper
  function copyTextToClipboard(text, successCallback) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(successCallback).catch(err => {
        fallbackCopyText(text, successCallback);
      });
    } else {
      fallbackCopyText(text, successCallback);
    }
  }

  function fallbackCopyText(text, successCallback) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful && successCallback) {
        successCallback();
      }
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
    document.body.removeChild(textArea);
  }

  // Copy button click-to-copy utility
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-copy-field");
    if (btn) {
      const targetId = btn.getAttribute("data-copy-target");
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      const textToCopy = targetEl.innerText.trim();
      
      copyTextToClipboard(textToCopy, () => {
        const originalHtml = btn.innerHTML;
        const originalClass = btn.className;
        
        btn.innerHTML = `<i class="fa-solid fa-check me-1"></i>Copied!`;
        if (btn.classList.contains("btn-outline-info")) {
          btn.classList.remove("btn-outline-info");
          btn.classList.add("btn-success");
        }
        
        setTimeout(() => {
          btn.innerHTML = originalHtml;
          btn.className = originalClass;
        }, 1500);
      });
    }
  });

  // ----------------------------------------------------
  // 7. Multi-step Form & Draft Autosave (register.html only)
  // ----------------------------------------------------
  const form = document.getElementById("rtic-register-form");
  if (form) {
    const steps = ["step-1", "step-2", "step-3"];
    const progressLabels = document.querySelectorAll(".step-lbl");
    const progressBar = document.getElementById("form-progress");
    const draftAlert = document.getElementById("draft-saved-alert");
    let currentStepIndex = 0;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\d{10}$/;

    function validateCurrentStep() {
      const currentStepEl = document.getElementById(steps[currentStepIndex]);
      let stepValid = true;

      // Clear previous validation markings
      currentStepEl.querySelectorAll("input").forEach(input => {
        input.classList.remove("is-invalid");
      });

      // 1. Validate required inputs
      const requiredInputs = currentStepEl.querySelectorAll("input[required]");
      for (let input of requiredInputs) {
        if (input.type === "checkbox") {
          if (!input.checked) {
            input.classList.add("is-invalid");
            stepValid = false;
          }
        } else {
          if (!input.value.trim()) {
            input.classList.add("is-invalid");
            stepValid = false;
          } else {
            if (input.type === "email" && !emailRegex.test(input.value.trim())) {
              input.classList.add("is-invalid");
              stepValid = false;
            }
            if (input.type === "tel" && !phoneRegex.test(input.value.trim())) {
              input.classList.add("is-invalid");
              stepValid = false;
            }
          }
        }
      }

      // 2. Custom validations for Step 2 (Team Members)
      if (currentStepIndex === 1 && stepValid) {
        const validateMemberGroup = (nameId, regId, emailId, phoneId) => {
          const nameVal = document.getElementById(nameId).value.trim();
          const regVal = document.getElementById(regId).value.trim();
          const emailVal = document.getElementById(emailId).value.trim();
          const phoneVal = document.getElementById(phoneId).value.trim();

          const hasSomeVal = nameVal || regVal || emailVal || phoneVal;
          if (hasSomeVal) {
            let groupValid = true;
            if (!nameVal) {
              document.getElementById(nameId).classList.add("is-invalid");
              groupValid = false;
            }
            if (!regVal) {
              document.getElementById(regId).classList.add("is-invalid");
              groupValid = false;
            }
            if (!emailVal || !emailRegex.test(emailVal)) {
              document.getElementById(emailId).classList.add("is-invalid");
              groupValid = false;
            }
            if (!phoneVal || !phoneRegex.test(phoneVal)) {
              document.getElementById(phoneId).classList.add("is-invalid");
              groupValid = false;
            }
            if (!groupValid) stepValid = false;
            return { filled: true, valid: groupValid, email: emailVal.toLowerCase(), reg: regVal };
          }
          return { filled: false, valid: true };
        };

        const m2 = validateMemberGroup("m2Name", "m2Register", "m2Email", "m2Phone");
        const m3 = validateMemberGroup("m3Name", "m3Register", "m3Email", "m3Phone");
        const m4 = validateMemberGroup("m4Name", "m4Register", "m4Email", "m4Phone");

        if (stepValid) {
          // Check duplicates only against the active team members
          const emails = [document.getElementById("leaderEmail").value.trim().toLowerCase()];
          const regNums = [document.getElementById("leaderRegister").value.trim()];

          if (m2.filled) { emails.push(m2.email); regNums.push(m2.reg); }
          if (m3.filled) { emails.push(m3.email); regNums.push(m3.reg); }
          if (m4.filled) { emails.push(m4.email); regNums.push(m4.reg); }

          if (new Set(emails).size !== emails.length) {
            showFormError("Duplicate email addresses detected within the active team members!");
            stepValid = false;
          }
          if (new Set(regNums).size !== regNums.length) {
            showFormError("Duplicate register numbers detected within the active team members!");
            stepValid = false;
          }
        }
      }

      return stepValid;
    }

    function showFormError(message) {
      const errorAlert = document.getElementById("form-error-alert");
      const errorText = document.getElementById("form-error-text");
      errorText.innerText = message;
      errorAlert.classList.remove("d-none");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function hideFormError() {
      const errorAlert = document.getElementById("form-error-alert");
      errorAlert.classList.add("d-none");
    }

    function updateProgress() {
      const percentage = ((currentStepIndex + 1) / steps.length) * 100;
      progressBar.style.width = percentage + "%";
      progressBar.setAttribute("aria-valuenow", percentage);

      progressLabels.forEach((label, idx) => {
        if (idx <= currentStepIndex) {
          label.classList.add("active");
        } else {
          label.classList.remove("active");
        }
      });

      steps.forEach((stepId, idx) => {
        const stepEl = document.getElementById(stepId);
        if (idx === currentStepIndex) {
          stepEl.classList.remove("d-none");
        } else {
          stepEl.classList.add("d-none");
        }
      });

      // Calculate and update payment summary dynamically in step 3
      if (currentStepIndex === 2) {
        let count = 1; // leader is always present
        if (document.getElementById("m2Name").value.trim()) count++;
        if (document.getElementById("m3Name").value.trim()) count++;
        if (document.getElementById("m4Name").value.trim()) count++;

        const totalAmt = count * 350;

        const membersSummaryEl = document.querySelector(".fee-card .text-white.fw-bold");
        if (membersSummaryEl) {
          membersSummaryEl.innerText = `${count} Member${count > 1 ? 's' : ''}`;
        }
        
        const totalAmountEl = document.querySelector(".fee-card .text-gradient.fw-extrabold");
        if (totalAmountEl) {
          totalAmountEl.innerText = `₹${totalAmt}`;
        }

        const qrImageEl = document.getElementById("payment-qr-image");
        if (qrImageEl) {
          qrImageEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ruraltech@upi%26pn=RTIC3.0%26am=${totalAmt}%26cu=INR`;
        }
      }

      saveFormDraft();
    }

    document.querySelectorAll(".btn-next-step").forEach(btn => {
      btn.addEventListener("click", () => {
        hideFormError();
        if (validateCurrentStep()) {
          if (currentStepIndex < steps.length - 1) {
            currentStepIndex++;
            updateProgress();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          showFormError("Please fill out all fields correctly in this step.");
        }
      });
    });

    document.querySelectorAll(".btn-prev-step").forEach(btn => {
      btn.addEventListener("click", () => {
        hideFormError();
        if (currentStepIndex > 0) {
          currentStepIndex--;
          updateProgress();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      });
    });

    // Draft autosave fields list
    const inputsToSave = [
      "teamName", "college", "department",
      "leaderName", "leaderRegister", "leaderEmail", "leaderPhone",
      "m2Name", "m2Register", "m2Email", "m2Phone",
      "m3Name", "m3Register", "m3Email", "m3Phone",
      "m4Name", "m4Register", "m4Email", "m4Phone",
      "transactionId"
    ];

    function saveFormDraft() {
      const draft = {
        stepIndex: currentStepIndex
      };
      inputsToSave.forEach(id => {
        const el = document.getElementById(id);
        if (el) draft[id] = el.value;
      });
      localStorage.setItem("rtic_registration_draft", JSON.stringify(draft));
    }

    function loadFormDraft() {
      const rawDraft = localStorage.getItem("rtic_registration_draft");
      if (!rawDraft) return;

      try {
        const draft = JSON.parse(rawDraft);
        inputsToSave.forEach(id => {
          const el = document.getElementById(id);
          if (el && draft[id] !== undefined) {
            el.value = draft[id];
          }
        });
        if (draft.stepIndex !== undefined && draft.stepIndex < steps.length) {
          currentStepIndex = draft.stepIndex;
          updateProgress();
        }
      } catch (e) {
        console.error("Draft parsing failed:", e);
      }
    }

    // Trigger save on change
    form.querySelectorAll("input").forEach(input => {
      input.addEventListener("input", saveFormDraft);
    });

    loadFormDraft();

    // AJAX Form submission
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      hideFormError();

      const agree = document.getElementById("agreeTerms");
      if (!agree.checked) {
        showFormError("You must agree to the payment verification terms.");
        return;
      }

      if (!validateCurrentStep()) {
        showFormError("Please fill out all fields correctly.");
        return;
      }

      Swal.fire({
        title: 'Confirm Registration',
        text: "Make sure your transaction ID and screenshot match your ₹1400 payment proof.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Submit Registration',
        cancelButtonText: 'Review Form',
        background: getTheme() === 'dark' ? '#080c14' : '#ffffff',
        color: getTheme() === 'dark' ? '#94a3b8' : '#334155',
        confirmButtonColor: '#00ffcc',
        cancelButtonColor: '#f43f5e'
      }).then(async (result) => {
        if (result.isConfirmed) {
          submitRegistrationData();
        }
      });
    });

    async function submitRegistrationData() {
      Swal.fire({
        title: 'Uploading...',
        text: 'Saving details and uploading payment proof screenshot...',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const formData = new FormData();
      formData.append("teamName", document.getElementById("teamName").value.trim());
      formData.append("college", document.getElementById("college").value.trim());
      formData.append("department", document.getElementById("department").value.trim());
      formData.append("transactionId", document.getElementById("transactionId").value.trim());
      formData.append("paymentScreenshot", document.getElementById("paymentScreenshot").files[0]);

      const leader = {
        name: document.getElementById("leaderName").value.trim(),
        registerNumber: document.getElementById("leaderRegister").value.trim(),
        email: document.getElementById("leaderEmail").value.trim(),
        phone: document.getElementById("leaderPhone").value.trim()
      };
      const member2 = {
        name: document.getElementById("m2Name").value.trim(),
        registerNumber: document.getElementById("m2Register").value.trim(),
        email: document.getElementById("m2Email").value.trim(),
        phone: document.getElementById("m2Phone").value.trim()
      };
      const member3 = {
        name: document.getElementById("m3Name").value.trim(),
        registerNumber: document.getElementById("m3Register").value.trim(),
        email: document.getElementById("m3Email").value.trim(),
        phone: document.getElementById("m3Phone").value.trim()
      };
      const member4 = {
        name: document.getElementById("m4Name").value.trim(),
        registerNumber: document.getElementById("m4Register").value.trim(),
        email: document.getElementById("m4Email").value.trim(),
        phone: document.getElementById("m4Phone").value.trim()
      };

      formData.append("leader", JSON.stringify(leader));
      formData.append("member2", JSON.stringify(member2));
      formData.append("member3", JSON.stringify(member3));
      formData.append("member4", JSON.stringify(member4));

      try {
        const API_BASE = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.protocol === "file:")
          ? (window.location.port === "5000" ? "" : "http://localhost:5000")
          : "";
        const response = await fetch(`${API_BASE}/api/teams/register`, {
          method: "POST",
          body: formData
        });

        const data = await response.json();

        if (response.ok && data.success) {
          localStorage.removeItem("rtic_registration_draft");
          
          sessionStorage.setItem("rtic_registration", JSON.stringify({
            ...data.team,
            leader,
            member2,
            member3,
            member4,
            college: document.getElementById("college").value.trim(),
            department: document.getElementById("department").value.trim(),
            transactionId: document.getElementById("transactionId").value.trim()
          }));

          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Your registration has been submitted successfully!',
            confirmButtonText: 'Generate Receipt',
            background: getTheme() === 'dark' ? '#080c14' : '#ffffff',
            color: getTheme() === 'dark' ? '#94a3b8' : '#334155',
            confirmButtonColor: '#00ffcc'
          }).then(() => {
            window.location.href = "/success.html";
          });

        } else {
          Swal.fire({
            icon: 'error',
            title: 'Registration Rejected',
            text: data.message || 'Payment verification failed!',
            confirmButtonText: 'Correct Details',
            background: getTheme() === 'dark' ? '#080c14' : '#ffffff',
            color: getTheme() === 'dark' ? '#94a3b8' : '#334155'
          });
        }
      } catch (err) {
        console.error("AJAX error:", err);
        Swal.fire({
          icon: 'error',
          title: 'Server Error',
          text: 'Unable to connect to the backend server. Please try again later.',
          confirmButtonText: 'Close',
          background: getTheme() === 'dark' ? '#080c14' : '#ffffff',
          color: getTheme() === 'dark' ? '#94a3b8' : '#334155'
        });
      }
    }
  }

  // Query & Feedback form listener
  const queryForm = document.getElementById("query-form");
  if (queryForm) {
    queryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("query-name").value.trim();
      const email = document.getElementById("query-email").value.trim();
      const message = document.getElementById("query-message").value.trim();
      
      const mailtoUrl = `mailto:ieeeraskare@gmail.com?subject=RTIC 3.0 Query from ${encodeURIComponent(name)}&body=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0AQuery:%0A${encodeURIComponent(message)}`;
      window.location.href = mailtoUrl;

      Swal.fire({
        icon: 'success',
        title: 'Feedback Pre-filled!',
        text: 'Opening your email client to send the message. Thank you!',
        timer: 3000,
        showConfirmButton: false,
        background: getTheme() === 'dark' ? '#080c14' : '#ffffff',
        color: getTheme() === 'dark' ? '#94a3b8' : '#334155'
      });
      
      queryForm.reset();
    });
  }

});
