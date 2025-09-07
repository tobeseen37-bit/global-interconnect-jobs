document.getElementById("testBtn").addEventListener("click", () => {
  alert("Extension test successful! 🚀");
});
document.getElementById("checkUpdatesBtn").addEventListener("click", () => {
  const status = document.getElementById("status");
  status.textContent = "Checking for updates...";
  chrome.runtime.sendMessage({ action: "checkUpdates" }, (response) => {
    status.textContent = response.message;
  });
});