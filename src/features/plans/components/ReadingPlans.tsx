import { useEffect, useMemo, useState } from "preact/hooks";
import { Search, Star, Bookmark, Check } from "lucide-preact";
import plansData from "../../../data/plans.json";

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

export default function ReadingPlans() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [favorites, setFavorites] = useState<Record<string, true>>({});
  const [savedPlans, setSavedPlans] = useState<Record<string, true>>({});
  const [toast, setToast] = useState<string>("");
  const [savedPulseId, setSavedPulseId] = useState<string | null>(null);
  const [planProgress, setPlanProgress] = useState<Record<string, { completedDays: number[] }>>({});

  const categories = useMemo(() => {
    const set = new Set<string>();
    plansData.forEach((p) => set.add(p.category));
    return ["todos", "guardados", "completados", ...Array.from(set)];
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
      const rawSaved = localStorage.getItem(SAVED_KEY);
      if (rawSaved) setSavedPlans(JSON.parse(rawSaved));
      const rawProgress = localStorage.getItem(PROGRESS_KEY);
      if (rawProgress) setPlanProgress(JSON.parse(rawProgress));
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plansData.filter((p) => {
      const saved = !!savedPlans[p.id];
      const completedCount = planProgress[p.id]?.completedDays?.length || 0;
      const isCompleted = completedCount >= p.durationDays;
      let matchesCategory =
        activeCategory === "todos" || p.category === activeCategory;
      if (activeCategory === "guardados") matchesCategory = saved;
      if (activeCategory === "completados") matchesCategory = isCompleted;
      const matchesQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
    const active = !!favorites[id];
    setToast(active ? "Quitado de favoritos" : "Añadido a favoritos");
    setTimeout(() => setToast(""), 1500);
  };

  const savePlan = (id: string) => {
    setSavedPlans((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        setToast("Plan quitado");
      } else {
        next[id] = true;
        setToast("Plan guardado");
      }
      setSavedPulseId(id);
      return next;
    });
    setTimeout(() => {
      setSavedPulseId((curr) => (curr === id ? null : curr));
      setToast("");
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 md:px-8">
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
      <header className="py-8 space-y-4">
        <h1 className="text-3xl font-bold text-[var(--color-link)]">
          Planes de Lectura
        </h1>
        <p className="opacity-80">
          Explora planes organizados por categorías, busca y marca tus
          favoritos. Diseño coherente con la lectura accesible.
        </p>

        {/* Search + Favorites Badge */}
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 flex items-center gap-2 p-3 rounded-lg border surface-card">
            <Search className="w-5 h-5 opacity-60" />
            <input
              value={query}
              onInput={(e) =>
                setQuery((e.target as HTMLInputElement).value ?? "")
              }
              placeholder="Buscar planes por título o descripción"
              className="flex-1 bg-transparent outline-none"
              aria-label="Buscar planes"
            />
          </div>
          <div
            className="px-3 py-2 rounded-lg border surface-card flex items-center gap-2"
            title="Planes marcados como favoritos"
          >
            <Star className="w-5 h-5 text-[var(--color-link)]" />
            <span className="text-sm font-semibold">
              {Object.keys(favorites).length} favoritos
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map((cat) => {
            const active = cat === activeCategory;
            return (
              <div
                key={cat}
                onClick={() => setActiveCategory(cat)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setActiveCategory(cat);
                  }
                }}
                className={`px-3 py-2 rounded-lg border transition-all cursor-pointer ${active
                  ? "ring-1 ring-[var(--color-link)] font-bold"
                  : "opacity-80 hover:opacity-100"
                  }`}
                style={
                  active
                    ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--color-link), transparent 90%)",
                      color: "var(--color-link)",
                    }
                    : {}
                }
              >
                {cat === "todos" ? "Todos" : cat === "guardados" ? "Guardados" : cat === "completados" ? "Completados" : cat}
              </div>
            );
          })}
        </div>
      </header>

      {/* Plans Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((plan) => {
          const isFav = !!favorites[plan.id];
          return (
            <article
              key={plan.id}
              className="group p-5 rounded-xl border surface-card transition-all duration-200 flex flex-col h-full"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-lg font-bold line-clamp-1">{plan.title}</h3>
                <div
                  aria-label={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                  onClick={() => toggleFavorite(plan.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      toggleFavorite(plan.id);
                    }
                  }}
                  className="p-2 rounded-md border surface-card transition-colors cursor-pointer flex-shrink-0"
                  title={isFav ? "Quitar de favoritos" : "Agregar a favoritos"}
                >
                  <Star
                    className={`w-5 h-5 ${isFav ? "text-[var(--color-link)] fill-current" : "opacity-70"
                      }`}
                  />
                </div>
              </div>

              <p className="text-sm opacity-80 mb-4 line-clamp-2 h-[2.5rem]">{plan.description}</p>

              <div className="mt-auto space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                    {plan.category}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "var(--surface-muted-border)" }}>
                    {plan.durationDays} días
                  </span>
                </div>

                {(() => {
                  const completed = planProgress[plan.id]?.completedDays?.length || 0;
                  const percent = Math.round((completed / plan.durationDays) * 100);
                  return (
                    <div>
                      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "color-mix(in srgb, var(--color-text), transparent 90%)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%`, backgroundColor: "var(--color-link)" }}
                        />
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        {percent}% completado
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <a
                    href={`/plans/${plan.id}`}
                    className="flex-1 text-center p-2 rounded-md font-semibold"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--color-link), transparent 90%)",
                      color: "var(--color-link)",
                      border: "1px solid var(--color-link)",
                      textDecoration: "none"
                    }}
                    aria-label="Abrir plan"
                  >
                    Ver plan
                  </a>
                  <div
                    onClick={() => savePlan(plan.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        savePlan(plan.id);
                      }
                    }}
                    className="p-2 rounded-md border surface-card flex items-center gap-2 cursor-pointer transition-opacity"
                    aria-label="Guardar plan"
                    title="Guardar plan favorito"
                    aria-pressed={!!savedPlans[plan.id]}
                  >
                    <span className="inline-flex items-center gap-2">
                      {savedPlans[plan.id] ? (
                        <Check className={`w-5 h-5 text-[var(--color-link)] ${savedPulseId === plan.id ? "animate-fade-in" : ""}`} />
                      ) : (
                        <Bookmark className="w-5 h-5" />
                      )}
                      <span className="text-sm">
                        {savedPlans[plan.id] ? "Guardado" : "Guardar"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
