document.addEventListener("DOMContentLoaded", () => {
  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeSection = document.getElementById("welcome");
  const jobSection = document.getElementById("job-section");
  const jobList = document.getElementById("job-list");

  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", async () => {
      // Hide welcome, show jobs
      welcomeSection.style.display = "none";
      jobSection.style.display = "block";

      // Fetch jobs
      jobList.innerHTML = "<p>Loading jobs...</p>";
      await fetchJobs();
    });
  }

  async function fetchJobs() {
    jobList.innerHTML = ""; // Clear old jobs

    try {
      // 1. Get remote jobs from Remotive
      const remotiveResponse = await fetch("https://remotive.com/api/remote-jobs");
      const remotiveData = await remotiveResponse.json();
      const remotiveJobs = remotiveData.jobs.slice(0, 5);

      remotiveJobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <h3>${job.title}</h3>
          <p>${job.company_name} – ${job.candidate_required_location}</p>
          <a href="${job.url}" target="_blank">View Job</a>
        `;
        jobList.appendChild(jobDiv);
      });

      // 2. Get global jobs from Adzuna
      const adzunaAppId = "YOUR_APP_ID"; // replace with your Adzuna App ID
      const adzunaAppKey = "d8f3335fc89f05e7a577c1cc468eebf1"; // your key
      const country = "us"; // you can change dynamically later

      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}`;

      const adzunaResponse = await fetch(adzunaUrl);
      const adzunaData = await adzunaResponse.json();

      if (adzunaData.results) {
        adzunaData.results.slice(0, 5).forEach(job => {
          const jobDiv = document.createElement("div");
          jobDiv.className = "job";
          jobDiv.innerHTML = `
            <h3>${job.title}</h3>
            <p>${job.company.display_name} – ${job.location.display_name}</p>
            <a href="${job.redirect_url}" target="_blank">View Job</a>
          `;
          jobList.appendChild(jobDiv);
        });
      } else {
        jobList.innerHTML += "<p>⚠️ Could not load Adzuna jobs.</p>";
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      jobList.innerHTML = "<p>⚠️ Failed to fetch jobs. Try again later.</p>";
    }
  }
});









      
      