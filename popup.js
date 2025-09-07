document.addEventListener("DOMContentLoaded", () => {
  const jobs = [
    { title: "Frontend Developer", company: "TechCorp", location: "Remote" },
    { title: "Data Entry Specialist", company: "BizAssist", location: "New York" },
    { title: "Customer Support Agent", company: "HelpDesk Inc.", location: "Remote" },
    { title: "Junior Web Designer", company: "Creative Studio", location: "Los Angeles" },
  ];

  const jobList = document.getElementById("job-list");
  if (!jobList) return; // Prevent error if element is missing

  jobs.forEach(job => {
    const jobDiv = document.createElement("div");
    jobDiv.className = "job";
    jobDiv.innerHTML = `
      <strong>${job.title}</strong><br>
      ${job.company} – ${job.location}
    `;
    jobList.appendChild(jobDiv);
  });
});

      
      