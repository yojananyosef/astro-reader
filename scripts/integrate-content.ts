import fs from 'fs';
import path from 'path';

const SOURCE_PATH = path.join(process.cwd(), 'src/data/plan-content/es_PP54(PP).json');
const TARGET_PATH = path.join(process.cwd(), 'src/data/plan-content/annual-thematic.json');

interface SourceChapter {
  number: number;
  title: string;
  sections: { title: string; content: string }[];
}

interface SourceData {
  metadata: any;
  chapters: SourceChapter[];
}

interface EgwEntry {
  label: string;
  content?: string;
}

interface DayData {
  title: string;
  bible: any[];
  egw: EgwEntry[];
  description: string;
}

interface TargetData {
  [key: string]: DayData;
}

async function integrateContent() {
  console.log(`🔍 Iniciando integración dinámica...`);
  console.log(`📂 Origen: ${SOURCE_PATH}`);
  console.log(`📂 Destino: ${TARGET_PATH}`);

  try {
    // 1. Leer archivos
    if (!fs.existsSync(SOURCE_PATH)) {
      throw new Error(`Archivo origen no encontrado: ${SOURCE_PATH}`);
    }
    if (!fs.existsSync(TARGET_PATH)) {
      throw new Error(`Archivo destino no encontrado: ${TARGET_PATH}`);
    }

    const sourceData: SourceData = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf-8'));
    const targetData: TargetData = JSON.parse(fs.readFileSync(TARGET_PATH, 'utf-8'));

    // Crear un mapa de capítulos para búsqueda rápida
    const chapterMap = new Map<number, string>();
    sourceData.chapters.forEach(ch => {
      const fullContent = ch.sections.map(s => s.content).join('\n\n').trim();
      chapterMap.set(ch.number, fullContent);
    });

    console.log(`📊 Capítulos cargados del origen: ${sourceData.chapters.length}`);

    let updatedDays = 0;
    let updatedEntries = 0;

    // 2. Mapear e integrar
    for (const dayKey in targetData) {
      const day = targetData[dayKey];
      let dayUpdated = false;

      for (const entry of day.egw) {
        // Extraer número de capítulo del label (ej: "Cap. 2")
        const match = entry.label.match(/Cap\.\s*(\d+)/i);
        if (match) {
          const chapterNumber = parseInt(match[1]);
          const content = chapterMap.get(chapterNumber);

          if (content) {
            entry.content = content;
            updatedEntries++;
            dayUpdated = true;
          } else {
            console.warn(`⚠️ No se encontró contenido para el capítulo ${chapterNumber} (Día ${dayKey})`);
          }
        }
      }

      if (dayUpdated) updatedDays++;
    }

    // 3. Guardar resultado preservando formato
    fs.writeFileSync(TARGET_PATH, JSON.stringify(targetData, null, 4), 'utf-8');

    console.log(`\n✅ Integración completada con éxito.`);
    console.log(`📈 Resumen:`);
    console.log(`   - Días actualizados: ${updatedDays}`);
    console.log(`   - Entradas EGW completadas: ${updatedEntries}`);
    console.log(`📂 Archivo actualizado: ${TARGET_PATH}`);

  } catch (error: any) {
    console.error(`❌ Error durante la integración: ${error.message}`);
    process.exit(1);
  }
}

integrateContent();
