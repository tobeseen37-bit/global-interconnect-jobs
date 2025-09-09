document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");
  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const searchBtn = document.getElementById("search-btn");
  const loadingMessage = document.getElementById("loading-message");

  // Saved jobs
  const savedJobsSection = document.getElementById("saved-jobs-section");
  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  // Modal
  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

  // Search history
  const searchHistoryDiv = document.getElementById("search-history");

  // --- API CONFIG ---
  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  // --- Helpers for Saved Jobs ---
  function getSavedJobs() {
    return JSON.parse(localStorage.getItem("savedJobs")) || [];
  }

  function saveJobsToStorage(jobs) {
    localStorage.setItem("savedJobs", JSON.stringify(jobs));
  }

  function updateSavedJobsUI() {
    const jobs = getSavedJobs();
    savedJobsList.innerHTML = "";
    jobs.forEach((job, index) => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "saved-job";
      jobDiv.innerHTML = `
        <strong>${job.title}</strong> – ${job.company}<br>
        <a href="${job.url}" target="_blank">Apply Now</a>
        <span class="delete-btn" data-index="${index}">❌ Delete</span>
      `;
      savedJobsList.appendChild(jobDiv);
    });
    savedJobsCounter.textContent = `${jobs.length}/4 this month`;

    // Attach delete handlers
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.dataset.index;
        const updatedJobs = getSavedJobs();
        updatedJobs.splice(idx, 1);
        saveJobsToStorage(updatedJobs);
        updateSavedJobsUI();
      });
    });
  }

  function trySaveJob(job) {
    const jobs = getSavedJobs();
    if (jobs.length >= 4) {
      alert("⚠️ Free users can only save 4 jobs per month. Upgrade for unlimited saves!");
      return;
    }
    jobs.push(job);
    saveJobsToStorage(jobs);
    updateSavedJobsUI();
  }

  // --- Search History ---
  function getSearchHistory() {
    return JSON.parse(localStorage.getItem("searchHistory")) || [];
  }

  function saveSearchHistory(term) {
    if (!term) return;
    let history = getSearchHistory();

    // Avoid duplicates
    history = history.filter(t => t.toLowerCase() !== term.toLowerCase());

    // Free plan: limit to 3
    if (history.length >= 3) {
      alert("⚠️ Free users can only save 3 recent searches. Upgrade for unlimited search history!");
      return;
    }

    // Add new term at the top
    history.unshift(term);

    localStorage.setItem("searchHistory", JSON.stringify(history));
    updateSearchHistoryUI();
  }

  function updateSearchHistoryUI() {
    const history = getSearchHistory();
    searchHistoryDiv.innerHTML = "<strong>Recent Searches:</strong><div id='history-list'></div>";

    const historyListDiv = document.getElementById("history-list");

    if (history.length === 0) {
      historyListDiv.innerHTML = "<p>No recent searches.</p>";
    } else {
      history.forEach(term => {
        const termBtn = document.createElement("button");
        termBtn.className = "history-btn";
        termBtn.textContent = term;
        termBtn.addEventListener("click", () => {
          jobSearchInput.value = term;
          fetchRemoteJobs(term);
          fetchLocalJobs(countrySelect ? countrySelect.value : "us", term);
        });
        historyListDiv.appendChild(termBtn);
      });
    }

    // Add Clear History button
    const clearHistoryBtn = document.createElement("button");
    clearHistoryBtn.textContent = "Clear History";
    clearHistoryBtn.style.marginTop = "5px";
    clearHistoryBtn.style.fontSize = "12px";
    clearHistoryBtn.addEventListener("click", () => {
      localStorage.removeItem("searchHistory");
      updateSearchHistoryUI();
    });
    searchHistoryDiv.appendChild(clearHistoryBtn);
  }

  // --- Modal Handling ---
  function openJobModal(job) {
    modalBody.innerHTML = `
      <div class="modal-header">${job.title}</div>
      <p><strong>${job.company}</strong> – ${job.location}</p>
      <p>${job.description || "No description available."}</p>
      <a href="${job.url}" target="_blank"><button>Apply Now</button></a>
      <button id="modal-save-btn">Save Job</button>
    `;
    jobModal.style.display = "flex";

    // Save handler inside modal
    const saveBtn = document.getElementById("modal-save-btn");
    saveBtn.addEventListener("click", () => {
      trySaveJob(job);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      jobModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === jobModal) {
      jobModal.style.display = "none";
    }
  });

  // --- Badge Helper ---
  function getJobBadge(dateStr) {
    if (!dateStr) return "";
    const postedDate = new Date(dateStr);
    const now = new Date();
    const diffHours = (now - postedDate) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours <= 48) return '<span class="badge new">New</span>';
    else if (diffDays >= 25) return '<span class="badge warning">Expiring Soon</span>';
    return "";
  }

  // --- FETCH REMOTE JOBS ---
  async function fetchRemoteJobs(search = "") {
    try {
      loadingMessage.style.display = "block";
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      remoteJobsDiv.innerHTML = "";

      const sortedJobs = data.jobs.slice(0, 10).sort(job => {
        const badge = getJobBadge(job.publication_date);
        if (badge.includes("New")) return -1;
        if (badge.includes("Expiring Soon")) return 1;
        return 0;
      });

      sortedJobs.forEach(job => {
        const badge = getJobBadge(job.publication_date);
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong> 
          <span class="badge info">Remote</span> ${badge}<br>
          ${job.company_name} – ${job.candidate_required_location}
        `;
        jobDiv.addEventListener("click", () => {
          openJobModal({
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location,
            description: job.description,
            url: job.url
          });
        });
        remoteJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
    } finally {
      loadingMessage.style.display = "none";
    }
  }

  // --- FETCH LOCAL JOBS ---
  async function fetchLocalJobs(country = "us", search = "") {
    try {
      loadingMessage.style.display = "block";
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`
      );
      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();

      localJobsDiv.innerHTML = "";

      const sortedJobs = data.results.sort(job => {
        const badge = getJobBadge(job.created);
        if (badge.includes("New")) return -1;
        if (badge.includes("Expiring Soon")) return 1;
        return 0;
      });

      sortedJobs.forEach(job => {
        const badge = getJobBadge(job.created);
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong> 
          <span class="badge info">Local</span> ${badge}<br>
          ${job.company.display_name} – ${job.location.display_name}
        `;
        jobDiv.addEventListener("click", () => {
          openJobModal({
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            description: job.description,
            url: job.redirect_url
          });
        });
        localJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    } finally {
      loadingMessage.style.display = "none";
    }
  }

  // --- GET STARTED BUTTON ---
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      console.log("Get Started button clicked 🎉");
      if (welcomeScreen) welcomeScreen.style.display = "none";
      if (jobBoard) jobBoard.style.display = "block";

      fetchRemoteJobs();
      fetchLocalJobs(countrySelect ? countrySelect.value : "us");
      updateSavedJobsUI();
      updateSearchHistoryUI();
    });
  }

  // --- COUNTRY DROPDOWN ---
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      fetchLocalJobs(countrySelect.value, jobSearchInput.value);
    });
  }

  // --- SEARCH BUTTON ---
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchTerm = jobSearchInput.value;
      fetchRemoteJobs(searchTerm);
      fetchLocalJobs(countrySelect ? countrySelect.value : "us", searchTerm);
      saveSearchHistory(searchTerm);
    });
  }
});




















      