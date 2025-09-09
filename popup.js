document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");

  // Create a container for side-by-side job columns
  let jobsContainer = document.getElementById("jobs-container");
  if (!jobsContainer) {
    jobsContainer = document.createElement("div");
    jobsContainer.id = "jobs-container";
    jobsContainer.style.display = "flex";
    jobsContainer.style.gap = "10px";
    jobBoard.insertBefore(jobsContainer, document.getElementById("saved-jobs-section"));
  }

  const remoteJobsDiv = document.getElementById("remote-jobs") || (() => {
    const div = document.createElement("div");
    div.id = "remote-jobs";
    div.className = "job-column";
    div.style.flex = "1";
    jobsContainer.appendChild(div);
    return div;
  })();

  const localJobsDiv = document.getElementById("local-jobs") || (() => {
    const div = document.createElement("div");
    div.id = "local-jobs";
    div.className = "job-column";
    div.style.flex = "1";
    jobsContainer.appendChild(div);
    return div;
  })();

  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const searchBtn = document.getElementById("search-btn");
  const loadingMessage = document.getElementById("loading-message");

  // Flags for loading
  let loadingRemote = false;
  let loadingLocal = false;

  // Saved jobs
  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  // Modal
  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

  // Upgrade modal
  const upgradeModal = document.createElement("div");
  upgradeModal.className = "modal";
  upgradeModal.style.display = "none";
  upgradeModal.innerHTML = `
    <div class="modal-content">
      <span class="close-btn" id="upgrade-close">&times;</span>
      <div id="upgrade-body">
        <h3>⚠️ Upgrade Required</h3>
        <p>You have reached your free limit. Upgrade to unlock unlimited saves and searches!</p>
        <button id="upgrade-now-btn">Upgrade Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(upgradeModal);
  const upgradeCloseBtn = document.getElementById("upgrade-close");
  const upgradeNowBtn = document.getElementById("upgrade-now-btn");

  upgradeCloseBtn.addEventListener("click", () => upgradeModal.style.display = "none");
  upgradeNowBtn.addEventListener("click", () => {
    window.open("#", "_blank");
    upgradeModal.style.display = "none";
  });
  window.addEventListener("click", (e) => {
    if (e.target === upgradeModal) upgradeModal.style.display = "none";
  });

  function showUpgradeModal() {
    upgradeModal.style.display = "flex";
  }

  // --- Saved Jobs Helpers ---
  function getSavedJobs() { return JSON.parse(localStorage.getItem("savedJobs")) || []; }
  function saveJobsToStorage(jobs) { localStorage.setItem("savedJobs", JSON.stringify(jobs)); }

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
    if (jobs.length >= 4) { showUpgradeModal(); return; }
    jobs.push(job);
    saveJobsToStorage(jobs);
    updateSavedJobsUI();
  }

  // --- Search History ---
  const searchHistoryDiv = document.getElementById("search-history");

  function getSearchHistory() { return JSON.parse(localStorage.getItem("searchHistory")) || []; }

  function saveSearchHistory(term) {
    if (!term) return;
    let history = getSearchHistory();
    if (!history.includes(term) && history.length >= 3) { showUpgradeModal(); return; }
    history = history.filter(t => t.toLowerCase() !== term.toLowerCase());
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
      history.forEach((term, index) => {
        const termWrapper = document.createElement("div");
        termWrapper.style.display = "inline-block";
        termWrapper.style.margin = "3px";

        const termBtn = document.createElement("button");
        termBtn.className = "history-btn";
        termBtn.textContent = term;
        termBtn.style.marginRight = "5px";
        termBtn.addEventListener("click", () => {
          jobSearchInput.value = term;
          fetchRemoteJobs(term);
          fetchLocalJobs(countrySelect ? countrySelect.value : "us", term);
        });

        const deleteBtn = document.createElement("span");
        deleteBtn.textContent = "❌";
        deleteBtn.style.cursor = "pointer";
        deleteBtn.style.fontSize = "12px";
        deleteBtn.addEventListener("click", () => {
          let updatedHistory = getSearchHistory();
          updatedHistory.splice(index, 1);
          localStorage.setItem("searchHistory", JSON.stringify(updatedHistory));
          updateSearchHistoryUI();
        });

        termWrapper.appendChild(termBtn);
        termWrapper.appendChild(deleteBtn);
        historyListDiv.appendChild(termWrapper);
      });
    }

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

  // --- Job Modal ---
  function openJobModal(job) {
    modalBody.innerHTML = `
      <div class="modal-header">${job.title}</div>
      <p><strong>${job.company}</strong> – ${job.location}</p>
      <p>${job.description || "No description available."}</p>
      <a href="${job.url}" target="_blank"><button>Apply Now</button></a>
      <button id="modal-save-btn">Save Job</button>
    `;
    jobModal.style.display = "flex";

    const saveBtn = document.getElementById("modal-save-btn");
    saveBtn.addEventListener("click", () => trySaveJob(job));
  }

  if (closeBtn) closeBtn.addEventListener("click", () => jobModal.style.display = "none");
  window.addEventListener("click", (e) => { if (e.target === jobModal) jobModal.style.display = "none"; });

  // --- Job Badge ---
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

  // --- Fetch Jobs ---
  async function fetchRemoteJobs(search = "") {
    try {
      loadingRemote = true;
      updateLoadingMessage();
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
          <span class="badge badge-remote">Remote</span> ${badge}<br>
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

      adjustPopupWidth();
    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
      adjustPopupWidth();
    } finally {
      loadingRemote = false;
      updateLoadingMessage();
    }
  }

  async function fetchLocalJobs(country = "us", search = "") {
    try {
      loadingLocal = true;
      updateLoadingMessage();

      // ✅ Updated Adzuna API call with what + adgroup for search terms
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}&content-type=application/json`
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
          <span class="badge badge-local">Local</span> ${badge}<br>
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

      adjustPopupWidth();
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
      adjustPopupWidth();
    } finally {
      loadingLocal = false;
      updateLoadingMessage();
    }
  }

  function updateLoadingMessage() {
    loadingMessage.style.display = (loadingRemote || loadingLocal) ? "block" : "none";
  }

  // --- Adjust Popup Width Dynamically ---
  function adjustPopupWidth() {
    const remoteWidth = remoteJobsDiv.scrollWidth;
    const localWidth = localJobsDiv.scrollWidth;
    const padding = 40; // extra padding
    const totalWidth = remoteWidth + localWidth + padding;
    window.resizeTo(totalWidth, window.outerHeight);
  }

  // --- Event Listeners ---
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      if (welcomeScreen) welcomeScreen.style.display = "none";
      if (jobBoard) jobBoard.style.display = "block";

      fetchRemoteJobs();
      fetchLocalJobs(countrySelect ? countrySelect.value : "us");
      updateSavedJobsUI();
      updateSearchHistoryUI();
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      fetchLocalJobs(countrySelect.value, jobSearchInput.value);
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchTerm = jobSearchInput.value;
      fetchRemoteJobs(searchTerm);
      fetchLocalJobs(countrySelect ? countrySelect.value : "us", searchTerm);
      saveSearchHistory(searchTerm);
    });
  }
});

// --- ADZUNA CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";   // your real Adzuna App ID
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1"; // your real App Key
// --- END ADZUNA CONFIG ---

























      