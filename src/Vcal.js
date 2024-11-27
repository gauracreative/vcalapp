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
            const eventDate = event.date; // Already in 'YYYY-MM-DD' format
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
            // message = noEventsMessage;
            // message += startDate != endDate ? `between ${this.#formattedDate(startDate)} and ${this.#formattedDate(endDate)}` : 'today ';
            // message += ' 😔';
        }

        if (message) {
            await this.#sendTelegramMessage(message);
        }
    }


    #addDate(data) {
        let message = `<b>${this.#formattedDate(data.date)}</b>\n`;
        data.events.forEach(event => {
            message += `<code>${event.title.trim()}</code>\n`;
        });

        return message;
    }

    #getToday() {
        const now = new Date();
        return this.#ymdDate(now); // Use helper method
    }
    
    #getTomorrow() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.#ymdDate(tomorrow); // Use helper method
    }
    
    #getWeekRange() {
        const now = new Date();
        const startOfWeek = new Date(now);
        const endOfWeek = new Date(now);
    
        // Set to the start of the week (Sunday)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
        // Set to the end of the week (Saturday)
        endOfWeek.setDate(startOfWeek.getDate() + 6);
    
        return {
            start: this.#ymdDate(startOfWeek), // Use helper method
            end: this.#ymdDate(endOfWeek),     // Use helper method
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
        const [year, month, day] = dateString.split('-'); // Split 'YYYY-MM-DD'
        const date = new Date(year, month - 1, day); // Convert to Date object
    
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    
        return formattedDate;
    }

    #ymdDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
}