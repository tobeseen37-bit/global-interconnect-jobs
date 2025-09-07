document.addEventListener("DOMContentLoaded", () => {
  const welcomeSection = document.getElementById("welcome-section");
  const jobSection = document.getElementById("job-section");
  const startBtn = document.getElementById("startBtn");

  const status = document.getElementById("status");
  const jobList = document.getElementById("job-list");
  const remoteTab = document.getElementById("remoteTab");
  const localTab = document.getElementById("localTab");

  // Your Adzuna credentials
  const ADZUNA_APP_ID = "your_app_id";
  const ADZUNA_APP_KEY = "your_app_key";

  // Function to render jobs
  function renderJobs(jobs) {
    jobList.innerHTML = "";
    if (!jobs || jobs.length === 0) {
      status.textContent = "No jobs found.";
      return;
    }
    status.textContent = `Found ${jobs.length} jobs`;
    jobs.forEach(job => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "job";
      jobDiv.innerHTML = `
        <h4>${job.title}</h4>
        <p>${job.company} – ${job.location}</p>
        <a href="${job.url}" target="_blank">Apply</a>
      `;
      jobList.appendChild(jobDiv);
    });
  }

  // Fetch remote jobs from Remotive
  async function fetchRemoteJobs() {
    status.textContent = "Loading remote jobs...";
    try {
      const res = await fetch("https://remotive.com/api/remote-jobs");
      const data = await res.json();
      const jobs = data.jobs.slice(0, 10).map(j => ({
        title: j.title,
        company: j.company_name,
        location: j.candidate_required_location,
        url: j.url
      }));
      renderJobs(jobs);
    } catch (err) {
      status.textContent = "Error fetching remote jobs.";
    }
  }

  // Fetch local jobs from Adzuna
  async function fetchLocalJobs() {
    status.textContent = "Loading local jobs...";
    try {
      const res = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10`
      );
      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
      const data = await res.json();
      const jobs = data.results.map(j => ({
        title: j.title,
        company: j.company.display_name,
        location: j.location.display_name,
        url: j.redirect_url
      }));
      renderJobs(jobs);
    } catch (err) {
      console.error("Adzuna error:", err);
      status.textContent = "Error fetching local jobs.";
    }
  }

  // Start button → show tabs + jobs
  startBtn.addEventListener("click", () => {
    welcomeSection.style.display = "none";
    jobSection.style.display = "block";
    fetchRemoteJobs(); // default load
  });

  // Tab switching
  remoteTab.addEventListener("click", () => {
    remoteTab.classList.add("active");
    localTab.classList.remove("active");
    fetchRemoteJobs();
  });

  localTab.addEventListener("click", () => {
    localTab.classList.add("active");
    remoteTab.classList.remove("active");
    fetchLocalJobs();
  });
});







      
      