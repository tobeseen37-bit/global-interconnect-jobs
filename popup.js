// --- ADZUNA CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

// --- RENDER SERVER URL ---
const RENDER_SERVER = "https://remote-proxy.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  console.log("Popup loaded ✅");

  // --- DOM ELEMENTS ---
  const viewJobsBtn = document.getElementById("viewJobsBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const jobBoard = document.getElementById("job-board");

  const remoteJobsDiv = document.getElementById("remote-jobs");
  const localJobsDiv = document.getElementById("local-jobs");

  const countrySelect = document.getElementById("country-select");
  const jobSearchInput = document.getElementById("job-search");
  const cityInput = document.getElementById("city-input");
  const searchBtn = document.getElementById("search-btn");
  const visaCheckbox = document.getElementById("visa-checkbox");
  const loadingMessage = document.getElementById("loading-message");

  const savedJobsList = document.getElementById("saved-jobs-list");
  const savedJobsCounter = document.getElementById("saved-jobs-counter");

  const jobModal = document.getElementById("job-modal");
  const modalBody = document.getElementById("modal-body");
  const closeBtn = document.querySelector(".close-btn");

  let loadingRemote = false;
  let loadingLocal = false;

  // --- Saved Jobs Helpers ---
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

    document.querySelectorAll(".delete-btn").forEach((btn) => {
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
      alert("Upgrade to save more jobs."); 
      return;
    }
    jobs.push(job);
    saveJobsToStorage(jobs);
    updateSavedJobsUI();
  }

  // --- Job Modal ---
  function openJobModal(job) {
    modalBody.innerHTML = `
      <div class="modal-header">${job.title}</div>
      <p><strong>${job.company}</strong> – ${job.location}</p>
      <p>${job.description || "No description available."}</p>
      <a href="${job.url}" target="_blank"><button>Apply Now</button></a>
      <button id="modal-save-btn">Save Job</button>
    `;
    jobModal.style.display = "flex";

    const saveBtn = document.getElementById("modal-save-btn");
    saveBtn.addEventListener("click", () => trySaveJob(job));
  }

  if (closeBtn) closeBtn.addEventListener("click", () => (jobModal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === jobModal) jobModal.style.display = "none";
  });

  // --- Loading Message ---
  function updateLoadingMessage() {
    loadingMessage.style.display = loadingRemote || loadingLocal ? "block" : "none";
  }

  // --- Fetch Remote Jobs from Render ---
  async function fetchRemoteJobs(searchTerm = "") {
    try {
      loadingRemote = true;
      updateLoadingMessage();

      const endpoints = ["/remoteok", "/weworkremotely", "/remoteco"];
      let allRemoteJobs = [];

      for (const endpoint of endpoints) {
        const res = await fetch(RENDER_SERVER + endpoint);
        let jobs = [];

        if (endpoint === "/remoteok") {
          const data = await res.json();
          jobs = data.slice(1).map(job => ({
            title: job.position || job.title || "",
            company: job.company || "RemoteOK",
            url: job.url || "#",
            description: job.description || "",
            location: job.location || "Worldwide"
          }));
        } else {
          const text = await res.text();
          const parser = new DOMParser();
          const xml = parser.parseFromString(text, "application/xml");
          jobs = [...xml.querySelectorAll("item")].map(item => ({
            title: item.querySelector("title")?.textContent || "",
            company: endpoint === "/weworkremotely" ? 
                     (item.querySelector("title")?.textContent.split(":")[0] || "Unknown") : 
                     "Remote.co",
            url: item.querySelector("link")?.textContent || "#",
            description: item.querySelector("description")?.textContent || "",
            location: "Worldwide"
          }));
        }

        allRemoteJobs.push(...jobs);
      }

      // --- Filter by search term ---
      if (searchTerm) {
        const regex = new RegExp(searchTerm.split(/\s+/).join("|"), "i");
        allRemoteJobs = allRemoteJobs.filter(job =>
          regex.test(job.title) || regex.test(job.description)
        );
      }

      // --- Render ---
      remoteJobsDiv.innerHTML = "";
      if (!allRemoteJobs.length) {
        remoteJobsDiv.innerHTML = "<p>No remote jobs found.</p>";
        return;
      }

      allRemoteJobs.slice(0, 20).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong>
          <span class="badge badge-primary">Remote</span><br>
          ${job.company} – ${job.location}
        `;
        jobDiv.addEventListener("click", () => openJobModal(job));
        remoteJobsDiv.appendChild(jobDiv);
      });

    } catch (err) {
      console.error("Error fetching remote jobs:", err);
      remoteJobsDiv.innerHTML = "<p>Error fetching remote jobs.</p>";
    } finally {
      loadingRemote = false;
      updateLoadingMessage();
    }
  }

  // --- Fetch Local Jobs from Adzuna ---
  async function fetchLocalJobs(searchTerm = "", country = "us") {
    try {
      loadingLocal = true;
      updateLoadingMessage();

      let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(searchTerm)}`;
      if (cityInput.value.trim()) url += `&where=${encodeURIComponent(cityInput.value.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      const jobs = data.results || [];

      localJobsDiv.innerHTML = "";
      if (!jobs.length) {
        localJobsDiv.innerHTML = "<p>No local jobs found.</p>";
        return;
      }

      jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `
          <strong>${job.title}</strong>
          <span class="badge badge-success">Local</span><br>
          ${job.company.display_name} – ${job.location.display_name}
        `;
        jobDiv.addEventListener("click", () => openJobModal({
          title: job.title,
          company: job.company.display_name,
          location: job.location.display_name,
          description: job.description,
          url: job.redirect_url || job.application_uri
        }));
        localJobsDiv.appendChild(jobDiv);
      });

    } catch (err) {
      console.error("Error fetching local jobs:", err);
      localJobsDiv.innerHTML = "<p>Error fetching local jobs.</p>";
    } finally {
      loadingLocal = false;
      updateLoadingMessage();
    }
  }

  // --- Run Search ---
  function runSearch() {
    const searchTerm = jobSearchInput.value.trim();
    const selectedCountry = countrySelect.value || "us";

    fetchRemoteJobs(searchTerm);
    fetchLocalJobs(searchTerm, selectedCountry);
  }

  // --- Initialize ---
  updateSavedJobsUI();

  if (viewJobsBtn) viewJobsBtn.addEventListener("click", () => {
    welcomeScreen.style.display = "none";
    jobBoard.style.display = "block";
  });

  if (searchBtn) searchBtn.addEventListener("click", runSearch);
  if (countrySelect) countrySelect.addEventListener("change", runSearch);
  if (cityInput) {
    cityInput.addEventListener("input", () => {
      if (cityInput.value.trim().length > 2) runSearch();
    });
  }

  // --- Initial fetch ---
  fetchRemoteJobs("");
  fetchLocalJobs("", "us");
});
// --- IGNORE ---