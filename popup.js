document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const pageCountInput = document.getElementById('pageCount');
  const statusDiv = document.getElementById('status');

  // Load saved state
  chrome.storage.local.get(['isVoting', 'voteStatus'], (result) => {
    if (result.isVoting) {
        statusDiv.textContent = result.voteStatus || 'Running...';
        startBtn.disabled = true;
    }
  });

  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "updateStatus") {
          statusDiv.textContent = request.message;
      } else if (request.action === "votingComplete") {
          statusDiv.textContent = "Finished!";
          startBtn.disabled = false;
      }
  });

  startBtn.addEventListener('click', () => {
    const pages = parseInt(pageCountInput.value, 10);
    
    if (!pages || pages < 1) {
      statusDiv.textContent = "Invalid page count.";
      return;
    }

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs[0].url.includes("steamcommunity.com")) {
            statusDiv.textContent = "Go to a Steam URL!";
            return;
        }

        // Initialize state
        chrome.storage.local.set({
            isVoting: true,
            maxPages: pages,
            startPage: 1, // We assume we start logical counting
            currentPageIndex: 0, // 0-based index for logic if needed, but we rely on URL params mostly
            voteStatus: 'Starting...'
        }, () => {
             // Send message to content script
             chrome.tabs.sendMessage(tabs[0].id, {
                 action: "startVoting",
                 maxPages: pages
             });
             startBtn.disabled = true;
             statusDiv.textContent = "Starting...";
        });
    });
  });

  stopBtn.addEventListener('click', () => {
      chrome.storage.local.set({ isVoting: false, voteStatus: 'Stopped' }, () => {
          statusDiv.textContent = "Stopping...";
          startBtn.disabled = false;
          
          chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopVoting" });
          });
      });
  });
});
