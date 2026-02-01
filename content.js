// Utility to wait
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// DEBUG: Confirm script load immediately
console.log("Steam Auto Voter: Script Loaded!");

let statusDiv = null;

// Create Floating Control Panel
function createControlPanel() {
    const existing = document.getElementById('steam-voter-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'steam-voter-panel';
    panel.style.position = 'fixed';
    panel.style.top = '60px'; // Lower than steam header
    panel.style.right = '20px';
    panel.style.padding = '15px';
    panel.style.backgroundColor = '#171a21'; // Steam darkened
    panel.style.color = '#c7d5e0';
    panel.style.borderRadius = '4px';
    panel.style.zIndex = '2147483647'; // MAX INT
    panel.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    panel.style.fontFamily = 'Arial, sans-serif';
    panel.style.display = 'flex';
    panel.style.flexDirection = 'column';
    panel.style.gap = '10px';
    panel.style.border = '1px solid #3a4b5e';
    panel.style.minWidth = '200px';

    const title = document.createElement('div');
    title.textContent = 'Steam Auto Voter';
    title.style.fontWeight = 'bold';
    title.style.color = '#66c0f4';
    title.style.textAlign = 'center';
    panel.appendChild(title);

    // Detect if we are on a Friends page
    if (window.location.href.includes('/friends')) {
        createFriendsPanel(panel);
    } else {
        createVotingPanel(panel);
    }

    statusDiv = document.createElement('div');
    statusDiv.style.fontSize = '12px';
    statusDiv.style.marginTop = '5px';
    statusDiv.textContent = 'Ready';
    panel.appendChild(statusDiv);

    document.body.appendChild(panel);
}

function createFriendsPanel(panel) {
    const info = document.createElement('div');
    info.textContent = 'Friend List Detected';
    info.style.fontSize = '0.9em';
    info.style.color = '#fff';
    panel.appendChild(info);

    const btnJoin = document.createElement('button');
    btnJoin.textContent = 'Queue All Friends';
    btnJoin.style.padding = '8px';
    btnJoin.style.backgroundColor = '#27ae60';
    btnJoin.style.color = 'white';
    btnJoin.style.border = 'none';
    btnJoin.style.cursor = 'pointer';
    btnJoin.onclick = scrapeAndStartFriends;
    panel.appendChild(btnJoin);
}

function createVotingPanel(panel) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.display = 'flex';
    controlsDiv.style.gap = '5px';
    controlsDiv.style.alignItems = 'center';

    const pagesLabel = document.createElement('span');
    pagesLabel.textContent = 'Pages:';
    
    const pagesInput = document.createElement('input');
    pagesInput.type = 'number';
    pagesInput.value = '12';
    pagesInput.min = '1';
    pagesInput.style.width = '50px';
    pagesInput.style.padding = '2px';
    pagesInput.style.backgroundColor = '#2a3f5a';
    pagesInput.style.color = 'white';
    pagesInput.style.border = '1px solid #000';

    controlsDiv.appendChild(pagesLabel);
    controlsDiv.appendChild(pagesInput);
    panel.appendChild(controlsDiv);

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '5px';

    const btnStart = document.createElement('button');
    btnStart.textContent = 'Start';
    btnStart.style.flex = '1';
    btnStart.style.padding = '5px';
    btnStart.style.backgroundColor = '#66c0f4';
    btnStart.style.border = 'none';
    btnStart.style.cursor = 'pointer';
    btnStart.onclick = () => {
        const pages = parseInt(pagesInput.value) || 12;
        startVotingProcess(pages);
    };

    const btnStop = document.createElement('button');
    btnStop.textContent = 'Stop';
    btnStop.style.flex = '1';
    btnStop.style.padding = '5px';
    btnStop.style.backgroundColor = '#a04d4d';
    btnStop.style.color = 'white';
    btnStop.style.border = 'none';
    btnStop.style.cursor = 'pointer';
    btnStop.onclick = () => {
        stopVotingProcess();
    };

    btnContainer.appendChild(btnStart);
    btnContainer.appendChild(btnStop);
    panel.appendChild(btnContainer);
}

