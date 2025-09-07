chrome.runtime.onInstalled.addListener(() => {
  console.log("Global Inter-Connect Jobs Extension installed.");
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkUpdates") {
    // Simulate checking for updates
    setTimeout(() => {
      sendResponse({ message: "Updates are available." });
    }, 1000);
    }
    // Required to indicate you wish to send a response asynchronously
    return true;
  });