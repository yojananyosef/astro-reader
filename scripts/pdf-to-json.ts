import fs from "node:fs";
import path from "node:path";
import pdf from "pdf-parse-fork";

const PDF_PATH = "c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\es_PP54(PP).pdf";
const OUTPUT_PATH = "c:\\Users\\Usuario\\Desktop\\astro-reader\\src\\data\\plan-content\\annual-thematic.json";

interface Section {
  title: string;
  content: string;
  subsections?: Section[];
}

interface Chapter {
  number: number;
  title: string;
  startPage: number;
  endPage: number;
  sections: Section[];
}

interface PDFMetadata {
  author?: string;
  creator?: string;
  producer?: string;
  title?: string;
  version?: string;
  creationDate?: string;
}

interface OutputJSON {
  metadata: PDFMetadata;
  chapters: Chapter[];
}

async function convertPdfToJson() {
  console.log(`🚀 Iniciando conversión de: ${PDF_PATH}`);

  if (!fs.existsSync(PDF_PATH)) {
    console.error("❌ Error: El archivo PDF no existe.");
    process.exit(1);
  }

  try {
    const dataBuffer = fs.readFileSync(PDF_PATH);
    
    // Configuración para pdf-parse
    const options = {
      pagerender: function(pageData: any) {
        return pageData.getTextContent().then(function(textContent: any) {
          let lastY, text = `[[PAGE_${pageData.pageIndex + 1}]]\n`;
          for (let item of textContent.items) {
            if (lastY == item.transform[5] || !lastY){
              text += item.str;
            } else {
              text += '\n' + item.str;
            }
            lastY = item.transform[5];
          }
          return text;
        });
      }
    };

    const data = await pdf(dataBuffer, options);

    console.log(`📄 PDF cargado: ${data.numpages} páginas.`);
    
    const output: OutputJSON = {
      metadata: {
        author: data.info?.Author,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        title: data.info?.Title,
        version: data.version,
        creationDate: data.info?.CreationDate
      },
      chapters: []
    };

    const fullText = data.text;
    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let currentChapter: Chapter | null = null;
    let currentSection: Section | null = null;
    let textBuffer: string[] = [];
    let currentPage = 1;

    // Patrón para detectar capítulos (Ej: "Capítulo 1", "Cap. 1", etc.)
    const chapterRegex = /^(Cap[íi]tulo\s+(\d+)|Cap\.\s+(\d+))\s*[:-]?\s*(.*)/i;
    const sectionRegex = /^[A-ZÁÉÍÓÚÑ\s]{5,60}$/; 
    const indexRegex = /(\.\s*){5,}/; // Puntos con espacios, común en índices

    console.log("🔍 Analizando estructura del documento...");

    let skipUntilContent = true;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detectar cambio de página
      const pageMatch = line.match(/\[\[PAGE_(\d+)\]\]/);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1]);
        // Si ya pasamos la página 20, probablemente ya salimos del índice principal
        if (currentPage > 15) skipUntilContent = false;
        continue;
      }

      // Si detectamos un patrón de índice, ignorar la línea
      if (indexRegex.test(line)) {
        continue;
      }

      // Ignorar líneas muy cortas que parecen números de página o basura
      if (/^\d+$/.test(line) || line.length < 2) continue;
      // Ignorar encabezados repetitivos
      if (line.toLowerCase().includes("patriarcas y profetas")) continue;

      const chapterMatch = line.match(chapterRegex);

      if (chapterMatch) {
        // Una vez que encontramos el primer capítulo real fuera del índice, dejamos de saltar
        if (currentPage > 5) skipUntilContent = false;
        
        if (skipUntilContent) continue;

        // Guardar capítulo anterior
        if (currentChapter) {
          if (currentSection) {
            currentSection.content = textBuffer.join('\n').trim();
            currentChapter.sections.push(currentSection);
          } else if (textBuffer.length > 0) {
            currentChapter.sections.push({
              title: "Introducción",
              content: textBuffer.join('\n').trim()
            });
          }
          currentChapter.endPage = currentPage;
          output.chapters.push(currentChapter);
        }

        const num = parseInt(chapterMatch[2] || chapterMatch[3]);
        let title = chapterMatch[4].trim();
        
        // Limpiar título de posibles restos de índice
        title = title.replace(/[\s\.]+\d+$/, '').replace(/^—/, '').trim();

        // Si el título no está en la misma línea, buscar en la siguiente
        if (!title || title.length < 3) {
          let nextIdx = i + 1;
          while (nextIdx < lines.length && (!lines[nextIdx].trim() || lines[nextIdx].match(/\[\[PAGE_(\d+)\]\]/))) {
            nextIdx++;
          }
          if (nextIdx < lines.length) {
            title = lines[nextIdx].trim().replace(/[\s\.]+\d+$/, '').replace(/^—/, '').trim();
            i = nextIdx;
          }
        }

        currentChapter = {
          number: num,
          title: title || `Capítulo ${num}`,
          startPage: currentPage,
          endPage: currentPage,
          sections: []
        };
        currentSection = null;
        textBuffer = [];
        continue;
      }

      if (skipUntilContent) continue;

      if (sectionRegex.test(line) && line.length < 60 && currentChapter) {
        if (currentSection) {
          currentSection.content = textBuffer.join('\n').trim();
          currentChapter.sections.push(currentSection);
        } else if (textBuffer.length > 0) {
          currentChapter.sections.push({
            title: "Inicio",
            content: textBuffer.join('\n').trim()
          });
        }
        currentSection = {
          title: line,
          content: ""
        };
        textBuffer = [];
        continue;
      }

      textBuffer.push(line);
    }

    // Guardar el último capítulo
    if (currentChapter) {
      if (currentSection) {
        currentSection.content = textBuffer.join('\n').trim();
        currentChapter.sections.push(currentSection);
      } else if (textBuffer.length > 0) {
        currentChapter.sections.push({
          title: "Final",
          content: textBuffer.join('\n').trim()
        });
      }
      currentChapter.endPage = currentPage;
      output.chapters.push(currentChapter);
    }

    // Escribir resultado
    const outputDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

    console.log(`✅ Conversión completada con éxito.`);
    console.log(`📂 Archivo generado en: ${OUTPUT_PATH}`);
    console.log(`📊 Total capítulos: ${output.chapters.length}`);

  } catch (error) {
    console.error("❌ Error durante la conversión:", error);
    process.exit(1);
  }
}

convertPdfToJson();
