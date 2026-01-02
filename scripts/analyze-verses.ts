import fs from 'fs';
import pdf from 'pdf-parse-fork';

async function analyzeVerses() {
    const pdfPath = 'c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\1.-Genesis.pdf';
    
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);

        const startIdx = data.text.indexOf('CAPÍTULO 1');
        if (startIdx !== -1) {
            console.log('--- CONTENT AFTER CAPÍTULO 1 ---');
            console.log(data.text.substring(startIdx, startIdx + 5000));
        } else {
            console.log('CAPÍTULO 1 not found');
        }

    } catch (error) {
        console.error('Error reading PDF:', error);
    }
}

analyzeVerses();
