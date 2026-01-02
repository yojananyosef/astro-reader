import fs from 'fs';
import pdf from 'pdf-parse-fork';

async function debugIntro() {
    const dataBuffer = fs.readFileSync('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\1.-Genesis.pdf');
    const data = await pdf(dataBuffer);
    console.log(data.text.substring(0, 2000));
}

debugIntro();
