import fs from 'fs';
import path from 'path';

const TARGET_PATH = path.join(process.cwd(), 'src/data/plan-content/annual-thematic.json');

async function refactorThematic() {
    try {
        const content = fs.readFileSync(TARGET_PATH, 'utf-8');
        const data = JSON.parse(content);

        let modifiedCount = 0;
        let totalReadings = 0;

        for (const day in data) {
            const dayData = data[day];
            if (dayData.egw && Array.isArray(dayData.egw)) {
                for (const reading of dayData.egw) {
                    totalReadings++;
                    // Extract chapter number from label like "Cap. 2"
                    const match = reading.label.match(/Cap\.\s*(\d+)/i);
                    if (match) {
                        const chapterId = parseInt(match[1]);
                        reading.chapterId = chapterId;
                        delete reading.content;
                        modifiedCount++;
                    }
                }
            }
        }

        fs.writeFileSync(TARGET_PATH, JSON.stringify(data, null, 4), 'utf-8');
        console.log(`Successfully refactored ${modifiedCount} out of ${totalReadings} EGW readings.`);
        console.log(`File updated at: ${TARGET_PATH}`);
    } catch (error) {
        console.error('Error refactoring thematic plan:', error);
    }
}

refactorThematic();
