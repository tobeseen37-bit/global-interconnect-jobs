// --- ADZUNA CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  // --- DOM ELEMENTS ---
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
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const loadingMessage = document.getElementById("loading-message");
  const visaCheckbox = document.getElementById("visa-checkbox");

  let loadingRemote = false;
  let loadingLocal = false;

  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

  // --- Upgrade Modal ---
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

  upgradeCloseBtn.addEventListener("click", () => (upgradeModal.style.display = "none"));
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

    document.querySelectorAll(".delete-btn").forEach((btn) => {
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
      showUpgradeModal();
      return;
    }
    jobs.push(job);
    saveJobsToStorage(jobs);
    updateSavedJobsUI();
  }

  // --- Search History ---
  const searchHistoryDiv = document.getElementById("search-history");

  function getSearchHistory() {
    return JSON.parse(localStorage.getItem("searchHistory")) || [];
  }

  function saveSearchHistory(term) {
    if (!term) return;
    let history = getSearchHistory();
    if (!history.includes(term) && history.length >= 3) {
      showUpgradeModal();
      return;
    }
    history = history.filter((t) => t.toLowerCase() !== term.toLowerCase());
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

  if (closeBtn) closeBtn.addEventListener("click", () => (jobModal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === jobModal) jobModal.style.display = "none";
  });

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

  // --- Loading Message ---
  function updateLoadingMessage() {
    loadingMessage.style.display = loadingRemote || loadingLocal ? "block" : "none";
  }

  // --- Fetch Jobs ---
  async function fetchJobs({ type, search = "", country = "us", targetDiv }) {
    try {
      if (!targetDiv) return;
      if (type === "remote") loadingRemote = true;
      else loadingLocal = true;
      updateLoadingMessage();

      const visaChecked = visaCheckbox && visaCheckbox.checked;

      async function fetchAdzuna(countryCode) {
        let url = `https://api.adzuna.com/v1/api/jobs/${countryCode}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`;
        if (cityInput && cityInput.value.trim()) {
          url += `&where=${encodeURIComponent(cityInput.value.trim())}`;
        }
        const response = await fetch(url, { headers: { Accept: "application/json" } });
        const data = await response.json();
        return data.results || [];
      }

      let jobs = [];
      if (type === "remote") {
        // Remote OK
        const remoteOkRes = await fetch(`https://remoteok.com/api`);
        let remoteOkData = await remoteOkRes.json();
        remoteOkData = remoteOkData.filter(j => j.id);

        // We Work Remotely RSS
        const wwrRes = await fetch(`https://weworkremotely.com/categories/remote-programming-jobs.rss`);
        const wwrText = await wwrRes.text();
        const parser = new DOMParser();
        const wwrXML = parser.parseFromString(wwrText, "application/xml");
        const wwrData = [...wwrXML.querySelectorAll("item")].map(item => ({
          title: item.querySelector("title")?.textContent || "",
          company_name: item.querySelector("title")?.textContent.split(":")[0] || "Unknown",
          url: item.querySelector("link")?.textContent || "",
          description: item.querySelector("description")?.textContent || "",
          candidate_required_location: "Worldwide"
        }));

        // Working Nomads
        const wnRes = await fetch(`https://www.workingnomads.com/jobs/feed`);
        const wnText = await wnRes.text();
        const wnXML = parser.parseFromString(wnText, "application/xml");
        const wnData = [...wnXML.querySelectorAll("item")].map(item => ({
          title: item.querySelector("title")?.textContent || "",
          company_name: "Working Nomads",
          url: item.querySelector("link")?.textContent || "",
          description: item.querySelector("description")?.textContent || "",
          candidate_required_location: "Worldwide"
        }));

        // unify
        jobs = [
          ...remoteOkData.map(j => ({
            title: j.position || j.title,
            company_name: j.company || "",
            url: j.url,
            description: j.description || "",
            candidate_required_location: j.location || "Worldwide",
            publication_date: j.date
          })),
          ...wwrData,
          ...wnData
        ];
      } else {
        jobs = await fetchAdzuna(country);
      }

      targetDiv.innerHTML = "";
      if (!jobs || jobs.length === 0) {
        targetDiv.innerHTML = `<p>No ${type} jobs found.</p>`;
        return;
      }

      const searchRegex = search.trim() ? new RegExp(search.split(/\s+/).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "i") : null;

      jobs = jobs.filter(job => {
        const title = job.title || "";
        const desc = job.description || "";
        const location = type === "remote" ? job.candidate_required_location : (job.location?.display_name || "");
        const keywordMatch = !searchRegex || searchRegex.test(title) || searchRegex.test(desc) || searchRegex.test(location);
        const visaMatch = !visaChecked || /visa|sponsorship|h-1b/i.test(desc);
        return keywordMatch && visaMatch;
      });

      if (!jobs || jobs.length === 0) {
        targetDiv.innerHTML = `<p>No ${type} jobs found.</p>`;
        return;
      }

      jobs.slice(0, 10).forEach(job => {
        const badge = getJobBadge(job.publication_date || job.created);

        let extraBadge = "";
        if (type === "remote" && (job.candidate_required_location || "").toLowerCase().includes("worldwide")) {
          extraBadge = '<span class="badge worldwide">Worldwide</span>';
        }

        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong>
          <span class="badge badge-${type}">${type === "remote" ? "Remote" : "Local"}</span> ${extraBadge} ${badge}<br>
          ${type === "remote" ? `${job.company_name} – ${job.candidate_required_location}` : `${job.company.display_name} – ${job.location.display_name}`}
        `;
        jobDiv.addEventListener("click", () => {
          openJobModal({
            title: job.title,
            company: type === "remote" ? job.company_name : job.company.display_name,
            location: type === "remote" ? job.candidate_required_location : job.location.display_name,
            description: job.description,
            url: type === "remote" ? job.url : job.application_uri || job.redirect_url
          });
        });
        targetDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error(`Error fetching ${type} jobs:`, error);
      targetDiv.innerHTML = `<p>⚠️ Failed to load ${type} jobs.</p>`;
    } finally {
      if (type === "remote") loadingRemote = false;
      else loadingLocal = false;
      updateLoadingMessage();
    }
  }

  // --- Initialize UI ---
  updateSavedJobsUI();
  updateSearchHistoryUI();

  // remove Sweden & Norway
  if (countrySelect) {
    ["se","no"].forEach(code => {
      const opt = countrySelect.querySelector(`option[value="${code}"]`);
      if (opt) opt.remove();
    });
  }

  // --- Event Listeners ---
  if (viewJobsBtn) viewJobsBtn.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    jobBoard.style.display = "block";
  });

  if (searchBtn) searchBtn.addEventListener("click", runSearch);
  if (countrySelect) countrySelect.addEventListener("change", runSearch);
  if (visaCheckbox) visaCheckbox.addEventListener("change", runSearch);
  if (cityInput) {
    cityInput.addEventListener("input", () => {
      if (cityInput.value.trim().length > 2) runSearch();
    });
  }

  function runSearch() {
    const searchTerm = jobSearchInput.value.trim();
    const selectedCountry = countrySelect ? countrySelect.value : "us";
    saveSearchHistory(searchTerm);
    fetchJobs({ type: "remote", search: searchTerm, country: selectedCountry, targetDiv: remoteJobsDiv });
    fetchJobs({ type: "local", search: searchTerm, country: selectedCountry, targetDiv: localJobsDiv });
  }
});
// --- END OF FILE ---
// --- IGNORE ---