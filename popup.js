document.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobListScreen = document.getElementById("job-list-screen");
  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");

  async function fetchJobs() {
    try {
      // 🌍 Remote Jobs (Remotive)
      const remotiveRes = await fetch("https://remotive.com/api/remote-jobs");
      const remotiveData = await remotiveRes.json();

      remoteJobsDiv.innerHTML = "";
      remotiveData.jobs.slice(0, 5).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong><a href="${job.url}" target="_blank" rel="noopener noreferrer">
            ${job.title}
          </a></strong><br>
          ${job.company_name} – ${job.candidate_required_location}
        `;
        remoteJobsDiv.appendChild(jobDiv);
      });

      // 📍 Local Jobs (Adzuna)
      const adzunaAppId = "b39ca9ec";
      const adzunaAppKey = "d8f3335fc89f05e7a577c1cc468eebf1";
      const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&results_per_page=5`;

      const adzunaRes = await fetch(adzunaUrl);
      if (!adzunaRes.ok) throw new Error("Failed to fetch Adzuna jobs");
      const adzunaData = await adzunaRes.json();

      localJobsDiv.innerHTML = "";
      adzunaData.results.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong><a href="${job.redirect_url}" target="_blank" rel="noopener noreferrer">
            ${job.title}
          </a></strong><br>
          ${job.company.display_name} – ${job.location.display_name}
        `;
        localJobsDiv.appendChild(jobDiv);
      });

    } catch (err) {
      console.error("Error loading jobs:", err);
      remoteJobsDiv.innerHTML = `<p style="color:red;">Error fetching remote jobs.</p>`;
      localJobsDiv.innerHTML = `<p style="color:red;">Error fetching local jobs.</p>`;
    }
  }

  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", async () => {
      welcomeScreen.style.display = "none";
      jobListScreen.style.display = "block";
      await fetchJobs();
    });
  } else {
    console.error("⚠️ viewJobsBtn not found in DOM");
  }
});



      