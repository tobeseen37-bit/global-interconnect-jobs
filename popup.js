document.addEventListener("DOMContentLoaded", () => {
  const welcomeDiv = document.getElementById("welcome");
  const jobContainer = document.getElementById("job-container");
  const viewJobsBtn = document.getElementById("viewJobs");

  viewJobsBtn.addEventListener("click", async () => {
    welcomeDiv.style.display = "none";
    jobContainer.style.display = "block";

    const jobList = document.getElementById("job-list");
    jobList.innerHTML = "<p>Loading jobs...</p>";

    try {
      // --- Fetch remote jobs from Remotive ---
      const remotiveResponse = await fetch("https://remotive.com/api/remote-jobs");
      const remotiveData = await remotiveResponse.json();

      // --- Fetch global jobs from Adzuna ---
      const adzunaAppId = "your-app-id"; // Replace with your Adzuna App ID
      const adzunaAppKey = "d8f3335fc89f05e7a577c1cc468eebf1"; // Your new key
      const adzunaCountry = "us"; // Can change to "gb", "de", etc.

      const adzunaResponse = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${adzunaCountry}/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=5&what=developer`
      );
      const adzunaData = await adzunaResponse.json();

      jobList.innerHTML = ""; // Clear loading text

      // --- Display Remotive jobs ---
      remotiveData.jobs.slice(0, 5).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company_name} – ${job.candidate_required_location}<br>
          <a href="${job.url}" target="_blank">Apply</a>
        `;
        jobList.appendChild(jobDiv);
      });

      // --- Display Adzuna jobs ---
      if (adzunaData.results) {
        adzunaData.results.slice(0, 5).forEach(job => {
          const jobDiv = document.createElement("div");
          jobDiv.className = "job";
          jobDiv.innerHTML = `
            <strong>${job.title}</strong><br>
            ${job.company.display_name} – ${job.location.display_name}<br>
            <a href="${job.redirect_url}" target="_blank">Apply</a>
          `;
          jobList.appendChild(jobDiv);
        });
      } else {
        jobList.innerHTML += "<p>No Adzuna jobs found.</p>";
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      jobList.innerHTML = "<p>Error loading jobs. Please try again.</p>";
    }
  });
});








      
      