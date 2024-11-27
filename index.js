import Vcal from './src/Vcal.js';

const vcal = new Vcal();

async function main() {
    const action = process.argv[2]; // Read the argument passed to the script

    try {
        switch (action) {
            case 'today':
                console.log('Sending today\'s events...');
                await vcal.sendTodaysEvents();
                break;
            case 'tomorrow':
                console.log('Sending tomorrow\'s events...');
                await vcal.sendTomorrowsEvents();
                break;
            case 'week':
                console.log('Sending this week\'s events...');
                await vcal.sendWeeksEvents();
                break;
            default:
                console.error('Invalid argument. Use "today", "tomorrow", or "week".');
        }
    } catch (error) {
        console.error('An error occurred:', error.message);
    }
}

main();
