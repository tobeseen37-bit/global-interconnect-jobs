document.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");
  const countrySelect = document.getElementById("country-select");
  const jobSearch = document.getElementById("job-search");

  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  let remoteJobs = [];
  let localJobs = [];

  // Fetch remote jobs (Remotive API)
  async function fetchRemoteJobs() {
    try {
      const res = await fetch("https://remotive.com/api/remote-jobs");
      const data = await res.json();
      remoteJobs = data.jobs || [];
      renderJobs();
    } catch (err) {
      console.error("Error fetching remote jobs:", err);
      remoteJobsDiv.innerHTML = `<p>Error fetching remote jobs.</p>`;
    }
  }

  // Fetch local jobs (Adzuna API)
  async function fetchLocalJobs(country = "us") {
    try {
      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}`
      );
      const data = await res.json();
      localJobs = data.results || [];
      renderJobs();
    } catch (err) {
      console.error("Error fetching local jobs:", err);
      localJobsDiv.innerHTML = `<p>Error fetching local jobs.</p>`;
    }
  }

  // Render jobs with search filter
  function renderJobs() {
    const query = jobSearch.value.toLowerCase();

    // Remote jobs
    remoteJobsDiv.innerHTML = "";
    remoteJobs
      .filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.company_name.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .forEach((job) => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company_name} – Remote<br>
          <a href="${job.url}" target="_blank">Apply Now</a>
        `;
        remoteJobsDiv.appendChild(jobDiv);
      });

    // Local jobs
    localJobsDiv.innerHTML = "";
    localJobs
      .filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          (job.company.display_name &&
            job.company.display_name.toLowerCase().includes(query))
      )
      .slice(0, 5)
      .forEach((job) => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company.display_name || "Unknown"} – ${
          job.location.display_name || "N/A"
        }<br>
          <a href="${job.redirect_url}" target="_blank">Apply Now</a>
        `;
        localJobsDiv.appendChild(jobDiv);
      });
  }

  // When Get Started is clicked
  viewJobsBtn.addEventListener("click", async () => {
    welcomeScreen.style.display = "none";
    jobBoard.style.display = "block";
    await fetchRemoteJobs();
    await fetchLocalJobs(countrySelect.value);
  });

  // Refetch local jobs when country changes
  countrySelect.addEventListener("change", () => {
    fetchLocalJobs(countrySelect.value);
  });

  // Filter jobs on search input
  jobSearch.addEventListener("input", renderJobs);
});
// --- IGNORE ---





      