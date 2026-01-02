import fs from 'fs';
import pdf from 'pdf-parse-fork';

async function debugChapter15() {
    const pdfPath = 'c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\1.-Genesis.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    const c15 = text.indexOf('CAPÍTULO 15');
    const c16 = text.indexOf('CAPÍTULO 16');
    
    if (c15 !== -1) {
        console.log('--- CHAPTER 15 TEXT ---');
        console.log(text.substring(c15, c16 !== -1 ? c16 : c15 + 5000));
    } else {
        console.log('CAPÍTULO 15 not found');
    }
}

debugChapter15();
