import fs from 'fs';
import pdf from 'pdf-parse-fork';

async function analyzePDF() {
    const pdfPath = 'c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\1.-Genesis.pdf';
    
    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer, {
            max: 20 // Read first 20 pages to see structure
        });

        console.log('--- PDF METADATA ---');
        console.log(data.info);
        
        console.log('\n--- FIRST 5000 CHARACTERS ---');
        console.log(data.text.substring(0, 5000));
        
        // Look for patterns like "CAPÍTULO 1" or "1. ..." (verses)
        const chapterMatches = data.text.match(/CAP[ÍI]TULO\s+\d+/gi);
        console.log('\n--- CHAPTER MATCHES FOUND ---');
        console.log(chapterMatches ? chapterMatches.slice(0, 10) : 'None');

    } catch (error) {
        console.error('Error reading PDF:', error);
    }
}

analyzePDF();
