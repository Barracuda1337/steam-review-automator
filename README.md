# 🚂 Steam Friend Auto Upvoter

**Steam Friend Auto Upvoter** is a Chrome Extension that automates the process of upvoting ("Yes") reviews on your friends' Steam profiles. It's designed to help you support your friends' content effortlessly.

## 🚀 Features

*   **Friend List Automation**: Automatically scrapes your Steam Friends List and visits each friend's profile sequentially.
*   **Auto-Upvote**: Navigates to the "Recommended" (Reviews) page of each friend and clicks the "Yes" vote button on all visible reviews.
*   **Smart Pagination**: Automatically detects multiple pages of reviews and navigates through them until all reviews are voted on.
*   **Skip Banned Reviews**: Intelligently detects and skips reviews that have been banned by Steam moderators to avoid errors.
*   **Empty Profile Handling**: Immediately skips friends who have no reviews, saving time.
*   **Floating Control Panel**: A simple overlay UI on Steam pages allows you to start/stop the queue and monitor progress.
*   **Rate Limiting**: Includes built-in delays to prevent rate-limiting by Steam.

## 📦 Installation

Since this is a custom extension, you need to install it manually in Developer Mode:

1.  Clone or download this repository to a folder on your computer.
2.  Open Chrome and go to `chrome://extensions/`.
3.  Enable **Developer mode** (toggle switch in the top right).
4.  Click **Load unpacked**.
5.  Select the folder where you downloaded this repository.

## 🛠 Usage

1.  Log in to your Steam account in Chrome.
2.  Navigate to your **Friends List** page (`https://steamcommunity.com/id/YOUR_ID/friends/`).
3.  You will see a floating panel on the right side labeled **Steam Auto Voter**.
4.  Click the **Queue All Friends** button.
5.  Confirm the dialog showing how many friends were found.
6.  Sit back and watch! The extension will visit each friend, vote on their reviews, and move to the next.

## ⚠️ Disclaimer

Use this tool responsibly. Automating actions on Steam may be subject to rate limits or account scrutiny if abused. This tool is provided for educational purposes.

## 📜 License

MIT
