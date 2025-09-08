document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");
  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const loadingDiv = document.getElementById("loading");

  // --- API CONFIG ---
  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  // Only supported Adzuna countries
  const supportedCountries = [
    "us","gb","ca","au","de","fr","es","it","nl",
    "br","za","pl","ru","in","sg","be","ch","mx","nz"
  ];

  // --- SHOW LOADING ---
  function showLoading() {
    loadingDiv.style.display = "block";
  }
  function hideLoading() {
    loadingDiv.style.display = "none";
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
          <a href="${job.url}" target="_blank">Apply Now</a>
        `;
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
    if (!supportedCountries.includes(country)) {
      localJobsDiv.innerHTML = "<p>⚠️ Local job search not available for the selected country.</p>";
      return;
    }

    try {
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
          <a href="${job.redirect_url}" target="_blank">Apply Now</a>
        `;
        localJobsDiv.appendChild(jobDiv);
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
      if (jobBoard) jobBoard.style.display = "block";

      // Initial load
      fetchRemoteJobs();
      fetchLocalJobs(countrySelect.value);
    });
  }

  // --- COUNTRY DROPDOWN ---
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      fetchLocalJobs(countrySelect.value, jobSearchInput.value);
    });
  }

  // --- SEARCH INPUT ---
  if (jobSearchInput) {
    jobSearchInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const searchTerm = jobSearchInput.value;
        fetchRemoteJobs(searchTerm);
        fetchLocalJobs(countrySelect.value, searchTerm);
      }
    });
  }
});
// --- IGNORE ---




      