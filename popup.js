document.getElementById("testBtn").addEventListener("click", () => {
  alert("Extension test successful! 🚀");
});  const status = document.getElementById("status");
  if (status) {
    status.textContent = "Checking for updates...";
  }
  chrome.runtime.sendMessage({ action: "checkUpdates" }, (response) => {
    if (status) {
      status.textContent = response.message;
    }
  });
