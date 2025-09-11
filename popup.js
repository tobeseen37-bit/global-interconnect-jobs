// --- ADZUNA CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");

  const jobsContainer = document.getElementById("jobs-container");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");

  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const visaCheckbox = document.getElementById("visa-checkbox");
  const loadingMessage = document.getElementById("loading-message");

  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

  let loadingRemote = false;
  let loadingLocal = false;

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
      alert("Upgrade required to save more jobs!");
      return;
    }
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
    if (!history.includes(term) && history.length >= 3) return;
    history = history.filter((t) => t.toLowerCase() !== term.toLowerCase());
    history.unshift(term);
    localStorage.setItem("searchHistory", JSON.stringify(history));
    updateSearchHistoryUI();
  }
  function updateSearchHistoryUI() {
    const history = getSearchHistory();
    const historyListDiv = document.getElementById("history-list");
    historyListDiv.innerHTML = "";
    if (!history.length) { historyListDiv.innerHTML = "<p>No recent searches.</p>"; return; }
    history.forEach((term, index) => {
      const termWrapper = document.createElement("div");
      termWrapper.style.display = "inline-block";
      termWrapper.style.margin = "3px";

      const termBtn = document.createElement("button");
      termBtn.className = "history-btn";
      termBtn.textContent = term;
      termBtn.style.marginRight = "5px";
      termBtn.addEventListener("click", () => { jobSearchInput.value = term; runSearch(); });

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
    document.getElementById("modal-save-btn").addEventListener("click", () => trySaveJob(job));
  }
  if (closeBtn) closeBtn.addEventListener("click", () => (jobModal.style.display = "none"));
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

  function updateLoadingMessage() {
    loadingMessage.style.display = loadingRemote || loadingLocal ? "block" : "none";
  }

  // --- Fetch Jobs ---
  async function fetchJobs({ type, search = "", country = "us", targetDiv }) {
    try {
      if (!targetDiv) return;
      if (type === "remote") loadingRemote = true; else loadingLocal = true;
      updateLoadingMessage();

      const visaChecked = visaCheckbox && visaCheckbox.checked;
      let jobs = [];

      if (type === "remote") {
        const proxy = "https://api.allorigins.win/get?url=";

        // Remote OK
        const rurl = encodeURIComponent("https://remoteok.com/api");
        let remoteData = await fetch(proxy + rurl).then(r => r.json()).then(r => JSON.parse(r.contents).filter(j => j.id));

        // We Work Remotely (RSS)
        const wwrRes = await fetch(proxy + encodeURIComponent("https://weworkremotely.com/categories/remote-programming-jobs.rss"));
        const wwrText = (await wwrRes.json()).contents;
        const parser = new DOMParser();
        const wwrXML = parser.parseFromString(wwrText, "application/xml");
        const wwrData = [...wwrXML.querySelectorAll("item")].map(item => ({
          title: item.querySelector("title")?.textContent || "",
          url: item.querySelector("link")?.textContent || "#",
          company: item.querySelector("title")?.textContent.split("–")[0]?.trim() || "",
          location: "Remote",
          description: item.querySelector("description")?.textContent || "",
          date: item.querySelector("pubDate")?.textContent || ""
        }));

        // Working Nomads (RSS)
        const wnRes = await fetch(proxy + encodeURIComponent("https://www.workingnomads.co/api/v1/remote-jobs"));
        let wnData = await wnRes.json();

        jobs = [...remoteData.map(j => ({
          title: j.position || j.title,
          company: j.company || "",
          location: j.location || "Remote",
          description: j.description || "",
          url: j.url || "#",
          date: j.date || ""
        })), ...wwrData, ...wnData];
      } else {
        const city = cityInput.value;
        const adzunaURL = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=20&what=${encodeURIComponent(search)}&where=${encodeURIComponent(city)}&content-type=application/json`;
        const res = await fetch(adzunaURL);
        const data = await res.json();
        jobs = data.results.map(j => ({
          title: j.title,
          company: j.company.display_name,
          location: j.location.display_name,
          description: j.description,
          url: j.redirect_url,
          date: j.created
        }));
      }

      targetDiv.innerHTML = "";
      jobs.forEach(j => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <div class="job-title">${j.title}</div>
          <div class="job-company">${j.company}</div>
          <div class="job-location">${j.location}</div>
          <div class="job-badges">${getJobBadge(j.date)}</div>
        `;
        jobDiv.addEventListener("click", () => openJobModal(j));
        targetDiv.appendChild(jobDiv);
      });
    } catch (err) { console.error(err); }
    finally {
      if (type === "remote") loadingRemote = false; else loadingLocal = false;
      updateLoadingMessage();
    }
  }

  async function runSearch() {
    const searchTerm = jobSearchInput.value;
    const country = countrySelect.value;
    saveSearchHistory(searchTerm);
    await fetchJobs({ type: "remote", search: searchTerm, country, targetDiv: remoteJobsDiv });
    await fetchJobs({ type: "local", search: searchTerm, country, targetDiv: localJobsDiv });
  }

  viewJobsBtn.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    jobBoard.style.display = "block";
    runSearch();
    updateSavedJobsUI();
    updateSearchHistoryUI();
  });

  searchBtn.addEventListener("click", runSearch);
  jobSearchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") runSearch(); });

  document.getElementById("clear-history-btn").addEventListener("click", () => {
    localStorage.removeItem("searchHistory");
    updateSearchHistoryUI();
  });
});
// Initial UI Updates
updateSavedJobsUI();
updateSearchHistoryUI();  