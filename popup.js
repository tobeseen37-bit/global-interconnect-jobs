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
  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  // --- API CONFIG ---
  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  // Countries supported by Adzuna
  const SUPPORTED_COUNTRIES = [
    "au","at","be","br","ca","fr","de","in","it","mx","nl",
    "nz","pl","sg","za","es","ch","gb","us"
  ];

  // --- SHOW LOADING ---
  function showLoading() {
    loadingMessage.style.display = "block";
  }

  function hideLoading() {
    loadingMessage.style.display = "none";
  }

  // --- FETCH REMOTE JOBS ---
  async function fetchRemoteJobs(search = "") {
    try {
      showLoading();
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      remoteJobsDiv.innerHTML = "";
      data.jobs.slice(0, 10).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company_name} – ${job.candidate_required_location}<br>
          <a href="${job.url}" target="_blank">Apply Now</a><br>
          <button class="save-job-btn">💾 Save Job</button>
        `;

        jobDiv.querySelector(".save-job-btn").addEventListener("click", () => {
          saveJob(job.title, job.company_name, job.candidate_required_location, job.url);
        });

        remoteJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
    } finally {
      hideLoading();
    }
  }

  // --- FETCH LOCAL JOBS ---
  async function fetchLocalJobs(country = "us", search = "") {
    try {
      if (!SUPPORTED_COUNTRIES.includes(country)) {
        localJobsDiv.innerHTML = "<p>⚠️ Local job search not available in this country.</p>";
        return;
      }

      showLoading();
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`
      );
      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();

      localJobsDiv.innerHTML = "";
      data.results.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company.display_name} – ${job.location.display_name}<br>
          <a href="${job.redirect_url}" target="_blank">Apply Now</a><br>
          <button class="save-job-btn">💾 Save Job</button>
        `;

        jobDiv.querySelector(".save-job-btn").addEventListener("click", () => {
          saveJob(job.title, job.company.display_name, job.location.display_name, job.redirect_url);
        });

        localJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    } finally {
      hideLoading();
    }
  }

  // --- SAVE JOB FUNCTION ---
  async function saveJob(title, company, location, url) {
    const data = await chrome.storage.local.get(["savedJobs"]);
    let savedJobs = data.savedJobs || [];

    if (savedJobs.length >= 4) {
      alert("⚠️ Free version limit reached. You can only save 4 jobs every 30 days.");
      return;
    }

    savedJobs.push({
      title,
      company,
      location,
      url,
      savedAt: new Date().toISOString()
    });

    await chrome.storage.local.set({ savedJobs });
    loadSavedJobs();
  }

  // --- DELETE A SAVED JOB ---
  async function deleteJob(index) {
    const data = await chrome.storage.local.get(["savedJobs"]);
    let savedJobs = data.savedJobs || [];

    savedJobs.splice(index, 1); // remove by index
    await chrome.storage.local.set({ savedJobs });

    loadSavedJobs(); // refresh list
  }

  // --- LOAD SAVED JOBS ---
  async function loadSavedJobs() {
    const data = await chrome.storage.local.get(["savedJobs"]);
    const savedJobs = data.savedJobs || [];

    savedJobsList.innerHTML = "";
    if (savedJobs.length === 0) {
      savedJobsList.innerHTML = "<p>No saved jobs yet.</p>";
    } else {
      savedJobs.forEach((job, index) => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company} – ${job.location}<br>
          <a href="${job.url}" target="_blank">Apply Now</a><br>
          <small>Saved on: ${new Date(job.savedAt).toLocaleDateString()}</small><br>
          <button class="delete-job-btn">🗑️ Delete</button>
        `;

        jobDiv.querySelector(".delete-job-btn").addEventListener("click", () => {
          deleteJob(index);
        });

        savedJobsList.appendChild(jobDiv);
      });
    }

    updateSavedCounter(savedJobs.length);
  }

  // --- COUNTER ---
  function updateSavedCounter(count) {
    savedJobsCounter.textContent = `${count}/4 this month`;
  }

  // --- GET STARTED BUTTON ---
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      console.log("Get Started button clicked 🎉");

      if (welcomeScreen) welcomeScreen.style.display = "none";
      if (jobBoard) jobBoard.style.display = "block";

      fetchRemoteJobs();
      fetchLocalJobs(countrySelect ? countrySelect.value : "us");
      loadSavedJobs();
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
    });
  }
});





      