// Helper to handle completion of current friend
function finishCurrentFriend() {
    chrome.storage.local.get(['isProcessingFriends', 'currentFriendIndex'], (data) => {
        if (data.isProcessingFriends) {
            // Move to next friend
            updateStatus("Friend done! Moving to next...");
            chrome.storage.local.set({ 
                processedPages: 0,
                currentFriendIndex: (data.currentFriendIndex || 0) + 1 
            }, () => {
               processNextFriend();
            });
        } else {
            // Done completely
            chrome.storage.local.set({ isVoting: false, voteStatus: 'Bitti! - Tüm sayfalar tamamlandı.' });
            updateStatus("Bitti! - Tüm sayfalar tamamlandı.");
            chrome.runtime.sendMessage({ action: "votingComplete" }).catch(() => {});
        }
    });
}

function goToNextPage() {
    // Attempt to find the "Next" button based on user snippet
    // Structure: <a class="pagebtn" href="?p=XX">&gt;</a> (Active)
    // Structure: <span class="pagebtn disabled">&gt;</span> (Disabled/End)
    
    const pageBtns = Array.from(document.querySelectorAll('.workshopBrowsePagingControls .pagebtn'));
    const nextBtn = pageBtns.find(btn => btn.textContent.includes('>') || btn.innerText.includes('>'));

    if (nextBtn) {
        // Check if disabled (either has 'disabled' class or is a SPAN tag which usually means disabled in Steam UI here)
        if (nextBtn.classList.contains('disabled') || nextBtn.tagName === 'SPAN') {
            updateStatus("Last page reached (disabled button).");
            finishCurrentFriend();
            return;
        }

        updateStatus("Found next page button, navigating...");
        nextBtn.click();
    } else {
        // If NO next button is found, it usually means there is only 1 page, or we are at the end.
        // Previously we forced URL param, but for "Auto Detect" we should assume done.
        console.log("No next button found. Assuming end of list.");
        updateStatus("Son sayfa (buton yok).");
        finishCurrentFriend();
    }
}

function scrapeAndStartFriends() {
    updateStatus("Arkadaş listesi taranıyor...");
    
    const friendBlocks = document.querySelectorAll('.friend_block_v2');
    let urls = [];
    
    friendBlocks.forEach(block => {
        const link = block.querySelector('a.selectable_overlay'); 
        if (link && link.href) {
            urls.push(link.href);
        }
    });

    if (urls.length === 0) {
        alert("Hiç arkadaş bulunamadı! Sayfanın yüklendiğinden emin olun.");
        updateStatus("Arkadaş bulunamadı!");
        return;
    }

    if (!confirm(`${urls.length} arkadaş bulundu (Çevrimiçi ve Çevrimdışı dahil).\n\nHepsini sıraya alıp oylamaya başlamak istiyor musunuz?`)) {
        updateStatus("İşlem iptal edildi.");
        return;
    }

    // Queue them
    chrome.storage.local.set({
        friendQueue: urls,
        totalFriends: urls.length,
        currentFriendIndex: 0,
        isProcessingFriends: true,
        maxPages: 9999, // Set to high number for "Auto Detect" mode
        isVoting: true
    }, () => {
        processNextFriend();
    });
}

function processNextFriend() {
    chrome.storage.local.get(['friendQueue', 'currentFriendIndex', 'totalFriends'], (data) => {
        const queue = data.friendQueue || [];
        const index = data.currentFriendIndex || 0;

        if (index >= queue.length) {
            updateStatus("All Friends Processed!");
            chrome.storage.local.set({ isVoting: false, isProcessingFriends: false });
            return;
        }

        const friendUrl = queue[index];
        updateStatus(`Starting Friend ${index + 1}/${data.totalFriends}`);
        
        // Target URL: [Profile]/recommended/
        const targetUrl = friendUrl + (friendUrl.endsWith('/') ? '' : '/') + 'recommended/';
        
        setTimeout(() => {
            window.location.href = targetUrl;
        }, 1000);
    });
}

function startVotingProcess(pages) {
    chrome.storage.local.set({
        isVoting: true,
        maxPages: pages,
        voteStatus: 'Starting...'
    }, () => {
         updateStatus('Starting...');
         chrome.storage.local.set({ processedPages: 0 }, () => {
             runVotingCycle(pages);
         });
    });
}

function stopVotingProcess() {
    chrome.storage.local.set({ isVoting: false, voteStatus: 'Stopped', isProcessingFriends: false }, () => {
        updateStatus('StoppedByUser');
        location.reload();
    });
}

// Helper to update popup status via messaging or storage
function updateStatus(msg) {
    if (statusDiv) statusDiv.textContent = msg;
    chrome.runtime.sendMessage({ action: "updateStatus", message: msg }).catch(() => {});
    chrome.storage.local.set({ voteStatus: msg });
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createControlPanel);
} else {
    createControlPanel();
}

