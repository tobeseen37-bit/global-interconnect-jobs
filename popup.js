document.addEventListener("DOMContentLoaded", () => {
  const jobFeed = document.getElementById("job-feed");

  const jobs = [
    { title: "Frontend Developer", company: "TechCorp", link: "#" },
    { title: "Remote UX Designer", company: "Designify", link: "#" },
    { title: "Data Analyst", company: "Insight LLC", link: "#" },
    { title: "AI Engineer", company: "FutureAI", link: "#" },
    { title: "Customer Success Rep", company: "HelpHub", link: "#" },
    { title: "Backend Developer", company: "CodeWorks", link: "#" },
    { title: "Marketing Specialist", company: "AdStream", link: "#" },
    { title: "Project Manager", company: "BuildIt Inc.", link: "#" }
  ];

  jobs.forEach(job => {
    const div = document.createElement("div");
    div.classList.add("job-item");
    div.innerHTML = `
      <div class="job-title">${job.title}</div>
      <div class="job-company">${job.company}</div>
      <a class="job-link" href="${job.link}" target="_blank">View Job</a>

    `;
    jobFeed.appendChild(div);
  });
});

      
      