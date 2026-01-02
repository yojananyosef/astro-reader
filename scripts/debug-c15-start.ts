import fs from 'fs';
import pdf from 'pdf-parse-fork';

async function debugChapter15Start() {
    const pdfPath = 'c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\1.-Genesis.pdf';
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    const text = data.text;

    const c15 = text.indexOf('CAPÍTULO 15');
    if (c15 !== -1) {
        console.log('--- CHAPTER 15 START ---');
        console.log(text.substring(c15, c15 + 3000));
    }
}

debugChapter15Start();
