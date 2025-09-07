async function fetchJobs() {
  try {
    const response = await fetch("https://remotive.com/api/remote-jobs");
    const data = await response.json();
    return data.jobs.slice(0, 10); // Get first 10 jobs
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobsScreen = document.getElementById("jobs-screen");
  const jobList = document.getElementById("job-list");

  if (startBtn) {
    startBtn.addEventListener("click", async () => {
      welcomeScreen.style.display = "none";
      jobsScreen.style.display = "block";

      jobList.innerHTML = "<p>Loading jobs...</p>";

      const jobs = await fetchJobs();
      jobList.innerHTML = ""; // Clear "Loading..."

      if (jobs.length === 0) {
        jobList.innerHTML = "<p>No jobs found. Please try again later.</p>";
      }

      jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <h3>${job.title}</h3>
          <p>${job.company_name} – ${job.candidate_required_location}</p>
          <a href="${job.url}" target="_blank">View Job</a>
        `;
        jobList.appendChild(jobDiv);
      });
    });
  }
});





      
      