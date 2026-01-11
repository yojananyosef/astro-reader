import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse-fork';

interface VerseCommentary {
    verse: number;
    phrase: string;
    content: string;
    references: string[];
}

interface ChapterCommentary {
    chapter: number;
    verses: VerseCommentary[];
    egwReferences?: string;
}

interface IntroductionSection {
    title: string;
    content: string;
}

interface Introduction {
    fullTitle: string;
    subtitle: string;
    sections: IntroductionSection[];
}

interface BookCommentary {
    metadata: {
        name: string;
        abbreviation: string;
        totalChapters: number;
    };
    introduction?: Introduction;
    chapters: ChapterCommentary[];
}

async function extractCBA(pdfPath: string, outputDir: string, bookName: string, abbreviation: string, totalChapters: number) {
    console.log(`Processing: ${pdfPath}`);
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    let text = data.text;

    // Fix common OCR issues for verse numbers at start of lines
    text = text.replace(/\n[lI]\.\s*\n/g, '\n1.\n');
    // Add missing dots to verse numbers that are on their own line
    text = text.replace(/\n(\d{1,2})\s*\n/g, '\n$1.\n');
    
    const book: any = {
        metadata: {
            name: bookName,
            abbreviation: abbreviation,
            totalChapters: totalChapters
        },
        introduction: null,
        chapters: []
    };

    // Extract Introduction
    let firstChapterIndex = text.search(/(?:CAP[ÍI]TULO|SALMO)\s+1\b/i);
    
    // If no "CAPÍTULO 1" found but it's a single-chapter book, try to find the split point
    if (firstChapterIndex === -1 && totalChapters === 1) {
        console.log("No CAPÍTULO 1 marker found for single-chapter book. Searching for intro/commentary split...");
        const lastIntroMatch = [...text.matchAll(/\n(\d+)\.\s*(Bosquejo|Introducción|Bosquejo General)/gi)].pop();
        if (lastIntroMatch) {
            const searchFrom = lastIntroMatch.index + lastIntroMatch[0].length;
            const verseOneMatch = text.substring(searchFrom).match(/\n1\.\s*\n/);
            if (verseOneMatch) {
                firstChapterIndex = searchFrom + verseOneMatch.index!;
                console.log(`Found split point at verse 1: ${firstChapterIndex}`);
            }
        }
    }

    console.log(`First chapter match index: ${firstChapterIndex}`);
    
    const introText = firstChapterIndex !== -1 ? text.substring(0, firstChapterIndex).trim() : "";
    if (introText) {
        const lines = introText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const fullTitle = lines[0] || "";
        const subtitle = lines[1] || "";
        
        const sections: IntroductionSection[] = [];
        
        // Find section markers like "1. Título.", "2. Autor.", etc.
        const sectionOffsets: { title: string, index: number, matchLength: number }[] = [];
        
        // Add "INTRODUCCIÓN" as first section if it exists
        const introTitleMatch = introText.match(/INTRODUCCI[ÓO]N/i);
        if (introTitleMatch) {
            sectionOffsets.push({ 
                title: "INTRODUCCIÓN", 
                index: introTitleMatch.index!,
                matchLength: introTitleMatch[0].length
            });
        }

        // Improved regex to find numbered sections (e.g., "1. Título.", "2. Paternidad literaria.", etc.)
        // We look for specific keywords to avoid catching sub-points
        const numberedSectionRegex = /\n(\d+)\.\s*(Título|Paternidad literaria|Autor|Marco histórico|Tema|Bosquejo|Propósito|Introducción|Bosquejo General)/gi;
        let sMatch;
        while ((sMatch = numberedSectionRegex.exec(introText)) !== null) {
            sectionOffsets.push({ 
                title: `${sMatch[1]}. ${sMatch[2].trim()}`, 
                index: sMatch.index,
                matchLength: sMatch[0].length
            });
        }
        
        // Find "4. Tema" specifically if it was missed (it might not be preceded by a newline)
        if (!sectionOffsets.find(s => s.title.includes("4. Tema"))) {
             const temaMatch = introText.match(/(\d+)\.\s*(Tema\b[^.\n]*)/i);
             if (temaMatch) {
                 sectionOffsets.push({
                     title: `${temaMatch[1]}. ${temaMatch[2].trim()}`,
                     index: temaMatch.index!,
                     matchLength: temaMatch[0].length
                 });
             }
        }
        
        sectionOffsets.sort((a, b) => a.index - b.index);

        // Deduplicate sections by index (sometimes the same index is found)
        const uniqueOffsets = sectionOffsets.filter((v, i, a) => a.findIndex(t => t.index === v.index) === i);

        for (let i = 0; i < uniqueOffsets.length; i++) {
            const currentS = uniqueOffsets[i];
            const nextS = uniqueOffsets[i + 1];
            let content = introText.substring(currentS.index + currentS.matchLength, nextS ? nextS.index : introText.length).trim();
            
            // Remove leading dots or punctuation often left after title
            content = content.replace(/^[.\s:]+/, '');
            
            // Clean up content (remove page numbers and extra whitespace)
            content = content.replace(/\s+\d{3,4}\s+/g, ' ').replace(/\s+/g, ' ').trim();
            
            sections.push({
                title: currentS.title,
                content: content
            });
        }

        book.introduction = {
            fullTitle: fullTitle,
            subtitle: subtitle,
            sections: sections
        };
    }

    // Split text by "CAPÍTULO X" or "SALMO X"
    // We only want these markers when they're on their own line or at the start of a block
    const chapterRegex = /(?:CAP[ÍI]TULO|SALMO)\s+(\d+)/gi;
    let match;
    const chapterOffsets: { num: number, index: number }[] = [];

    while ((match = chapterRegex.exec(text)) !== null) {
        // Skip "NOTA ADICIONAL DEL CAPÍTULO X"
        const contextBefore = text.substring(Math.max(0, match.index - 30), match.index);
        if (contextBefore.toUpperCase().includes("NOTA ADICIONAL")) {
            console.log(`Skipping additional note marker: "${match[0]}" at ${match.index}`);
            continue;
        }

        const context = text.substring(match.index - 20, match.index + 50).replace(/\n/g, ' ');
        console.log(`Found marker: "${match[0]}" at ${match.index}. Context: "...${context}..."`);
        chapterOffsets.push({ num: parseInt(match[1]), index: match.index });
    }
    console.log(`Detected ${chapterOffsets.length} chapter markers.`);
    if (chapterOffsets.length === 0 && totalChapters === 1) {
        console.log("Single chapter book without marker detected. Adding Chapter 1 manually.");
        chapterOffsets.push({ num: 1, index: firstChapterIndex !== -1 ? firstChapterIndex : 0 });
    }

    const tempChapters: Map<number, ChapterCommentary> = new Map();

    for (let i = 0; i < chapterOffsets.length; i++) {
        const current = chapterOffsets[i];
        
        // Skip chapters that exceed the total chapters for this book
        if (current.num > totalChapters) {
            console.log(`Skipping chapter ${current.num} as it exceeds total chapters ${totalChapters}`);
            continue;
        }

        const next = chapterOffsets[i + 1];
        const chapterText = text.substring(current.index, next ? next.index : text.length);

        const chapter: ChapterCommentary = {
            chapter: current.num,
            verses: []
        };

        const egwMatch = chapterText.match(/COMENTARIOS DE ELENA G\. DE WHITE([\s\S]*)$/i);
        let mainChapterText = chapterText;
        if (egwMatch) {
            chapter.egwReferences = egwMatch[1].trim();
            mainChapterText = chapterText.substring(0, egwMatch.index);
        }

        const verseRegex = /\n(\d+)\.\s*\n/g;
        let vMatch;
        const verseOffsets: { num: number, index: number }[] = [];
        
        if (current.num === 36) {
            console.log(`Chapter 36 full text (last 5000 chars):`, mainChapterText.substring(mainChapterText.length - 5000));
        }
        
        while ((vMatch = verseRegex.exec(mainChapterText)) !== null) {
            verseOffsets.push({ num: parseInt(vMatch[1]), index: vMatch.index });
        }
        
        if (current.num >= 34) {
            console.log(`Chapter ${current.num}: detected ${verseOffsets.length} verses.`);
            console.log(`Text sample for Chapter ${current.num} (first 2000 chars):`, mainChapterText.substring(0, 2000));
        }

        for (let j = 0; j < verseOffsets.length; j++) {
            const vCurrent = verseOffsets[j];
            const vNext = verseOffsets[j + 1];
            const vTextRaw = mainChapterText.substring(vCurrent.index, vNext ? vNext.index : mainChapterText.length);

            const lines = vTextRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length < 2) continue;

            const verseNum = vCurrent.num;
            const phrase = lines[1];
            const contentRaw = lines.slice(2).join(' ');
            const content = contentRaw.replace(/\s+\d{3,4}\s+/g, ' ').replace(/\s+/g, ' ').trim();
            
            const refRegex = /\(([^)]+)\)/g;
            const references: string[] = [];
            let rMatch;
            while ((rMatch = refRegex.exec(content)) !== null) {
                const ref = rMatch[1].trim();
                if (ref.length > 2 && /[A-Z]/.test(ref)) {
                    references.push(ref);
                }
            }

            chapter.verses.push({
                verse: verseNum,
                phrase: phrase,
                content: content,
                references: Array.from(new Set(references))
            });
        }

        if (chapter.verses.length > 0) {
            // If chapter already exists, merge verses (take more complete one)
            const existing = tempChapters.get(current.num);
            if (!existing || chapter.verses.length > existing.verses.length) {
                tempChapters.set(current.num, chapter);
            }
        }
    }

    // Convert map to sorted array
    book.chapters = Array.from(tempChapters.values()).sort((a, b) => a.chapter - b.chapter);

    // Final log of extracted chapters
    book.chapters.forEach(c => console.log(`Final: Chapter ${c.chapter} with ${c.verses.length} verses.`));
    console.log(`Total text length: ${text.length}`);
    console.log(`Last 1000 characters of text:`, text.substring(text.length - 1000));

    const outputPath = path.join(outputDir, `${abbreviation.toLowerCase()}.json`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(book, null, 4), 'utf-8');
    console.log(`Saved to ${outputPath}`);
}

