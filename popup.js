document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobsScreen = document.getElementById("jobs-screen");
  const jobList = document.getElementById("job-list");

  // Example jobs (fake data for now)
  const jobs = [
    { title: "Frontend Developer", company: "TechCorp", location: "Remote" },
    { title: "Data Entry Specialist", company: "BizAssist", location: "New York" },
    { title: "Customer Support Agent", company: "HelpDesk Inc.", location: "Remote" },
    { title: "Junior Web Designer", company: "Creative Studio", location: "Los Angeles" },
  ];

  // Show job list when "View Jobs" is clicked
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      welcomeScreen.style.display = "none";
      jobsScreen.style.display = "block";

      // Render jobs dynamically
      jobList.innerHTML = ""; // clear old jobs
      jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <h3>${job.title}</h3>
          <p>${job.company} – ${job.location}</p>
        `;
        jobList.appendChild(jobDiv);
      });
    });
  }
});




      
      