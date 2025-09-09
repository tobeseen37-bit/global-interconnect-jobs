document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");
  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");
  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const searchBtn = document.getElementById("search-btn");
  const loadingMessage = document.getElementById("loading-message");

  // Saved jobs
  const savedJobsSection = document.getElementById("saved-jobs-section");
  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  // Modal
  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

  // --- API CONFIG ---
  const ADZUNA_APP_ID = "b39ca9ec";
  const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

  // --- Helpers for Saved Jobs ---
  function getSavedJobs() {
    return JSON.parse(localStorage.getItem("savedJobs")) || [];
  }

  function saveJobsToStorage(jobs) {
    localStorage.setItem("savedJobs", JSON.stringify(jobs));
  }

  function updateSavedJobsUI() {
    const jobs = getSavedJobs();
    savedJobsList.innerHTML = "";
    jobs.forEach((job, index) => {
      const jobDiv = document.createElement("div");
      jobDiv.className = "saved-job";
      jobDiv.innerHTML = `
        <strong>${job.title}</strong> – ${job.company}<br>
        <a href="${job.url}" target="_blank">Apply Now</a>
        <span class="delete-btn" data-index="${index}">❌ Delete</span>
      `;
      savedJobsList.appendChild(jobDiv);
    });
    savedJobsCounter.textContent = `${jobs.length}/4 this month`;

    // Attach delete handlers
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = e.target.dataset.index;
        const updatedJobs = getSavedJobs();
        updatedJobs.splice(idx, 1);
        saveJobsToStorage(updatedJobs);
        updateSavedJobsUI();
      });
    });
  }

  function trySaveJob(job) {
    const jobs = getSavedJobs();
    if (jobs.length >= 4) {
      alert("⚠️ Free users can only save 4 jobs per month. Upgrade for unlimited saves!");
      return;
    }
    jobs.push(job);
    saveJobsToStorage(jobs);
    updateSavedJobsUI();
  }

  // --- Modal Handling ---
  function openJobModal(job) {
    modalBody.innerHTML = `
      <div class="modal-header">${job.title}</div>
      <p><strong>${job.company}</strong> – ${job.location}</p>
      <p>${job.description || "No description available."}</p>
      <a href="${job.url}" target="_blank"><button>Apply Now</button></a>
      <button id="modal-save-btn">Save Job</button>
    `;
    jobModal.style.display = "flex";

    // Save handler inside modal
    const saveBtn = document.getElementById("modal-save-btn");
    saveBtn.addEventListener("click", () => {
      trySaveJob(job);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      jobModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === jobModal) {
      jobModal.style.display = "none";
    }
  });

  // --- FETCH REMOTE JOBS ---
  async function fetchRemoteJobs(search = "") {
    try {
      loadingMessage.style.display = "block";
      const response = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(search)}`);
      const data = await response.json();

      remoteJobsDiv.innerHTML = "";
      data.jobs.slice(0, 10).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company_name} – ${job.candidate_required_location}
        `;
        jobDiv.addEventListener("click", () => {
          openJobModal({
            title: job.title,
            company: job.company_name,
            location: job.candidate_required_location,
            description: job.description,
            url: job.url
          });
        });
        remoteJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching remote jobs:", error);
      remoteJobsDiv.innerHTML = "<p>⚠️ Failed to load remote jobs.</p>";
    } finally {
      loadingMessage.style.display = "none";
    }
  }

  // --- FETCH LOCAL JOBS ---
  async function fetchLocalJobs(country = "us", search = "") {
    try {
      loadingMessage.style.display = "block";
      const response = await fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(search)}`
      );
      if (!response.ok) throw new Error("Failed to fetch Adzuna jobs.");
      const data = await response.json();

      localJobsDiv.innerHTML = "";
      data.results.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong><br>
          ${job.company.display_name} – ${job.location.display_name}
        `;
        jobDiv.addEventListener("click", () => {
          openJobModal({
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            description: job.description,
            url: job.redirect_url
          });
        });
        localJobsDiv.appendChild(jobDiv);
      });
    } catch (error) {
      console.error("Error fetching local jobs:", error);
      localJobsDiv.innerHTML = "<p>⚠️ Failed to load local jobs.</p>";
    } finally {
      loadingMessage.style.display = "none";
    }
  }

  // --- GET STARTED BUTTON ---
  if (viewJobsBtn) {
    viewJobsBtn.addEventListener("click", () => {
      console.log("Get Started button clicked 🎉");
      if (welcomeScreen) welcomeScreen.style.display = "none";
      if (jobBoard) jobBoard.style.display = "block";

      fetchRemoteJobs();
      fetchLocalJobs(countrySelect ? countrySelect.value : "us");
      updateSavedJobsUI();
    });
  }

  // --- COUNTRY DROPDOWN ---
  if (countrySelect) {
    countrySelect.addEventListener("change", () => {
      fetchLocalJobs(countrySelect.value, jobSearchInput.value);
    });
  }

  // --- SEARCH BUTTON ---
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      const searchTerm = jobSearchInput.value;
      fetchRemoteJobs(searchTerm);
      fetchLocalJobs(countrySelect ? countrySelect.value : "us", searchTerm);
    });
  }
});
// Refactor popup layout and job fetching logic: improve saved jobs section, enhance loading message, and update country selection options for better user experience






      