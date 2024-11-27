import { config } from 'dotenv';

// const success = chalk.bold.green;
// const warning = chalk.hex('#FFA500');
const noEventsMessage = 'No special events ';

// Load environment variables from `.env` or PM2 environment
config();

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const COMMUNITY_NAME = process.env.COMMUNITY_NAME;
const DATA_URL = process.env.DATA_URL;

export default class Vcal {

    constructor() { }

    // Fetch and send today's events
    async sendTodaysEvents() {
        const today = this.#getToday();
        await this.sendEventsForRange(today, today, 'Today\'s');
    }

    // Fetch and send tomorrow's events
    async sendTomorrowsEvents() {
        const tomorrow = this.#getTomorrow();
        await this.sendEventsForRange(tomorrow, tomorrow, 'Tomorrow\'s');
    }

    // Fetch and send this week's events
    async sendWeeksEvents() {
        const { start, end } = this.#getWeekRange();
        await this.sendEventsForRange(start, end, 'This week');
    }

    // Fetch events data
    async fetchEventsData() {
        try {
            const response = await fetch(DATA_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch data: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error.message);
            return [];
        }
    }

    // Filter and send events for a specific date range
    async sendEventsForRange(startDate, endDate, start) {
        const data = await this.fetchEventsData();
        const eventsInRange = data.filter((event) => {
            // Parse the event's UTC date and convert it to a local date
            const eventDate = new Date(event.date).toLocaleDateString('en-CA'); // Local date in 'YYYY-MM-DD'

            // Compare local date strings
            return eventDate >= startDate && eventDate <= endDate;
        });

        let message = '';

        if (eventsInRange.length > 0) {
            message += '<i>';
            if (start) {
                message += `${start} `;
            }
            message += `Vaiṣṇava Calendar events for ${COMMUNITY_NAME}</i> 🙏\n`;
            message += startDate != endDate ? `<b>${this.#formattedDate(startDate)} to ${this.#formattedDate(endDate)}</b>\n` : '';

            eventsInRange.forEach(date => {
                message += this.#addDate(date);
            });

        } else {
            message = noEventsMessage;
            message += startDate != endDate ? `between ${this.#formattedDate(startDate)} and ${this.#formattedDate(endDate)}` : 'today ';
            message += ' 😔';
        }

        await this.#sendTelegramMessage(message);
    }


    #addDate(data) {
        let message = `<b>${this.#formattedDate(data.date)}</b>\n`;
        data.events.forEach(event => {
            message += `<code>${event.title.trim()}</code>\n`;
        });

        return message;
    }

    // Get today's date in YYYY-MM-DD
    #getToday() {
        const now = new Date();
        return now.toLocaleDateString('en-CA'); // Formats as 'YYYY-MM-DD' in local time
    }

    // Get tomorrow's date in YYYY-MM-DD
    #getTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toLocaleDateString('en-CA'); // Formats as 'YYYY-MM-DD' in local time
    }

    // Get current week (YYYY-MM-DD to YYYY-MM-DD)
    #getWeekRange() {
        const now = new Date();
        const startOfWeek = new Date(now);
        const endOfWeek = new Date(now);

        // Set to the start of the week (Sunday)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

        // Set to the end of the week (Saturday)
        endOfWeek.setDate(startOfWeek.getDate() + 6);

        return {
            start: startOfWeek.toLocaleDateString('en-CA'), // Formats as 'YYYY-MM-DD'
            end: endOfWeek.toLocaleDateString('en-CA'),     // Formats as 'YYYY-MM-DD'
        };
    }

    // Helper function to send a Telegram message
    async #sendTelegramMessage(message) {
        const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        try {
            const response = await fetch(TELEGRAM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Vaiṣṇava Calendar',
                                    url: 'https://www.purebhakti.com/resources/vaisnava-calendar'
                                },
                                {
                                    text: 'Calendar Information',
                                    url: 'https://www.purebhakti.com/calendar-information'
                                }
                            ]
                        ]
                    }
                }),
            });

            const result = await response.json();
            if (!result.ok) {
                throw new Error(`Telegram API Error: ${result.description}`);
            }
            console.log('Message sent successfully.');
        } catch (error) {
            console.error('Error sending Telegram message:', error.message);
        }
    }

    #formattedDate(dateString) {
        const date = new Date(dateString);

        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });

        return formattedDate;
    }
}