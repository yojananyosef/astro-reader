const books = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth",
  "1_samuel", "2_samuel", "1_kings", "2_kings", "1_chronicles", "2_chronicles", "ezra",
  "nehemiah", "esther", "job", "psalms", "proverbs", "ecclesiastes", "song_of_songs",
  "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel", "amos",
  "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah",
  "malachi"
];

const BASE_URL = "https://raw.githubusercontent.com/yojananyosef/next-teolingo/master/public/data/bible/";
const TARGET_DIR = "public/data/bible/hebrew/";

import { mkdir } from "node:fs/promises";
import { join } from "node:path";

async function download() {
  await mkdir(TARGET_DIR, { recursive: true });

  for (const book of books) {
    const url = `${BASE_URL}${book}.json`;
    const targetPath = join(TARGET_DIR, `${book}.json`);
    
    console.log(`Descargando ${book}...`);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const data = await response.json();
      await Bun.write(targetPath, JSON.stringify(data));
      console.log(`✅ ${book} guardado.`);
    } catch (error) {
      console.error(`❌ Error descargando ${book}:`, error.message);
    }
  }
}

download();
