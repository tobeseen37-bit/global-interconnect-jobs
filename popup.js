document.addEventListener("DOMContentLoaded", () => {
  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeSection = document.getElementById("welcome");
  const jobSection = document.getElementById("job-section");
  const jobList = document.getElementById("job-list");

  console.log("Button found?", viewJobsBtn); // Debugging check

  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", async () => {
      // Show jobs section, hide welcome
      welcomeSection.style.display = "none";
      jobSection.style.display = "block";

      // Load jobs from both APIs
      jobList.innerHTML = "<p>Loading jobs...</p>";

      try {
        const [remoteJobs, localJobs] = await Promise.all([
          fetchRemotiveJobs(),
          fetchAdzunaJobs()
        ]);

        jobList.innerHTML = ""; // clear "loading"

        [...remoteJobs, ...localJobs].forEach(job => {
          const jobDiv = document.createElement("div");
          jobDiv.className = "job";
          jobDiv.innerHTML = `
            <strong>${job.title}</strong><br>
            ${job.company} – ${job.location}<br>
            <a href="${job.url}" target="_blank">View Job</a>
          `;
          jobList.appendChild(jobDiv);
        });

      } catch (error) {
        jobList.innerHTML = `<p style="color:red;">Error loading jobs: ${error.message}</p>`;
      }
    });
  } else {
    console.error("⚠️ viewJobsBtn not found in DOM!");
  }
});

// --- Fetch Remote Jobs (Remotive API) ---
async function fetchRemotiveJobs() {
  const url = "https://remotive.com/api/remote-jobs?limit=5";
  const response = await fetch(url);
  const data = await response.json();
  return data.jobs.map(job => ({
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location,
    url: job.url
  }));
}

// --- Fetch Local Jobs (Adzuna API) ---
async function fetchAdzunaJobs() {
  const appId = "your-app-id"; // Replace with your actual App ID
  const appKey = "d8f3335fc89f05e7a577c1cc468eebf1"; // ✅ your key
  const url = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=5&what=developer`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch Adzuna jobs");

  const data = await response.json();
  return data.results.map(job => ({
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    url: job.redirect_url
  }));
}











      
      