// Check if we should be running on load
chrome.storage.local.get(['isVoting', 'maxPages', 'voteStatus', 'isProcessingFriends', 'friendQueue', 'currentFriendIndex'], (data) => {
    // Restore status text
    if (data.voteStatus && statusDiv) statusDiv.textContent = data.voteStatus;

    if (data.isVoting) {
        
        // If we are on a friends page, we are scraping, not voting recommendations (unless scraping done)
        if (window.location.href.includes('/friends')) {
            // Do nothing, wait for user or scrape
        } else {
            // Update panel title to show friend progress
            if (data.isProcessingFriends) {
                const friendProgress = `Friend ${data.currentFriendIndex + 1}/${data.friendQueue.length}`;
                if (statusDiv) statusDiv.innerHTML = `${data.voteStatus}<br><span style='color:yellow'>${friendProgress}</span>`;
            }

            // Give the page a moment to fully load everything
            setTimeout(() => {
                runVotingCycle(data.maxPages);
            }, 2000);
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startVoting") {
        if (statusDiv) statusDiv.textContent = "Starting...";
    } else if (request.action === "stopVoting") {
        stopVotingProcess();
    }
});

async function runVotingCycle(maxPages) {
    // 1. Identify Buttons
    // Steam "Yes" buttons usually have onclick="UserReviewVoteUp(...)"
    let buttons = Array.from(document.querySelectorAll('a[onclick*="UserReviewVoteUp"]'));
    
    // OPTIMIZATION: If no buttons found at all, user likely has no reviews or we reached the end.
    // Skip to next friend immediately.
    if (buttons.length === 0) {
        console.log("No reviews found on this page. Skipping friend.");
        updateStatus("İnceleme bulunamadı, diğer arkadaşa geçiliyor...");
        await wait(1000); // Brief delay to read status
        finishCurrentFriend();
        return;
    }

    // Filter out ones that are already 'active' (active usually means already voted)
    let buttonsToClick = buttons.filter(btn => {
        return !btn.classList.contains('active') && !btn.classList.contains('btn_active');
    });

    console.log(`Found ${buttonsToClick.length} reviews to vote on this page.`);
    updateStatus(`Found ${buttonsToClick.length} votes...`);

    // 2. Click Loop
    for (let i = 0; i < buttonsToClick.length; i++) {
        // Check if stopped
        const state = await chrome.storage.local.get('isVoting');
        if (!state.isVoting) return;

        let btn = buttonsToClick[i];
        
        // CHECK FOR BANNED REVIEWS
        // User reports banned reviews shouldn't be voted on.
        // Structure: .review_box > .notification.banned
        const reviewBox = btn.closest('.review_box');
        if (reviewBox && reviewBox.querySelector('.notification.banned')) {
            console.log("Skipping banned review.");
            updateStatus(`Yasaklı inceleme atlanıyor (${i + 1}/${buttonsToClick.length})`);
            continue; 
        }

        // Fix for CSP
        if (btn.hasAttribute('href') && btn.getAttribute('href').startsWith('javascript:')) {
            btn.removeAttribute('href');
            btn.style.cursor = 'pointer'; 
        }
        
        // Scroll to make it look active/human
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Click
        btn.click();
        
        // Update Status
        updateStatus(`Voting ${i + 1}/${buttonsToClick.length}`);
        
        // Random Delay
        await wait(500 + Math.random() * 1000);
    }

    // 3. Pagination Logic
    chrome.storage.local.get(['processedPages', 'isProcessingFriends', 'currentFriendIndex'], (data) => {
        let currentProcessed = (data.processedPages || 0) + 1;
        
        if (currentProcessed >= maxPages) {
            // Done with this profile
            if (data.isProcessingFriends) {
                finishCurrentFriend();
            } else {
                // Done completely
                chrome.storage.local.set({ isVoting: false, voteStatus: 'Bitti! - Tüm sayfalar tamamlandı.' });
                updateStatus("Bitti! - Tüm sayfalar tamamlandı.");
                chrome.runtime.sendMessage({ action: "votingComplete" }).catch(() => {});
            }
        } else {
            // Go to next page
            chrome.storage.local.set({ processedPages: currentProcessed }, () => {
                goToNextPage();
            });
        }
    });
}