const OUTPUT_DIR = 'c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\commentary';

const BOOKS_CONFIG: Record<string, { name: string, abbr: string, chapters: number, file: string }> = {
    "1": { name: "Génesis", abbr: "Gen", chapters: 50, file: "1.-Genesis.pdf" },
    "2": { name: "Éxodo", abbr: "Exo", chapters: 40, file: "2.-Exodo.pdf" },
    "3": { name: "Levítico", abbr: "Lev", chapters: 27, file: "3.-Levitico.pdf" },
    "4": { name: "Números", abbr: "Num", chapters: 36, file: "4.-Numeros.pdf" },
    "5": { name: "Deuteronomio", abbr: "Deu", chapters: 34, file: "5.-Deuteronomio.pdf" },
    "6": { name: "Josué", abbr: "Jos", chapters: 24, file: "6.-Josue.pdf" },
    "7": { name: "Jueces", abbr: "Jue", chapters: 21, file: "7.-Jueces.pdf" },
    "8": { name: "Rut", abbr: "Rut", chapters: 4, file: "8.-Rut.pdf" },
    "9": { name: "1 Samuel", abbr: "1sa", chapters: 31, file: "9.-I Samuel.pdf" },
    "10": { name: "2 Samuel", abbr: "2sa", chapters: 24, file: "10.-II Samuel.pdf" },
    "11": { name: "1 Reyes", abbr: "1re", chapters: 22, file: "11.-I Reyes.pdf" },
    "12": { name: "2 Reyes", abbr: "2re", chapters: 25, file: "12.-II Reyes.pdf" },
    "13": { name: "1 Crónicas", abbr: "1cr", chapters: 29, file: "13.-I Cronicas.pdf" },
    "14": { name: "2 Crónicas", abbr: "2cr", chapters: 36, file: "14.-II Cronicas.pdf" },
    "15": { name: "Esdras", abbr: "esd", chapters: 10, file: "15.-Esdras.pdf" },
    "16": { name: "Nehemías", abbr: "neh", chapters: 13, file: "16.-Nehemias.pdf" },
    "17": { name: "Ester", abbr: "est", chapters: 10, file: "17.-Ester.pdf" },
    "18": { name: "Job", abbr: "job", chapters: 42, file: "18.-Job.pdf" },
    "19": { name: "Salmos", abbr: "psa", chapters: 150, file: "19.-Salmos.pdf" },
    "20": { name: "Proverbios", abbr: "pro", chapters: 31, file: "20.-Proverbios.pdf" },
    "21": { name: "Eclesiastés", abbr: "ecc", chapters: 12, file: "21.-Eclesiastes.pdf" },
    "22": { name: "Cantares", abbr: "son", chapters: 8, file: "22.-Cantares.pdf" },
    "23": { name: "Isaías", abbr: "isa", chapters: 66, file: "23.-Isaias.pdf" },
    "24": { name: "Jeremías", abbr: "jer", chapters: 52, file: "24.-Jeremias.pdf" },
    "25": { name: "Lamentaciones", abbr: "lam", chapters: 5, file: "25.-Lamentaciones.pdf" },
    "26": { name: "Ezequiel", abbr: "eze", chapters: 48, file: "26.-Ezequiel.pdf" },
    "27": { name: "Daniel", abbr: "dan", chapters: 12, file: "27.-Daniel.pdf" },
    "28": { name: "Oseas", abbr: "ose", chapters: 14, file: "28.-Oseas.pdf" },
    "29": { name: "Joel", abbr: "joe", chapters: 3, file: "29.-Joel.pdf" },
    "30": { name: "Amós", abbr: "amo", chapters: 9, file: "30.-Amos.pdf" },
    "31": { name: "Abdías", abbr: "oba", chapters: 1, file: "31.-Abdias.pdf" },
    "32": { name: "Jonás", abbr: "jon", chapters: 4, file: "32.-Jonas.pdf" },
    "33": { name: "Miqueas", abbr: "mic", chapters: 7, file: "33.-Miqueas.pdf" },
    "34": { name: "Nahúm", abbr: "nah", chapters: 3, file: "34.-Nahum.pdf" },
    "35": { name: "Habacuc", abbr: "hab", chapters: 3, file: "35.-Habacuc.pdf" },
    "36": { name: "Sofonías", abbr: "zep", chapters: 3, file: "36.-Sofonias.pdf" },
    "37": { name: "Hageo", abbr: "hag", chapters: 2, file: "37.-Hageo.pdf" },
    "38": { name: "Zacarías", abbr: "zec", chapters: 14, file: "38.-Zacarias.pdf" },
    "39": { name: "Malaquías", abbr: "mal", chapters: 4, file: "39.-Malaquias.pdf" },
    "40": { name: "Mateo", abbr: "mat", chapters: 28, file: "40.-Mateo.pdf" },
    "41": { name: "Marcos", abbr: "mrk", chapters: 16, file: "41.-Marcos.pdf" },
    "42": { name: "Lucas", abbr: "luk", chapters: 24, file: "42.-Lucas.pdf" },
    "43": { name: "Juan", abbr: "jhn", chapters: 21, file: "43.-Juan.pdf" },
    "44": { name: "Hechos", abbr: "act", chapters: 28, file: "44.-Hechos.pdf" },
    "45": { name: "Romanos", abbr: "rom", chapters: 16, file: "45.-Romanos.pdf" },
    "46": { name: "1 Corintios", abbr: "1co", chapters: 16, file: "46.-I Corintios.pdf" },
    "47": { name: "2 Corintios", abbr: "2co", chapters: 13, file: "47.-II Corintios.pdf" },
    "48": { name: "Gálatas", abbr: "gal", chapters: 6, file: "48.-Galatas.pdf" },
    "49": { name: "Efesios", abbr: "eph", chapters: 6, file: "49.-Efesios.pdf" },
    "50": { name: "Filipenses", abbr: "phi", chapters: 4, file: "50.-Filipenses.pdf" },
    "51": { name: "Colosenses", abbr: "col", chapters: 4, file: "51.-Colosenses.pdf" },
    "52": { name: "1 Tesalonicenses", abbr: "1th", chapters: 5, file: "52.-I Tesalonicenses.pdf" },
    "53": { name: "2 Tesalonicenses", abbr: "2th", chapters: 3, file: "53.-II Tesalonicenses.pdf" },
    "54": { name: "1 Timoteo", abbr: "1ti", chapters: 6, file: "54.-I Timoteo.pdf" },
    "55": { name: "2 Timoteo", abbr: "2ti", chapters: 4, file: "55.-II Timoteo.pdf" },
    "56": { name: "Tito", abbr: "tit", chapters: 3, file: "56.-Tito.pdf" },
    "57": { name: "Filemón", abbr: "phm", chapters: 1, file: "57.-Filemon.pdf" },
    "58": { name: "Hebreos", abbr: "heb", chapters: 13, file: "58.-Hebreos.pdf" },
    "59": { name: "Santiago", abbr: "jam", chapters: 5, file: "59.-Santiago.pdf" },
    "60": { name: "1 Pedro", abbr: "1pe", chapters: 5, file: "60.-I Pedro.pdf" },
    "61": { name: "2 Pedro", abbr: "2pe", chapters: 3, file: "61.-II Pedro.pdf" },
    "62": { name: "1 Juan", abbr: "1jo", chapters: 5, file: "62.-I Juan.pdf" },
    "63": { name: "2 Juan", abbr: "2jo", chapters: 1, file: "63.-II Juan.pdf" },
    "64": { name: "3 Juan", abbr: "3jo", chapters: 1, file: "64.-III Juan.pdf" },
    "65": { name: "Judas", abbr: "jud", chapters: 1, file: "65.-Judas.pdf" },
    "66": { name: "Apocalipsis", abbr: "rev", chapters: 22, file: "66.-Apocalipsis.pdf" },
};

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("Please provide book IDs (e.g., bun run scripts/extract-cba.ts 1 2 23)");
        return;
    }

    for (const bookId of args) {
        const config = BOOKS_CONFIG[bookId];
        if (!config) {
            console.error(`Book ID ${bookId} not found in config.`);
            continue;
        }

        const pdfPath = path.join('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data', config.file);
        console.log(`Processing ${config.name} (${pdfPath})...`);
        
        try {
            await extractCBA(pdfPath, OUTPUT_DIR, config.name, config.abbr, config.chapters);
        } catch (error) {
            console.error(`Error processing ${config.name}:`, error);
        }
    }
}

main().catch(console.error);
