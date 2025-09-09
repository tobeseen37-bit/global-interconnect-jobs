document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const savedJobsScreen = document.getElementById("saved-jobs-screen");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");
  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const searchBtn = document.getElementById("search-btn");
  const loadingMessage = document.getElementById("loading-message");
  const viewSavedJobsBtn = document.getElementById("viewSavedJobsBtn");
  const backToJobsBtn = document.getElementById("backToJobsBtn");
  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedCounter = document.getElementById("saved-counter");

  // --- API CONFIG ---
  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";
  const MAX_FREE_SAVES = 4;

  // --- UTILS ---
  function showLoading(show) {
    loadingMessage.style.display = show ? "block" : "none";
  }

  function createJobElement(job, isRemote = false) {
    const jobDiv = document.createElement("div");
    jobDiv.className = "job";
    const jobUrl = isRemote ? job.url : job.redirect_url;
    const company = isRemote ? job.company_name : job.company.display_name;
    const location = isRemote ? job.candidate_required_location : job.location.display_name;

    jobDiv.innerHTML = `
      <strong>${job.title}</strong><br>
      ${company} – ${location}<br>
      <a href="${jobUrl}" target="_blank">Apply Now</a><br>
      <button class="save-job-btn">⭐ Save Job</button>
    `;

    jobDiv.querySelector(".save-job-btn").addEventListener("click", () => {
      saveJob({
        title: job.title,
        company,
        location,
        url: jobUrl,
        savedAt: new Date().toISOString()
      });
    });

    return jobDiv;
  }

  // --- FAVORITES STORAGE ---
  async function saveJob(job) {
    const data = await chrome.storage.local.get(["savedJobs"]);
    let savedJobs = data.savedJobs || [];

    // filter out jobs older than 30 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    savedJobs = savedJobs.filter(j => new Date(j.savedAt) > cutoff);

    if (savedJobs.length >= MAX_FREE_SAVES) {
      alert("⚠️ Free limit reached: Only 4 jobs can be saved every 30 days. Upgrade for unlimited saves.");
      return;
    }

    savedJobs.push(job);
    await chrome.storage.local.set({ savedJobs });
    alert("✅ Job saved!");
    updateSavedCounter(savedJobs.length);
  }

  async function loadSavedJobs() {
    const data = await chrome.storage.local.get(["savedJobs"]);
    const savedJobs = data.savedJobs || [];

    savedJobsList.innerHTML = "";
    if (savedJobs.length === 0) {
      savedJobsList.innerHTML = "<p>No saved jobs yet.</p>";
    } else {
      savedJobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company} – ${job.location}<br>
          <a href="${job.url}" target="_blank">Apply Now</a><br>
          <small>Saved on: ${new Date(job.savedAt).toLocaleDateString()}</small>
        `;
        savedJobsList.appendChild(jobDiv);
      });
    }

    updateSavedCounter(savedJobs.length);
  }

  function updateSavedCounter(count) {
    savedCounter.textContent = `Saved Jobs: ${count}/${MAX_FREE_SAVES} this month`;
  }

  // --- FETCH REMOTE JOBS ---
  async function fetchRemoteJobs(search = "") {
    try {
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      remoteJobsDiv.innerHTML = "";
      data.jobs.slice(0, 10).forEach(job => {
        remoteJobsDiv.appendChild(createJobElement(job, true));
      });
    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
    }
  }

  // --- FETCH LOCAL JOBS ---
  async function fetchLocalJobs(country = "us", search = "") {
    try {
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`
      );
      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();

      localJobsDiv.innerHTML = "";
      data.results.forEach(job => {
        localJobsDiv.appendChild(createJobElement(job, false));
      });
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    }
  }

  // --- GET STARTED BUTTON ---
  viewJobsBtn.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    jobBoard.style.display = "block";
    fetchRemoteJobs();
    fetchLocalJobs(countrySelect.value);
  });

  // --- COUNTRY DROPDOWN ---
  countrySelect.addEventListener("change", () => {
    showLoading(true);
    fetchLocalJobs(countrySelect.value, jobSearchInput.value).finally(() => showLoading(false));
  });

  // --- SEARCH BUTTON ---
  searchBtn.addEventListener("click", () => {
    const searchTerm = jobSearchInput.value;
    showLoading(true);
    Promise.all([
      fetchRemoteJobs(searchTerm),
      fetchLocalJobs(countrySelect.value, searchTerm)
    ]).finally(() => showLoading(false));
  });

  // --- VIEW SAVED JOBS ---
  viewSavedJobsBtn.addEventListener("click", () => {
    jobBoard.style.display = "none";
    savedJobsScreen.style.display = "block";
    loadSavedJobs();
  });

  // --- BACK TO LISTINGS ---
  backToJobsBtn.addEventListener("click", () => {
    savedJobsScreen.style.display = "none";
    jobBoard.style.display = "block";
  });
});




      