document.addEventListener("DOMContentLoaded", () => {
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobListScreen = document.getElementById("job-list-screen");
  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const jobList = document.getElementById("job-list");

  // Your Adzuna credentials
  const appId = "b39ca9ec"; 
  const appKey = "d8f3335fc89f05e7a577c1cc468eebf1";

  // ✅ Fetch jobs from Remotive API
  async function fetchRemotiveJobs() {
    try {
      const response = await fetch("https://remotive.com/api/remote-jobs?limit=5");
      if (!response.ok) throw new Error("Remotive API error: " + response.statusText);
      const data = await response.json();
      return data.jobs.map(job => ({
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location,
        url: job.url,
        source: "Remotive"
      }));
    } catch (err) {
      console.error("Error fetching Remotive jobs:", err);
      return [];
    }
  }

  // ✅ Fetch jobs from Adzuna API
  async function fetchAdzunaJobs() {
    try {
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/us/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=5&what=developer`
      );
      if (!response.ok) throw new Error("Adzuna API error: " + response.statusText);
      const data = await response.json();

      if (!data.results) {
        console.error("Unexpected Adzuna response:", data);
        return [];
      }

      return data.results.map(job => ({
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        url: job.redirect_url,
        source: "Adzuna"
      }));
    } catch (err) {
      console.error("Error fetching Adzuna jobs:", err);
      return [];
    }
  }

  // ✅ Render jobs in the popup
  function renderJobs(jobs) {
    jobList.innerHTML = "";
    if (jobs.length === 0) {
      jobList.innerHTML = "<p>No jobs found. Try again later.</p>";
      return;
    }

    jobs.forEach(job => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "job";
      jobDiv.innerHTML = `
        <strong>${job.title}</strong><br>
        ${job.company} – ${job.location}<br>
        <a href="${job.url}" target="_blank">View Job</a><br>
        <small>Source: $
{job.source}</small>
      `;
      jobList.appendChild(jobDiv);
    });











      
  }

  // Show job list when button is clicked
  viewJobsBtn.addEventListener("click", async () => {
    welcomeScreen.style.display = "none";
    jobListScreen.style.display = "block";

    // Fetch jobs from both APIs
    const [remotiveJobs, adzunaJobs] = await Promise.all([
      fetchRemotiveJobs(),
      fetchAdzunaJobs()
    ]);
    const allJobs = [...remotiveJobs, ...adzunaJobs];
    renderJobs(allJobs);
  });
});
      