// --- ADZUNA CONFIG ---
const ADZUNA_APP_ID = "b39ca9ec";
const ADZUNA_APP_KEY = "d8f3335fc89f05e7a577c1cc468eebf1";

// --- RENDER SERVER URL ---
const RENDER_SERVER = "https://remote-proxy.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
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

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", e => {
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
  window.addEventListener("click", e => { if (e.target === jobModal) jobModal.style.display = "none"; });

  function updateLoadingMessage() {
    loadingMessage.style.display = loadingRemote || loadingLocal ? "block" : "none";
  }

  // --- Fetch Remote Jobs ---
  async function fetchRemoteJobs(searchTerm) {
    try {
      loadingRemote = true;
      updateLoadingMessage();

      // RemoteOK
      const remoteOkRes = await fetch(`${RENDER_SERVER}/remoteok`);
      let remoteOkData = await remoteOkRes.json();
      let remoteJobs = [];
      if (Array.isArray(remoteOkData)) {
        remoteJobs = remoteOkData.slice(1);
      } else {
        console.error("RemoteOK returned unexpected data:", remoteOkData);
      }

      // WeWorkRemotely
      const wwrRes = await fetch(`${RENDER_SERVER}/weworkremotely`);
      const wwrText = await wwrRes.text();
      const parser = new DOMParser();
      const wwrXML = parser.parseFromString(wwrText, "application/xml");
      const wwrJobs = [...wwrXML.querySelectorAll("item")].map(item => ({
        title: item.querySelector("title")?.textContent || "",
        company: item.querySelector("title")?.textContent.split(":")[0] || "Unknown",
        url: item.querySelector("link")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
        location: "Worldwide"
      }));

      // Remote.co
      const rcRes = await fetch(`${RENDER_SERVER}/remoteco`);
      const rcText = await rcRes.text();
      const rcXML = parser.parseFromString(rcText, "application/xml");
      const rcJobs = [...rcXML.querySelectorAll("item")].map(item => ({
        title: item.querySelector("title")?.textContent || "",
        company: "Remote.co",
        url: item.querySelector("link")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
        location: "Worldwide"
      }));

      let allRemoteJobs = [...remoteJobs, ...wwrJobs, ...rcJobs];

      if (searchTerm) {
        const regex = new RegExp(searchTerm.split(/\s+/).join("|"), "i");
        allRemoteJobs = allRemoteJobs.filter(job => regex.test(job.title) || regex.test(job.description));
      }

      remoteJobsDiv.innerHTML = "";
      if (!allRemoteJobs.length) remoteJobsDiv.innerHTML = "<p>No remote jobs found.</p>";

      allRemoteJobs.slice(0, 20).forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `<strong>${job.title}</strong> <span class="badge badge-remote">Remote</span><br>${job.company} – ${job.location}`;
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

  // --- Fetch Local Jobs ---
  async function fetchLocalJobs(searchTerm, country) {
    try {
      loadingLocal = true;
      updateLoadingMessage();

      let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what=${encodeURIComponent(searchTerm)}`;
      if (cityInput.value.trim()) url += `&where=${encodeURIComponent(cityInput.value.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      const jobs = data.results || [];

      localJobsDiv.innerHTML = "";
      if (!jobs.length) localJobsDiv.innerHTML = "<p>No local jobs found.</p>";

      jobs.forEach(job => {
        const jobDiv = document.createElement("div");
        jobDiv.className = "job";
        jobDiv.innerHTML = `<strong>${job.title}</strong> <span class="badge badge-local">Local</span><br>${job.company.display_name} – ${job.location.display_name}`;
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
    cityInput.addEventListener("input", () => { if (cityInput.value.trim().length > 2) runSearch(); });
  }

  // Initial fetch with defaults
  fetchRemoteJobs("");
  fetchLocalJobs("", "us");
});

