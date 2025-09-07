chrome.runtime.onInstalled.addListener(() => {
  console.log("Global Inter-Connect Jobs Extension installed.");
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkUpdates") {
    // Simulate checking for updates
    setTimeout(() => {
      sendResponse({ updatesAvailable: true });
    }, 1000);
    } else if (request.action === "installUpdates") {
      // Simulate installing updates
      setTimeout(() => {
        sendResponse({ updatesInstalled: true });
      }, 1000);
    }
    // Required to indicate you wish to send a response asynchronously
    return true;
  });