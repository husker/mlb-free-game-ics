// server.js
// A Node.js server using Express to create a live iCalendar feed for
// the MLB.TV Free Game of the Day.

const express = require('express');
const axios = require('axios');
const cheerio =require('cheerio');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');

const app = express();
const PORT = process.env.PORT || 3000;
const MLB_URL = 'https://www.mlb.com/live-stream-games/free-game-of-the-day';

/**
 * Fetches and parses the MLB free games schedule from the official page.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of game objects.
 */
async function getMlbSchedule() {
    try {
        // Fetch the HTML content of the page
        const { data } = await axios.get(MLB_URL);
        const $ = cheerio.load(data);
        const games = [];
        const currentYear = new Date().getFullYear();
        const timeZone = 'America/New_York'; // Eastern Time Zone

        // This version targets the specific `data-slug` attributes found in the source code.
        const scheduleSections = [
            'div[data-slug="mlb-tv-fgod-next-five-games"]',
            'div[data-slug="mlbtv-free-game-schedule-accordion"]'
        ];

        scheduleSections.forEach(selector => {
            $(selector).each((i, section) => {
                $(section).find('p > b').each((j, dateElement) => {
                    const dayAndMonth = $(dateElement).text().trim();
                    const currentDateStr = `${dayAndMonth}, ${currentYear}`;
                    console.log(`[Scraper Debug] Found Date: ${currentDateStr}`);

                    // Find the next sibling div which contains the game info
                    const gameDiv = $(dateElement).closest('p').next('div');
                    
                    if (gameDiv.length > 0) {
                        const textContent = gameDiv.text().trim(); // e.g., "  Orioles vs. Rays , 7:35 p.m. "
                        const teamsMatch = textContent.match(/(\w+(\s+\w+)*)\s*vs\.\s*(\w+(\s+\w+)*)/);
                        const timeMatch = textContent.match(/(\d{1,2}:\d{2}\s*p\.?m\.?)/);

                        if (teamsMatch && timeMatch) {
                            // The regex captures team names which might be one or two words.
                            const team1 = teamsMatch[1].trim();
                            const team2 = teamsMatch[3].trim();
                            const timeStr = timeMatch[1];
                            console.log(`[Scraper Debug] Found Teams: ${team1} vs ${team2}, Time: ${timeStr}`);
                            
                            const fullDateStr = `${currentDateStr} ${timeStr}`;
                            // Use moment-timezone to parse the date string in the correct timezone.
                            const momentDate = moment.tz(fullDateStr, 'dddd, MMMM D, YYYY h:mm a', timeZone);
                            const gameDate = momentDate.toDate(); // Convert to a standard JavaScript Date object

                            if (!isNaN(gameDate.getTime())) {
                                games.push({
                                    summary: `MLB Free Game: ${team1} vs. ${team2}`,
                                    date: gameDate,
                                    durationHours: 3, 
                                    teams: { home: team1, away: team2 }
                                });
                            }
                        }
                    }
                });
            });
        });
        
        console.log(`Successfully parsed ${games.length} games.`);
        return games;

    } catch (error) {
        console.error('Error fetching or parsing MLB schedule:', error);
        return []; // Return an empty array on failure
    }
}

/**
 * Generates an iCalendar (.ics) string from an array of game objects.
 * @param {Array<Object>} games - The array of game objects.
 * @returns {string} The iCalendar feed as a string.
 */
function generateIcs(games) {
    // Helper function to format date for iCal (in UTC)
    const toIcsDate = (date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    let icsString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Gemini//MLB Free Game Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:MLB.TV Free Game of the Day (Live)',
        'X-WR-TIMEZONE:UTC',
    ];

    games.forEach(game => {
        const startDate = game.date;
        const endDate = new Date(startDate.getTime() + game.durationHours * 60 * 60 * 1000);
        
        // Create a unique ID that is stable for this event
        const uid = `${toIcsDate(startDate).substring(0, 8)}-${game.teams.home.replace(/\s/g, '')}-${game.teams.away.replace(/\s/g, '')}@mlb.free.game`;

        icsString.push('BEGIN:VEVENT');
        icsString.push(`DTSTAMP:${toIcsDate(new Date())}`);
        icsString.push(`UID:${uid}`);
        icsString.push(`DTSTART:${toIcsDate(startDate)}`);
        icsString.push(`DTEND:${toIcsDate(endDate)}`);
        icsString.push(`SUMMARY:${game.summary}`);
        icsString.push('DESCRIPTION:MLB.TV Free Game of the Day. Schedule is subject to change. Watch live on MLB.TV.');
        icsString.push('END:VEVENT');
    });

    icsString.push('END:VCALENDAR');
    return icsString.join('\r\n');
}


// Define the route for the calendar feed
app.get('/mlb-free-games.ics', async (req, res) => {
    console.log(`[${new Date().toISOString()}] Received request for calendar feed.`);
    
    const games = await getMlbSchedule();

    if (games.length === 0) {
        // If we fail to parse, it's better to return an empty calendar
        // than a broken one. A message could also be added.
        res.status(503).send('Could not fetch MLB schedule at this time.');
        return;
    }

    const icsData = generateIcs(games);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename=mlb-schedule.ics');
    res.send(icsData);
});

// A simple root route to confirm the server is running
app.get('/', (req, res) => {
    res.send('<h1>MLB Calendar Feed Server</h1><p>To subscribe to the feed, use the URL: <strong>/mlb-free-games.ics</strong></p>');
});


// Start the server
// RENDER FIX: Bind to '0.0.0.0' to make the service available externally.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is listening on port ${PORT}`);
});
