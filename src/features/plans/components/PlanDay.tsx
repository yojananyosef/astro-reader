import { useEffect, useState } from "preact/hooks";
import { ChevronLeft, X, Check, Eye, EyeOff, Info } from "lucide-preact";

type Reading = { label: string; book: string; chapter: number; verses?: string };
type EGWReading = { label: string; link?: string; content?: string };
type Verse = { number: string; text: string; isHighlighted?: boolean };

type Props = {
  planId: string;
  planTitle: string;
  day: number;
  readings: Reading[];
  egwReadings?: EGWReading[];
  description?: string;
  dayTitle?: string;
};

type PlanProgress = {
  [planId: string]: {
    completedDays: number[];
    perDay?: {
      [day: number]: {
        readingsCompleted: string[];
      };
    };
  };
};

const STORAGE_KEY = "reader-plan-progress";

export default function PlanDay({
  planId,
  planTitle,
  day,
  readings,
  egwReadings = [],
  description,
  dayTitle,
}: Props) {
  const [progress, setProgress] = useState<PlanProgress>({});
  const [toast, setToast] = useState<string>("");
  const [openReading, setOpenReading] = useState<Reading | null>(null);
  const [openEgw, setOpenEgw] = useState<EGWReading | null>(null);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [viewMode, setViewMode] = useState<"full" | "partial">("full");

  // Helper to parse verse ranges like "1-15" or "1,2,5"
  const parseVerseRange = (range: string): number[] => {
    const result: number[] = [];
    const parts = range.split(",");
    parts.forEach((part) => {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(Number);
        for (let i = start; i <= end; i++) result.push(i);
      } else {
        result.push(Number(part));
      }
    });
    return result;
  };

  // Helper for tracking EGW readings too
  const egwKey = (r: EGWReading) => `egw-${r.label}`;
  const isEgwCompleted = (r: EGWReading) =>
    !!progress[planId]?.perDay?.[day]?.readingsCompleted?.includes(egwKey(r));

  const toggleEgwCompleted = (r: EGWReading) => {
    const key = egwKey(r);
    setProgress((prev) => {
      const plan = prev[planId] || { completedDays: [] };
      const perDay = plan.perDay || {};
      const current = perDay[day] || { readingsCompleted: [] };
      const set = new Set<string>(current.readingsCompleted);

      if (set.has(key)) set.delete(key);
      else set.add(key);

      const updatedReadings = Array.from(set);
      const allReadingKeys = [
        ...readings.map(r => readingKey(r)),
        ...egwReadings.map(r => egwKey(r))
      ];

      const isAllDone = allReadingKeys.every(k => updatedReadings.includes(k));
      const completedDaysSet = new Set<number>(plan.completedDays);

      if (isAllDone) completedDaysSet.add(day);
      else completedDaysSet.delete(day);

      return {
        ...prev,
        [planId]: {
          completedDays: Array.from(completedDaysSet).sort((a, b) => a - b),
          perDay: {
            ...perDay,
            [day]: { readingsCompleted: updatedReadings }
          }
        }
      };
    });
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProgress(JSON.parse(raw));
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch { }
  }, [progress]);

  const isCompleted =
    !!progress[planId]?.completedDays?.includes(day);
  const readingKey = (r: Reading) => `${r.book}-${r.chapter}`;
  const isReadingCompleted = (r: Reading) =>
    !!progress[planId]?.perDay?.[day]?.readingsCompleted?.includes(readingKey(r));

  const toggleCompleted = () => {
    const willComplete = !isCompleted;
    setProgress((prev) => {
      const plan = prev[planId] || { completedDays: [] };
      const set = new Set<number>(plan.completedDays);

      const perDay = plan.perDay || {};
      const currentDayData = perDay[day] || { readingsCompleted: [] };

      if (willComplete) {
        set.add(day);
        // Marcar todas las lecturas del día como completadas
        const allReadingKeys = [
          ...readings.map(r => readingKey(r)),
          ...egwReadings.map(r => egwKey(r))
        ];
        perDay[day] = { readingsCompleted: allReadingKeys };
      } else {
        set.delete(day);
        // Desmarcar todas las lecturas al desmarcar el día
        perDay[day] = { readingsCompleted: [] };
      }

      return {
        ...prev,
        [planId]: {
          completedDays: Array.from(set).sort((a, b) => a - b),
          perDay: { ...perDay }
        },
      };
    });
    setToast(willComplete ? "Día completado y lecturas marcadas" : "Marcado como pendiente");
    setTimeout(() => setToast(""), 1500);
  };

  const toggleReadingCompleted = (r: Reading) => {
    const key = readingKey(r);
    setProgress((prev) => {
      const plan = prev[planId] || { completedDays: [] };
      const perDay = plan.perDay || {};
      const current = perDay[day] || { readingsCompleted: [] };
      const set = new Set<string>(current.readingsCompleted);

      if (set.has(key)) set.delete(key);
      else set.add(key);

      const updatedReadings = Array.from(set);
      const allReadingKeys = [
        ...readings.map(r => readingKey(r)),
        ...egwReadings.map(r => egwKey(r))
      ];

      const isAllDone = allReadingKeys.every(k => updatedReadings.includes(k));
      const completedDaysSet = new Set<number>(plan.completedDays);

      if (isAllDone) completedDaysSet.add(day);
      else completedDaysSet.delete(day);

      return {
        ...prev,
        [planId]: {
          completedDays: Array.from(completedDaysSet).sort((a, b) => a - b),
          perDay: {
            ...perDay,
            [day]: { readingsCompleted: updatedReadings }
          }
        }
      };
    });
    const active = isReadingCompleted(r);
    setToast(active ? "Lectura marcada como pendiente" : "Lectura completada");
    setTimeout(() => setToast(""), 1500);
  };

  const openReadingModal = async (r: Reading) => {
    setOpenEgw(null);
    setOpenReading(r);
    setIsLoadingContent(true);
    setChapterVerses([]);
    setViewMode(r.verses ? "partial" : "full");

    try {
      const books = import.meta.glob("../../../data/books/*.json");
      const bookKey = Object.keys(books).find(k => k.toLowerCase().endsWith(`/${r.book.toLowerCase()}.json`));
      const loader = bookKey ? books[bookKey] : null;

      if (!loader) {
        setIsLoadingContent(false);
        return;
      }
      const mod = await loader();
      const data = (mod as any).default ?? mod;
      const rawVerses = data?.capitulo?.[String(r.chapter)] ?? {};

      const requiredVerses = r.verses ? parseVerseRange(r.verses) : [];

      const parsedVerses: Verse[] = Object.entries(rawVerses)
        .map(([num, content]) => {
          let text = "";
          if (typeof content === "string") {
            text = content;
          } else if (typeof content === "object" && content !== null) {
            text = (content as any).texto || "";
          }
          const verseNum = parseInt(num);
          const isHighlighted = requiredVerses.length > 0 && requiredVerses.includes(verseNum);

          return { number: num, text, isHighlighted };
        })
        .sort((a, b) => parseInt(a.number) - parseInt(b.number));

      setChapterVerses(parsedVerses);
    } catch {
      setChapterVerses([]);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const openEgwModal = (r: EGWReading) => {
    setOpenReading(null);
    setOpenEgw(r);
  };

  const closeModal = () => {
    setOpenReading(null);
    setOpenEgw(null);
    setChapterVerses([]);
    setIsLoadingContent(false);
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 px-4 md:px-0 space-y-6">
      {toast && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg border animate-fade-in z-50 flex items-center gap-2 whitespace-nowrap"
          style={{
            backgroundColor: "var(--color-bg)",
            color: "var(--color-link)",
            borderColor: "var(--color-link)",
          }}
          aria-live="polite"
        >
          <Check className="w-5 h-5" />
          <span className="font-semibold">{toast}</span>
        </div>
      )}
      <div className="flex items-center justify-between mt-4 md:mt-6">
        <a
          href={`/plans/${planId}`}
          className="p-2 rounded-md border surface-card flex items-center gap-2 transition-colors"
          style={{ textDecoration: "none" }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Volver al plan</span>
        </a>
        <div
          onClick={toggleCompleted}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              toggleCompleted();
            }
          }}
          className={`p-2 rounded-md border surface-card flex items-center gap-2 transition-colors cursor-pointer ${isCompleted ? "animate-fade-in" : ""}`}
        >
          <Check
            className={`w-5 h-5 ${isCompleted ? "text-[var(--color-link)]" : ""}`}
          />
          <span className="text-sm">
            {isCompleted ? "Marcado como completado" : "Marcar día completado"}
          </span>
        </div>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-link)]">
          {planTitle} · Día {day}
        </h1>
        {dayTitle && (
          <h2 className="text-xl font-semibold opacity-90">{dayTitle}</h2>
        )}
        {description && (
          <p className="p-4 rounded-lg border surface-card text-sm leading-relaxed border-l-4 border-l-[var(--color-link)]">
            {description}
          </p>
        )}
      </header>

      <section className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">Lecturas Bíblicas</h3>
          {readings.length === 0 && !egwReadings.length && (
            <div className="p-4 rounded-lg border surface-card">
              Aún no hay lecturas definidas para este día. Te mostraré la estructura al recibir las referencias finales.
            </div>
          )}

          {readings.map((r) => (
            <div
              key={`${r.book}-${r.chapter}`}
              onClick={() => openReadingModal(r)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  openReadingModal(r);
                }
              }}
              className="w-full text-left p-3 rounded-lg border surface-card transition-transform duration-200 flex items-center justify-between cursor-pointer"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-text), transparent 85%)",
              }}
              aria-label={`Abrir ${r.label}`}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.transform = "scale(1.01)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.transform = "scale(1.0)")
              }
            >
              <span className="font-medium">{r.label}</span>
              <div className="flex items-center gap-3">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReadingCompleted(r);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation();
                      toggleReadingCompleted(r);
                    }
                  }}
                  className={`p-1 rounded-md border transition-all cursor-pointer ${isReadingCompleted(r)
                    ? "border-[var(--color-link)] text-[var(--color-link)] bg-transparent opacity-100"
                    : "border-[var(--color-text)] opacity-20 hover:opacity-100 hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
                    }`}
                  aria-label={isReadingCompleted(r) ? `Desmarcar ${r.label}` : `Marcar ${r.label} como completado`}
                  aria-pressed={isReadingCompleted(r)}
                >
                  <Check className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {egwReadings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider opacity-60">Lecturas de Apoyo (EGW)</h3>
            {egwReadings.map((r) => (
              <div
                key={r.label}
                className={`w-full p-3 rounded-lg border surface-card flex items-center justify-between ${r.content ? "cursor-pointer" : ""}`}
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-text), transparent 85%)",
                }}
                onClick={() => r.content && openEgwModal(r)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{r.label}</span>
                  {r.link && (
                    <div className="mt-1">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[var(--color-link)] underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Leer en línea
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEgwCompleted(r);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        toggleEgwCompleted(r);
                      }
                    }}
                    className={`p-1 rounded-md border transition-all cursor-pointer ${isEgwCompleted(r)
                      ? "border-[var(--color-link)] text-[var(--color-link)] bg-transparent opacity-100"
                      : "border-[var(--color-text)] opacity-20 hover:opacity-100 hover:border-[var(--color-link)] hover:text-[var(--color-link)]"
                      }`}
                    aria-label={isEgwCompleted(r) ? `Desmarcar ${r.label}` : `Marcar ${r.label} como completado`}
                    aria-pressed={isEgwCompleted(r)}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {(openReading || openEgw) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "var(--color-bg)",
              opacity: 1
            }}
            onClick={closeModal}
            aria-hidden="true"
          />
          <div className="relative z-50 w-full max-w-2xl mx-4 rounded-xl border surface-card flex flex-col shadow-2xl max-h-[90vh]" style={{ backgroundColor: "var(--color-bg)" }}>
            <div className="p-6 border-b shrink-0" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold" style={{ color: "var(--color-link)" }}>
                    {openReading ? openReading.label : openEgw?.label}
                  </h2>
                  {openReading && openReading.verses && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--color-link)] text-[var(--color-link)] font-medium flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Lectura sugerida
                      </span>
                      <span className="text-xs opacity-60">
                        {chapterVerses.filter(v => v.isHighlighted).length} versículos de {chapterVerses.length}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {openReading && openReading.verses && (
                    <div
                      onClick={() => setViewMode(viewMode === "full" ? "partial" : "full")}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          setViewMode(viewMode === "full" ? "partial" : "full");
                        }
                      }}
                      className="h-9 px-3 rounded-md border surface-card hover:bg-[var(--surface-hover-bg)] transition-colors flex items-center gap-2 text-sm cursor-pointer"
                      title={viewMode === "full" ? "Mostrar solo versículos requeridos" : "Mostrar capítulo completo"}
                    >
                      {viewMode === "full" ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          <span className="hidden sm:inline">Vista Parcial</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Ver Todo</span>
                        </>
                      )}
                    </div>
                  )}
                  <div
                    onClick={closeModal}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        closeModal();
                      }
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-md border surface-card hover:bg-[var(--surface-hover-bg)] transition-colors cursor-pointer"
                    aria-label="Cerrar"
                    style={{ backgroundColor: "var(--color-bg)" }}
                  >
                    <X className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {openReading && openReading.verses && viewMode === "full" && (
                <div className="mt-4 p-3 rounded-lg border surface-card bg-opacity-10 flex gap-3 items-start" style={{ borderColor: "var(--color-link)", backgroundColor: "color-mix(in srgb, var(--color-link), transparent 95%)" }}>
                  <Info className="w-5 h-5 text-[var(--color-link)] shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-[var(--color-link)]">Plan de lectura</p>
                    <p className="opacity-80">Los versículos resaltados son los requeridos para hoy. Puedes leer el capítulo completo si lo deseas.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {isLoadingContent ? (
                <div className="p-8 text-center animate-pulse">Cargando contenido...</div>
              ) : openReading && chapterVerses.length === 0 ? (
                <div className="p-4 rounded-md border surface-card text-center">Sin contenido disponible</div>
              ) : openReading ? (
                <div className="space-y-4 reader-text">
                  {chapterVerses
                    .filter(v => viewMode === "full" || v.isHighlighted)
                    .map((v) => (
                      <div
                        key={v.number}
                        className={`flex gap-3 p-2 -mx-2 rounded transition-all ${v.isHighlighted && viewMode === "full" ? "bg-opacity-10 border-l-4" : ""}`}
                        style={v.isHighlighted && viewMode === "full" ? {
                          backgroundColor: "color-mix(in srgb, var(--color-link), transparent 92%)",
                          borderLeftColor: "var(--color-link)"
                        } : {}}
                      >
                        <sup className={`text-xs font-bold mt-2 select-none min-w-[1.5rem] text-right ${v.isHighlighted ? "text-[var(--color-link)] opacity-100" : "opacity-40"}`}>
                          {v.number}
                        </sup>
                        <p className={`flex-1 m-0 ${v.isHighlighted ? "font-medium" : "opacity-80"}`}>{v.text}</p>
                      </div>
                    ))}
                </div>
              ) : openEgw ? (
                <div className="reader-text whitespace-pre-wrap">
                  {openEgw.content}
                </div>
              ) : null}
            </div>
            <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              {openReading ? (
                <div
                  onClick={() => toggleReadingCompleted(openReading)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleReadingCompleted(openReading);
                    }
                  }}
                  className="px-4 py-2 rounded-md border surface-card flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--surface-hover-bg)]"
                >
                  <Check className={`w-5 h-5 ${isReadingCompleted(openReading) ? "text-[var(--color-link)]" : ""}`} />
                  <span className="text-sm">
                    {isReadingCompleted(openReading) ? "Lectura completada" : "Marcar lectura completada"}
                  </span>
                </div>
              ) : openEgw ? (
                <div
                  onClick={() => toggleEgwCompleted(openEgw)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleEgwCompleted(openEgw);
                    }
                  }}
                  className="px-4 py-2 rounded-md border surface-card flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--surface-hover-bg)]"
                >
                  <Check className={`w-5 h-5 ${isEgwCompleted(openEgw) ? "text-[var(--color-link)]" : ""}`} />
                  <span className="text-sm">
                    {isEgwCompleted(openEgw) ? "Lectura completada" : "Marcar lectura completada"}
                  </span>
                </div>
              ) : null}
              <div
                onClick={closeModal}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    closeModal();
                  }
                }}
                className="px-4 py-2 rounded-md border surface-card cursor-pointer transition-colors hover:bg-[var(--surface-hover-bg)]"
              >
                Cerrar
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
