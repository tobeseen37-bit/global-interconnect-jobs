document.addEventListener("DOMContentLoaded", () => {
  // Handle test button click
  const testBtn = document.getElementById("testBtn");
  if (testBtn) {
    testBtn.addEventListener("click", () => {
      alert("Extension test successful! 🚀");
    });
  }

  // Update status and check for updates
  const status = document.getElementById("status");
  if (status) {
    status.textContent = "Checking for updates...";
    chrome.runtime.sendMessage({ action: "checkUpdates" }, (response) => {
      status.textContent = response.message;
    });
  }

  // Render job listings
  const jobs = [
    { title: "Frontend Developer", company: "TechCorp", location: "Remote" },
    { title: "Data Entry Specialist", company: "BizAssist", location: "New York" },
    { title: "Customer Support Agent", company: "HelpDesk Inc.", location: "Remote" },
    { title: "Junior Web Designer", company: "Creative Studio", location: "Los Angeles" },
  ];

  const jobList = document.getElementById("job-list");
  if (jobList) {
    jobs.forEach(job => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "job";
      jobDiv.innerHTML = `
        <div class="job-title">${job.title}</div>
        <div class="company">${job.company} – ${job.location}</div>
      `;
              jobList.appendChild(jobDiv);
          });
        }
      });
      