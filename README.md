# mlb-free-game-ics
Calendar subscription feed for MLB.TV Free Game of the Day

# MLB.TV Free Game of the Day - Live iCal Feed

This Node.js server creates a live, auto-updating iCalendar (`.ics`) feed for the MLB.TV Free Game of the Day schedule. You can subscribe to this feed using any standard calendar application (like Google Calendar, Apple Calendar, or Outlook) to always have the latest schedule of free games automatically synced to your calendar.

## Features

-   **Live Data:** Scrapes the official [MLB.TV Free Game of the Day page](https://www.mlb.com/live-stream-games/free-game-of-the-day) in real-time.
-   **Auto-Updating:** Your calendar will periodically fetch the feed URL, ensuring the schedule is always up-to-date.
-   **Correct Time Zones:** All game times are parsed from their listed Eastern Time and served in UTC, so your calendar application will automatically display them in your local time zone.
-   **Standard iCalendar Format:** Produces a valid `.ics` feed compatible with all major calendar clients.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v14 or later recommended)
-   `npm` (Node Package Manager, included with Node.js)

## Installation

1.  **Clone the Repository (or download the code):**
    If you have this project in a Git repository, clone it. Otherwise, save the `server.js` file in a new project directory.

2.  **Navigate to the Project Directory:**
    Open your terminal or command prompt and change to the directory where you saved the project.
    ```sh
    cd /path/to/your/project
    ```

3.  **Install Dependencies:**
    Run the following command to install the necessary Node.js modules (`express`, `axios`, `cheerio`, and `moment-timezone`).
    ```sh
    npm install
    ```
    *(Note: The `package.json` should list these dependencies. If you only have the `server.js` file, you can install them manually: `npm install express axios cheerio moment-timezone`)*

## Usage

1.  **Start the Server:**
    Run the following command from the project's root directory:
    ```sh
    node server.js
    ```
    You should see a confirmation in the console:
    ```
    Server is running on http://localhost:3000
    Calendar feed available at http://localhost:3000/mlb-free-games.ics
    ```

2.  **Subscribe to the Calendar Feed:**
    -   If you are running the server on your local machine, the feed URL is `http://localhost:3000/mlb-free-games.ics`.
    -   If you deploy this server to a hosting service (like Heroku, Vercel, a VPS, etc.), use the public URL provided by that service.

    **To add the feed to Google Calendar:**
    -   Go to [Google Calendar](https://calendar.google.com).
    -   On the left, next to "Other calendars," click the plus sign (`+`).
    -   Select **From URL**.
    -   Paste the feed URL (`http://localhost:3000/mlb-free-games.ics` or your public URL) into the field and click **Add calendar**.

## How It Works

The server uses a few key libraries to accomplish its task:
-   **Express:** Creates a simple web server to handle requests.
-   **Axios:** Fetches the HTML content from the MLB.com webpage.
-   **Cheerio:** Parses the HTML, allowing the server to navigate the document structure and find the schedule information (a process known as web scraping).
-   **Moment-Timezone:** Intelligently converts the parsed game times from the Eastern Time Zone (`America/New_York`) into standard JavaScript `Date` objects, correctly handling the switch between EDT and EST.

When your calendar client requests the `.ics` URL, the server performs these steps on the fly and serves the freshly generated calendar data.

## Disclaimer

This server depends on the HTML structure of the MLB.com website. If MLB significantly changes the design or layout of their Free Game of the Day page, the scraping logic may break. If this happens, the scraper in `server.js` will need to be updated to match the new structure.
