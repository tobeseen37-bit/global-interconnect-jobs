document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup.js loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const remoteJobsContainer = document.getElementById("remote-jobs");
  const localJobsContainer = document.getElementById("local-jobs");
  const jobTypeFilter = document.getElementById("jobTypeFilter");

  // Check button
  console.log("viewJobsBtn:", viewJobsBtn);

  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", async () => {
      console.log("Get Started clicked 🚀");

      // Hide welcome screen, show job board
      welcomeScreen.style.display = "none";
      jobBoard.style.display = "block";

      // Fetch jobs after switching
      await fetchJobs();
    });
  }

  // Fetch jobs from both APIs
  async function fetchJobs() {
    remoteJobsContainer.innerHTML = "<p>Loading remote jobs...</p>";
    localJobsContainer.innerHTML = "<p>Loading local jobs...</p>";

    try {
      // --- Remotive API ---
      const remoteRes = await fetch("https://remotive.com/api/remote-jobs");
      const remoteData = await remoteRes.json();
      displayJobs(remoteData.jobs.slice(0, 5), remoteJobsContainer);

      // --- Adzuna API ---
      const adzunaAppId = "b39ca9ec";
      const adzunaAppKey = "d8f3335fc89f05e7a577c1cc468eebf1";
      const localRes = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=5`
      );
      const localData = await localRes.json();
      displayJobs(localData.results, localJobsContainer, true);

    } catch (err) {
      console.error("Error loading jobs:", err);
      remoteJobsContainer.innerHTML = "<p>Error loading remote jobs.</p>";
      localJobsContainer.innerHTML = "<p>Error loading local jobs.</p>";
    }
  }

  // Display jobs into container
  function displayJobs(jobs, container, isLocal = false) {
    container.innerHTML = "";
    if (!jobs || jobs.length === 0) {
      container.innerHTML = "<p>No jobs found.</p>";
      return;
    }

    jobs.forEach(job => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "job";
      jobDiv.innerHTML = `
        <strong>${isLocal ? job.title : job.title}</strong><br>
        ${isLocal ? job.company.display_name : job.company_name}<br>
        ${isLocal ? job.location.display_name : job.candidate_required_location}<br>
        <a href="${isLocal ? job.redirect_url : job.url}" target="_blank">Apply Now</a>
      `;
      container.appendChild(jobDiv);
    });
  }

  // Dropdown filter
  jobTypeFilter.addEventListener("change", () => {
    const filter = jobTypeFilter.value;
    if (filter === "all") {
      remoteJobsContainer.parentElement.style.display = "block";
      localJobsContainer.parentElement.style.display = "block";
    } else if (filter === "remote") {
      remoteJobsContainer.parentElement.style.display = "block";
      localJobsContainer.parentElement.style.display = "none";
    } else if (filter === "local") {
      remoteJobsContainer.parentElement.style.display = "none";
      localJobsContainer.parentElement.style.display = "block";
    }
  });
});
// --- IGNORE ---





      