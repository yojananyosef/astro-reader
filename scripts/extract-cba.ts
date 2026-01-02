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
    
    const book: any = {
        metadata: {
            name: bookName,
            abbreviation: abbreviation,
            totalChapters: totalChapters
        },
        introduction: null,
        chapters: []
    };

    // Extract Introduction (everything before CAPÍTULO 1)
    const firstChapterMatch = text.search(/CAP[ÍI]TULO\s+1\b/i);
    console.log(`First chapter match index: ${firstChapterMatch}`);
    if (firstChapterMatch !== -1) {
        const introText = text.substring(0, firstChapterMatch).trim();
        console.log(`Intro text length: ${introText.length}`);
        
        const lines = introText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const fullTitle = lines[0] || "";
        const subtitle = lines[1] || "";
        
        const sections: IntroductionSection[] = [];
        
        // Find section markers like "1. Título.", "2. Autor.", etc.
        const mainSections = ["Título", "Autor", "Marco histórico", "Tema", "Bosquejo"];
        const sectionOffsets: { title: string, index: number }[] = [];
        
        // Add "INTRODUCCIÓN" as first section if it exists
        const introTitleMatch = introText.match(/INTRODUCCI[ÓO]N/i);
        if (introTitleMatch) {
            sectionOffsets.push({ title: "INTRODUCCIÓN", index: introTitleMatch.index! });
        }

        mainSections.forEach((s, i) => {
            const regex = new RegExp(`\\n(${i + 1}\\.\\s+${s}[^\\n]*)\\n`, 'g');
            let match;
            while ((match = regex.exec(introText)) !== null) {
                sectionOffsets.push({ title: match[1].trim(), index: match.index });
            }
        });
        
        sectionOffsets.sort((a, b) => a.index - b.index);

        for (let i = 0; i < sectionOffsets.length; i++) {
            const currentS = sectionOffsets[i];
            const nextS = sectionOffsets[i + 1];
            let content = introText.substring(currentS.index + currentS.title.length, nextS ? nextS.index : introText.length).trim();
            
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

    // Split text by "CAPÍTULO X"
    // We only want "CAPÍTULO X" when it's on its own line or at the start of a block
    const chapterRegex = /\nCAP[ÍI]TULO\s+(\d+)/gi;
    let match;
    const chapterOffsets: { num: number, index: number }[] = [];

    while ((match = chapterRegex.exec(text)) !== null) {
        chapterOffsets.push({ num: parseInt(match[1]), index: match.index });
    }

    const tempChapters: Map<number, ChapterCommentary> = new Map();

    for (let i = 0; i < chapterOffsets.length; i++) {
        const current = chapterOffsets[i];
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
        
        while ((vMatch = verseRegex.exec(mainChapterText)) !== null) {
            verseOffsets.push({ num: parseInt(vMatch[1]), index: vMatch.index });
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

    const outputPath = path.join(outputDir, `${abbreviation.toLowerCase()}.json`);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(book, null, 4), 'utf-8');
    console.log(`Saved to ${outputPath}`);
}

const OUTPUT_DIR = 'c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\commentary';

async function main() {
    // Genesis
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\1.-Genesis.pdf', OUTPUT_DIR, "Génesis", "Gen", 50);

    // Exodus
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\2.-Exodo.pdf', OUTPUT_DIR, "Éxodo", "Exo", 40);

    // Leviticus
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\3.-Levitico.pdf', OUTPUT_DIR, "Levítico", "Lev", 27);

    // Numbers
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\4.-Numeros.pdf', OUTPUT_DIR, "Números", "Num", 36);

    // Deuteronomy
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\5.-Deuteronomio.pdf', OUTPUT_DIR, "Deuteronomio", "Deu", 34);

    // Joshua
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\6.-Josue.pdf', OUTPUT_DIR, "Josué", "Jos", 24);

    // Judges
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\7.-Jueces.pdf', OUTPUT_DIR, "Jueces", "Jue", 21);

    // Ruth
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\8.-Rut.pdf', OUTPUT_DIR, "Rut", "Rut", 4);

    // 1 Samuel
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\9.-I Samuel.pdf', OUTPUT_DIR, "1 Samuel", "1sa", 31);

    // 2 Samuel
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\10.-II Samuel.pdf', OUTPUT_DIR, "2 Samuel", "2sa", 24);

    // 1 Kings
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\11.-I Reyes.pdf', OUTPUT_DIR, "1 Reyes", "1re", 22);

    // 2 Kings
    // await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\12.-II Reyes.pdf', OUTPUT_DIR, "2 Reyes", "2re", 25);

    // 1 Chronicles
    await extractCBA('c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\13.-I Cronicas.pdf', OUTPUT_DIR, "1 Crónicas", "1cr", 29);
}

main().catch(console.error);
