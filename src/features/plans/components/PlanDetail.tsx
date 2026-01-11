import { useEffect, useMemo, useState } from "preact/hooks";
import { ChevronLeft, ChevronRight, Star, Bookmark, Check } from "lucide-preact";

type Plan = {
  id: string;
  title: string;
  description: string;
  durationDays: number;
  category: string;
  url?: string;
};

const FAVORITES_KEY = "reader-favorite-plans";
const SAVED_KEY = "reader-saved-plans";
const PROGRESS_KEY = "reader-plan-progress";

export default function PlanDetail({ plan }: { plan: Plan }) {
  const [favorites, setFavorites] = useState<Record<string, true>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 8;
  const [savedPlans, setSavedPlans] = useState<Record<string, true>>({});
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
      const rawSaved = localStorage.getItem(SAVED_KEY);
      if (rawSaved) setSavedPlans(JSON.parse(rawSaved));
    } catch { }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch { }
  }, [favorites]);
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedPlans));
    } catch { }
  }, [savedPlans]);

  const isFav = !!favorites[plan.id];
  const toggleFavorite = () => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[plan.id]) delete next[plan.id];
      else next[plan.id] = true;
      return next;
    });
    setToast(isFav ? "Quitado de favoritos" : "Añadido a favoritos");
    setTimeout(() => setToast(""), 1500);
  };

  const totalPages = Math.ceil(plan.durationDays / perPage);
  const days = useMemo(() => {
    return Array.from({ length: plan.durationDays }, (_, i) => i + 1);
  }, [plan.durationDays]);

  const sliceStart = (currentPage - 1) * perPage;
  const visibleDays = days.slice(sliceStart, sliceStart + perPage);
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const list = parsed?.[plan.id]?.completedDays || [];
        setCompletedDays(Array.isArray(list) ? list : []);
      }
    } catch { }
  }, [plan.id, toast, favorites, savedPlans, currentPage]);
  const [savedPulse, setSavedPulse] = useState(false);
  const isSaved = !!savedPlans[plan.id];
  const savePlan = () => {
    setSavedPlans((prev) => {
      const next = { ...prev };
      if (next[plan.id]) {
        delete next[plan.id];
        setToast("Plan quitado");
      } else {
        next[plan.id] = true;
        setToast("Plan guardado");
      }
      return next;
    });
    setSavedPulse(true);
    setTimeout(() => {
      setSavedPulse(false);
      setToast("");
    }, 2000);
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
          href="/plans"
          className="p-2 rounded-md border surface-card flex items-center gap-2"
          style={{ textDecoration: "none" }}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">Volver</span>
        </a>
        <div className="flex items-center gap-2">
          <div
            onClick={toggleFavorite}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                toggleFavorite();
              }
            }}
            className="p-2 rounded-md border surface-card transition-colors cursor-pointer"
            aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
            title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
          >
            <Star
              className={`w-5 h-5 ${isFav ? "text-[var(--color-link)] fill-current" : ""}`}
            />
          </div>
          <div
            onClick={savePlan}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                savePlan();
              }
            }}
            className={`p-2 rounded-md border surface-card flex items-center gap-2 transition-colors cursor-pointer ${savedPulse ? "animate-fade-in" : ""}`}
            title="Guardar plan"
            aria-pressed={isSaved}
          >
            {isSaved ? <Check className="w-5 h-5 text-[var(--color-link)]" /> : <Bookmark className="w-5 h-5" />}
            <span className="text-sm">{isSaved ? "Guardado" : "Guardar"}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-link)]">
          {plan.title}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
            {plan.category}
          </span>
          <span
            className="text-xs font-mono px-2 py-0.5 rounded"
            style={{ backgroundColor: "var(--surface-muted-border)" }}
          >
            {plan.durationDays} días
          </span>
        </div>
        <p className="opacity-80">{plan.description}</p>
      </div>

      {(() => {
        const percent = Math.round((completedDays.length / plan.durationDays) * 100);
        return (
          <div className="p-4 rounded-xl border surface-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Resumen de avance</span>
              <span className="text-sm font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "var(--surface-muted-border)" }}>
                {completedDays.length}/{plan.durationDays} · {percent}%
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${percent}%`, backgroundColor: "var(--color-link)" }}
              />
            </div>
          </div>
        );
      })()}

      <div className="p-4 rounded-xl border surface-card space-y-4">
        <div className="flex items-center justify-between mt-4">
          <span className="font-semibold">Progreso por días</span>
          <div className="flex items-center gap-2">
            <div
              onClick={() => currentPage > 1 && setCurrentPage((p) => Math.max(1, p - 1))}
              role="button"
              tabIndex={currentPage <= 1 ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (currentPage > 1) setCurrentPage((p) => Math.max(1, p - 1));
                }
              }}
              className={`px-4 py-2 rounded-md border surface-card transition-colors flex items-center justify-center gap-2 ${currentPage <= 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              aria-label="Día anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </div>
            <span className="text-sm">
              {currentPage}/{totalPages}
            </span>
            <div
              onClick={() => currentPage < totalPages && setCurrentPage((p) => Math.min(totalPages, p + 1))}
              role="button"
              tabIndex={currentPage >= totalPages ? -1 : 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (currentPage < totalPages) setCurrentPage((p) => Math.min(totalPages, p + 1));
                }
              }}
              className={`px-4 py-2 rounded-md border surface-card transition-colors flex items-center justify-center gap-2 ${currentPage >= totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              aria-label="Siguiente día"
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {visibleDays.map((d) => (
            <a
              key={d}
              href={`/plans/${plan.id}/day/${d}`}
              className={`text-center p-2 rounded-md border flex items-center justify-center gap-1 ${completedDays.includes(d) ? "animate-fade-in shadow-sm" : ""}`}
              style={{
                borderColor: completedDays.includes(d)
                  ? "var(--color-link)"
                  : "color-mix(in srgb, var(--color-text), transparent 85%)",
                backgroundColor: completedDays.includes(d)
                  ? "color-mix(in srgb, var(--color-link), transparent 92%)"
                  : undefined,
                color: completedDays.includes(d)
                  ? "var(--color-link)"
                  : undefined,
                textDecoration: "none",
                borderWidth: completedDays.includes(d) ? "2px" : "1px"
              }}
            >
              <span>{d}</span>
              {completedDays.includes(d) && (
                <Check className="w-3 h-3" strokeWidth={3} />
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
