const REMOTIVE_API = "https://remotive.com/api/remote-jobs";
const ADZUNA_API_BASE = "https://api.adzuna.com/v1/api/jobs";
const ADZUNA_APP_ID = "b39ca9ec";  // Your App ID
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";  // Your App Key

const getStartedBtn = document.getElementById("getStartedBtn");
const welcomeScreen = document.getElementById("welcome-screen");
const jobScreen = document.getElementById("job-screen");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const remoteJobsContainer = document.getElementById("remote-jobs");
const localJobsContainer = document.getElementById("local-jobs");

// Fetch remote jobs (Remotive)
async function fetchRemoteJobs(query = "") {
  try {
    let url = REMOTIVE_API;
    if (query) url += `?search=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.jobs.slice(0, 5).map(job => ({
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location,
      url: job.url
    }));
  } catch (err) {
    console.error("Failed to fetch remote jobs:", err);
    return [];
  }
}

// Fetch local jobs (Adzuna)
async function fetchLocalJobs(query = "", country = "us") {
  try {
    let url = `${ADZUNA_API_BASE}/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}`;
    if (query) url += `&what=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results.slice(0, 5).map(job => ({
      title: job.title,
      company: job.company.display_name,
      location: job.location.display_name,
      url: job.redirect_url
    }));
  } catch (err) {
    console.error("Failed to fetch local jobs:", err);
    return [];
  }
}

// Render jobs into UI
function renderJobs(container, jobs) {
  container.innerHTML = "";
  if (!jobs.length) {
    container.innerHTML = "<p>No jobs found.</p>";
    return;
  }
  jobs.forEach(job => {
    const card = document.createElement("div");
    card.className = "job-card";
    card.innerHTML = `
      <h3>${job.title}</h3>
      <p><strong>${job.company}</strong></p>
      <p>${job.location}</p>
      <a href="${job.url}" target="_blank" class="apply-link">Apply Now</a>
    `;
    container.appendChild(card);
  });
}

// Load jobs (both APIs)
async function loadJobs(query = "") {
  remoteJobsContainer.innerHTML = "<p>Loading remote jobs...</p>";
  localJobsContainer.innerHTML = "<p>Loading local jobs...</p>";

  const [remoteJobs, localJobs] = await Promise.all([
    fetchRemoteJobs(query),
    fetchLocalJobs(query, "us") // you can change "us" to other countries
  ]);

  renderJobs(remoteJobsContainer, remoteJobs);
  renderJobs(localJobsContainer, localJobs);
}

// Event listeners
getStartedBtn.addEventListener("click", () => {
  welcomeScreen.style.display = "none";
  jobScreen.style.display = "block";
  loadJobs();
});

searchBtn.addEventListener("click", () => {
  const query = searchInput.value.trim();
  loadJobs(query);
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const query = searchInput.value.trim();
    loadJobs(query);
  }
});




      