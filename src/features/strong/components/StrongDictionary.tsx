import { useState, useEffect, useMemo } from "preact/hooks";
import { Search, ChevronLeft, ChevronRight, Volume2 } from "lucide-preact";
import { fetchWithCache } from "../../../utils/fetchWithCache";
import ArrowNavigation from "../../../components/common/ArrowNavigation";

export default function StrongDictionary() {
  const [data, setData] = useState<{ hebrew: any; greek: any }>({ hebrew: {}, greek: {} });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    async function fetchData() {
      try {
        const json = await fetchWithCache<any>("/data/strong/strong-data.json");
        setData(json);
        
        // Si hay un parámetro de búsqueda en la URL, aplicarlo después de cargar
        const params = new URLSearchParams(window.location.search);
        const q = params.get("search");
        if (q) setSearchTerm(q);
      } catch (e) {
        console.error("Error loading strong data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredItems = useMemo(() => {
    const items = Object.entries(data.hebrew).map(([id, details]: [string, any]) => ({
      id: `H${id}`,
      ...details
    }));
    
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    return items.filter(item => 
      item.id.toLowerCase().includes(term) ||
      (item.originalWord && item.originalWord.toLowerCase().includes(term)) ||
      (item.definition && item.definition.toLowerCase().includes(term)) ||
      (item.pronunciation && item.pronunciation.toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const playAudio = (id: string) => {
    // Los archivos están sin la H (ej: 1.mp3)
    const numericId = id.replace(/^[HG]/, "");
    const audio = new Audio(`/audio/strong/${numericId}.mp3`);
    audio.play().catch(e => {
      console.error("Error audio:", e);
      // No alertar al usuario, simplemente no se reproduce
    });
  };

  if (loading && Object.keys(data).length === 0) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-link)]"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text)]">Diccionario de Strong de hebreo</h1>
          <p className="text-[var(--color-text)] opacity-60 text-sm">
            Displaying items {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} in total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Textos a buscar"
              value={searchTerm}
              onInput={(e) => {
                setSearchTerm(e.currentTarget.value);
                setCurrentPage(1);
              }}
              className="pl-4 pr-10 py-2 bg-[var(--color-bg)] border border-[var(--color-text)] border-opacity-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-link)] w-64 text-[var(--color-text)] h-[40px]"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text)] opacity-40 pointer-events-none" />
          </div>
          <button className="bg-[var(--surface-muted-bg)] border border-[var(--surface-muted-border)] rounded-xl hover:bg-[var(--surface-hover-bg)] transition-all w-[40px] h-[40px] flex items-center justify-center flex-shrink-0 group/btn">
            <Search className="w-5 h-5 text-[var(--color-link)] group-hover/btn:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      <ArrowNavigation 
        onPrev={currentPage > 1 ? () => setCurrentPage(p => p - 1) : undefined}
        onNext={currentPage < totalPages ? () => setCurrentPage(p => p + 1) : undefined}
        prevLabel="Página anterior"
        nextLabel="Siguiente página"
      />

      <div className="bg-[var(--color-bg)] rounded-2xl border border-[var(--color-text)] border-opacity-5 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--color-text)] border-opacity-5 text-sm font-medium text-[var(--color-text)] opacity-40">
              <th className="px-6 py-4">Cód.</th>
              <th className="px-6 py-4">Palab.Orig.</th>
              <th className="px-6 py-4">Pron.</th>
              <th className="px-6 py-4">Definición</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-text)] divide-opacity-5">
            {paginatedItems.map((item) => (
              <tr key={item.id} className="hover:bg-[var(--color-link)] transition-colors group border-b border-[var(--color-text)] border-opacity-5">
                <td className="px-6 py-4">
                  <a 
                    href={`/strong/${item.id}`} 
                    className="font-bold hover:underline transition-colors block text-[var(--color-link)] group-hover:!text-white" 
                    data-astro-prefetch
                  >
                    {item.id.replace(/^[HG]/, '')}
                  </a>
                </td>
                <td className="px-6 py-4 font-hebrew text-4xl text-[var(--color-text)] group-hover:text-white transition-colors" dir="rtl">
                  {item.originalWord}
                </td>
                <td className="px-6 py-4 italic text-[var(--color-link)] font-medium group-hover:text-white/90 transition-colors">
                  {item.pronunciation}
                </td>
                <td className="px-6 py-4 text-[var(--color-text)] opacity-80 text-sm max-w-md group-hover:text-white group-hover:opacity-100 transition-all">
                  {item.definition}
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => playAudio(item.id)}
                    className="p-2 rounded-lg bg-transparent text-[var(--color-text)] opacity-30 group-hover:opacity-100 group-hover:text-white hover:bg-[var(--surface-hover-bg)] group-hover:hover:bg-white/20 transition-all"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
