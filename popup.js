document.addEventListener("DOMContentLoaded", () => {
  const status = document.getElementById("status");
  const jobList = document.getElementById("job-list");

  // Show loading message
  status.textContent = "Loading jobs...";

  // Fetch jobs from jobs.json
  fetch(chrome.runtime.getURL("jobs.json"))
    .then(response => response.json())
    .then(jobs => {
      status.style.display = "none"; // hide loading message

      jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong>
          ${job.company} – ${job.location}
        `;
        jobList.appendChild(jobDiv);
      });
    })
    .catch(err => {
      status.textContent = "Error loading jobs.";
      console.error("Error fetching jobs:", err);
    });
});



      
      