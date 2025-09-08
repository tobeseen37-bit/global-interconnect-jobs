console.log("Popup loaded ✅");

const viewJobsBtn = document.getElementById("viewJobsBtn");
const welcomeScreen = document.getElementById("welcome-screen");
const jobBoard = document.getElementById("job-board");
const remoteJobsDiv = document.getElementById("remote-jobs");
const localJobsDiv = document.getElementById("local-jobs");
const countrySelect = document.getElementById("country-select");
const jobSearchInput = document.getElementById("job-search");
const searchBtn = document.getElementById("search-btn");

// --- API CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

// --- FETCH REMOTE JOBS ---
async function fetchRemoteJobs(search = "") {
  try {
    const response = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`
    );
    const data = await response.json();

    remoteJobsDiv.innerHTML = "";
    if (data.jobs.length === 0) {
      remoteJobsDiv.innerHTML = "<p>No remote jobs found.</p>";
      return;
    }

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
    if (!data.results || data.results.length === 0) {
      localJobsDiv.innerHTML = "<p>No local jobs found.</p>";
      return;
    }

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
  }
}

// --- SEARCH FUNCTION ---
let searchTimeout;
function triggerSearch() {
  const searchTerm = jobSearchInput.value.trim();
  console.log("🔍 Searching for:", searchTerm, "in", countrySelect.value);

  fetchRemoteJobs(searchTerm);
  fetchLocalJobs(countrySelect.value, searchTerm);
}

// --- EVENT LISTENERS ---
// Get Started button
viewJobsBtn.addEventListener("click", () => {
  console.log("Get Started button clicked 🎉");

  welcomeScreen.style.display = "none";
  jobBoard.style.display = "block";

  fetchRemoteJobs();
  fetchLocalJobs(countrySelect.value);
});

// Search input debounce
jobSearchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(triggerSearch, 500);
});

// Search button click
searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  triggerSearch();
});

// Pressing Enter in search field
jobSearchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    triggerSearch();
  }
});
// Country selection change
countrySelect.addEventListener("change", () => {
  console.log("Country changed to:", countrySelect.value);
  triggerSearch();
}); 




      