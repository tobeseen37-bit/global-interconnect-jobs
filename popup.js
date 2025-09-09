document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");
  const savedJobsDiv = document.getElementById("saved-jobs");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");
  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const searchBtn = document.getElementById("search-btn");
  const historyList = document.getElementById("history-list");
  const modal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const modalClose = document.querySelector(".close");

  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  // =====================
  // Fetch Remote Jobs
  // =====================
  async function fetchRemoteJobs(search = "") {
    try {
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      remoteJobsDiv.innerHTML = "";
      data.jobs.slice(0, 10).forEach(job => {
        const jobDiv = createJobDiv(job.title, job.company_name, job.candidate_required_location, job.url, job.description);
        remoteJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
    }
  }

  // =====================
  // Fetch Local Jobs
  // =====================
  async function fetchLocalJobs(country = "us", search = "") {
    try {
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`
      );
      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();

      localJobsDiv.innerHTML = "";
      data.results.forEach(job => {
        const jobDiv = createJobDiv(job.title, job.company.display_name, job.location.display_name, job.redirect_url, job.description);
        localJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    }
  }

  // =====================
  // Job Div + Modal
  // =====================
  function createJobDiv(title, company, location, url, description) {
    const jobDiv = document.createElement("div");
    jobDiv.className = "job";
    jobDiv.innerHTML = `
      <strong>${title}</strong><br>
      ${company} – ${location}<br>
      <button class="view-details-btn">View Details</button>
    `;

    jobDiv.querySelector(".view-details-btn").addEventListener("click", () => {
      openModal(title, company, location, url, description);
    });

    return jobDiv;
  }

  function openModal(title, company, location, url, description) {
    modalBody.innerHTML = `
      <h3>${title}</h3>
      <p><strong>${company}</strong> – ${location}</p>
      <p>${description || "No description available."}</p>
      <a href="${url}" target="_blank">Apply Now</a>
      <button class="save-job-btn">Save Job</button>
    `;

    modal.style.display = "block";

    modalBody.querySelector(".save-job-btn").addEventListener("click", () => {
      saveJob({ title, company, location, url });
    });
  }

  if (modalClose) {
    modalClose.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // =====================
  // Saved Jobs
  // =====================
  function saveJob(job) {
    chrome.storage.local.get(["savedJobs", "saveCount", "lastReset"], (result) => {
      let savedJobs = result.savedJobs || [];
      let saveCount = result.saveCount || 0;
      let lastReset = result.lastReset || Date.now();

      const now = Date.now();
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (now - lastReset > thirtyDays) {
        saveCount = 0;
        lastReset = now;
        savedJobs = [];
      }

      if (saveCount >= 4) {
        alert("Free limit reached: You can only save 4 jobs every 30 days.");
        return;
      }

      savedJobs.push(job);
      saveCount++;

      chrome.storage.local.set({ savedJobs, saveCount, lastReset }, () => {
        renderSavedJobs();
      });
    });
  }

  function renderSavedJobs() {
    chrome.storage.local.get(["savedJobs", "saveCount"], (result) => {
      const savedJobs = result.savedJobs || [];
      const count = result.saveCount || 0;

      savedJobsDiv.innerHTML = "";
      savedJobs.forEach((job, index) => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company} – ${job.location}<br>
          <a href="${job.url}" target="_blank">Apply Now</a>
          <button class="delete-job-btn" data-index="${index}">Delete</button>
        `;
        savedJobsDiv.appendChild(jobDiv);
      });

      savedJobsCounter.textContent = `${count}/4 this month`;

      document.querySelectorAll(".delete-job-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const index = e.target.getAttribute("data-index");
          deleteSavedJob(index);
        });
      });
    });
  }

  function deleteSavedJob(index) {
    chrome.storage.local.get(["savedJobs"], (result) => {
      let savedJobs = result.savedJobs || [];
      savedJobs.splice(index, 1);
      chrome.storage.local.set({ savedJobs }, renderSavedJobs);
    });
  }

  // =====================
  // Search History
  // =====================
  function saveSearchTerm(term) {
    if (!term) return;

    chrome.storage.local.get(["searchHistory"], (result) => {
      let history = result.searchHistory || [];

      history = history.filter(item => item.toLowerCase() !== term.toLowerCase());
      history.unshift(term);

      if (history.length > 3) history = history.slice(0, 3);

      chrome.storage.local.set({ searchHistory: history }, renderSearchHistory);
    });
  }

  function renderSearchHistory() {
    chrome.storage.local.get(["searchHistory"], (result) => {
      const history = result.searchHistory || [];
      historyList.innerHTML = "";

      history.forEach(term => {
        const li = document.createElement("li");
        li.innerHTML = `<button class="history-item">${term}</button>`;
        li.querySelector("button").addEventListener("click", () => {
          jobSearchInput.value = term;
          triggerSearch();
        });
        historyList.appendChild(li);
      });
    });
  }

  // =====================
  // Trigger Search
  // =====================
  function triggerSearch() {
    const searchTerm = jobSearchInput.value.trim();
    saveSearchTerm(searchTerm);
    fetchRemoteJobs(searchTerm);
    fetchLocalJobs(countrySelect ? countrySelect.value : "us", searchTerm);
  }

  // =====================
  // Event Listeners
  // =====================
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      welcomeScreen.style.display = "none";
      jobBoard.style.display = "block";
      fetchRemoteJobs();
      fetchLocalJobs(countrySelect.value);
      renderSavedJobs();
      renderSearchHistory();
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", triggerSearch);
  }

  if (jobSearchInput) {
    jobSearchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") triggerSearch();
    });
  }

  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      triggerSearch();
    });
  }
});










      