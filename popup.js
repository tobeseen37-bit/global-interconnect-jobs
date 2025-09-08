document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcomeScreen");
  const jobScreen = document.getElementById("jobScreen");
  const remoteJobsDiv = document.getElementById("remoteJobs");
  const localJobsDiv = document.getElementById("localJobs");
  const countrySelect = document.getElementById("countrySelect");
  const jobTitleInput = document.getElementById("jobTitleInput");
  const searchBtn = document.getElementById("searchBtn");
  const loadingDiv = document.getElementById("loading");

  // --- API CONFIG ---
  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  // --- Show loading spinner ---
  function showLoading() {
    if (loadingDiv) loadingDiv.style.display = "block";
  }

  // --- Hide loading spinner ---
  function hideLoading() {
    if (loadingDiv) loadingDiv.style.display = "none";
  }

  // --- FETCH REMOTE JOBS ---
  async function fetchRemoteJobs(search = "") {
    try {
      showLoading();
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      remoteJobsDiv.innerHTML = "";
      data.jobs.slice(0, 10).forEach(job => {
        const jobItem = document.createElement("li");
        jobItem.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company_name} – ${job.candidate_required_location}<br>
          <a href="${job.url}" target="_blank">Apply Now</a>
        `;
        remoteJobsDiv.appendChild(jobItem);
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
      showLoading();
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`
      );
      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();

      localJobsDiv.innerHTML = "";
      data.results.forEach(job => {
        const jobItem = document.createElement("li");
        jobItem.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company.display_name} – ${job.location.display_name}<br>
          <a href="${job.redirect_url}" target="_blank">Apply Now</a>
        `;
        localJobsDiv.appendChild(jobItem);
      });
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    } finally {
      hideLoading();
    }
  }

  // --- GET STARTED BUTTON ---
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      console.log("Get Started button clicked 🎉");

      if (welcomeScreen) welcomeScreen.style.display = "none";
      if (jobScreen) jobScreen.style.display = "block";

      fetchRemoteJobs();
      fetchLocalJobs(countrySelect ? countrySelect.value : "us");
    });
  } else {
    console.error("⚠️ viewJobsBtn not found in DOM");
  }

  // --- COUNTRY DROPDOWN ---
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      fetchLocalJobs(countrySelect.value, jobTitleInput.value);
    });
  }

  // --- SEARCH BUTTON ---
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchTerm = jobTitleInput.value.trim();
      fetchRemoteJobs(searchTerm);
      fetchLocalJobs(countrySelect ? countrySelect.value : "us", searchTerm);
    });
  }
});
// --- IGNORE ---




      