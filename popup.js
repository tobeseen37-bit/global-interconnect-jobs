document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");

  let jobsContainer = document.getElementById("jobs-container");
  if (!jobsContainer) {
    jobsContainer = document.createElement("div");
    jobsContainer.id = "jobs-container";
    jobsContainer.style.display = "flex";
    jobsContainer.style.gap = "10px";
    jobBoard.insertBefore(jobsContainer, document.getElementById("saved-jobs-section"));
  }

  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");

  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const cityInput = document.getElementById("city-input"); // ✅ city/state filter
  const searchBtn = document.getElementById("search-btn");
  const loadingMessage = document.getElementById("loading-message");
  const categorySelect = document.getElementById("category-select");
  const visaCheckbox = document.getElementById("visa-checkbox"); // ✅ Visa Sponsorship checkbox

  let loadingRemote = false;
  let loadingLocal = false;

  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

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
          runSearch();
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

  // --- Fetch Categories ---
  async function fetchCategories() {
    try {
      const remotiveRes = await fetch("https://remotive.com/api/remote-jobs/categories");
      const remotiveData = await remotiveRes.json();

      const adzunaRes = await fetch(`https://api.adzuna.com/v1/api/jobs/us/categories?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}`);
      const adzunaData = await adzunaRes.json();

      if (categorySelect) {
        categorySelect.innerHTML = `<option value="">All Categories</option>`;

        remotiveData.jobs.forEach(cat => {
          const option = document.createElement("option");
          option.value = `remotive:${cat.slug}`;
          option.textContent = `🌍 Remote – ${cat.name}`;
          categorySelect.appendChild(option);
        });

        adzunaData.results.forEach(cat => {
          const option = document.createElement("option");
          option.value = `adzuna:${cat.tag}`;
          option.textContent = `📍 Local – ${cat.label}`;
          categorySelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }

  // --- Fetch Remote Jobs ---
  async function fetchRemoteJobs(search = "", category = "") {
    try {
      loadingRemote = true;
      updateLoadingMessage();

      let query = search;
      if (visaCheckbox && visaCheckbox.checked) {
        query += " visa sponsorship OR work visa OR relocation assistance";
      }

      let url = `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`;
      if (category && category.startsWith("remotive:")) {
        url += `&category=${encodeURIComponent(category.replace("remotive:", ""))}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      remoteJobsDiv.innerHTML = "";

      data.jobs.slice(0, 10).forEach(job => {
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

    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
    } finally {
      loadingRemote = false;
      updateLoadingMessage();
    }
  }

  // --- Fetch Local Jobs ---
  async function fetchLocalJobs(country = "us", search = "", category = "") {
    try {
      loadingLocal = true;
      updateLoadingMessage();

      let query = search;
      if (visaCheckbox && visaCheckbox.checked) {
        query += " visa sponsorship OR work visa OR relocation assistance";
      }

      let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(query)}`;

      // ✅ include city/state filter
      const city = cityInput ? cityInput.value.trim() : "";
      if (city) {
        url += `&where=${encodeURIComponent(city)}`;
      }

      if (category && category.startsWith("adzuna:")) {
        url += `&category=${encodeURIComponent(category.replace("adzuna:", ""))}`;
      }

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();
      localJobsDiv.innerHTML = "";

      if (!data.results || data.results.length === 0) {
        localJobsDiv.innerHTML = "<p>No local jobs found.</p>";
        return;
      }

      data.results.forEach(job => {
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

    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    } finally {
      loadingLocal = false;
      updateLoadingMessage();
    }
  }

  function updateLoadingMessage() {
    loadingMessage.style.display = (loadingRemote || loadingLocal) ? "block" : "none";
  }

  // --- Unified Search Function ---
  function runSearch() {
    const searchTerm = jobSearchInput.value;
    const category = categorySelect ? categorySelect.value : "";
    const country = countrySelect ? countrySelect.value : "us";

    fetchRemoteJobs(searchTerm, category);
    fetchLocalJobs(country, searchTerm, category);
    saveSearchHistory(searchTerm);
  }

  // --- Event Listeners ---
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      welcomeScreen.style.display = "none";
      jobBoard.style.display = "block";

      fetchCategories();
      fetchRemoteJobs();
      fetchLocalJobs(countrySelect.value);
      updateSavedJobsUI();
      updateSearchHistoryUI();
    });
  }

  if (countrySelect) countrySelect.addEventListener("change", runSearch);
  if (categorySelect) categorySelect.addEventListener("change", runSearch);
  if (searchBtn) searchBtn.addEventListener("click", runSearch);
  if (visaCheckbox) visaCheckbox.addEventListener("change", runSearch);

  if (cityInput) {
    cityInput.addEventListener("input", () => {
      if (cityInput.value.trim().length > 2) {
        runSearch();
      }
    });
  }
});

// --- ADZUNA CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";



// --- IGNORE ---






























      