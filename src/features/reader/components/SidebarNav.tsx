import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import { BookOpen, Menu, ChevronRight, Bookmark, Star, MessageSquare, ChevronLeft, Library, X, Languages } from "lucide-preact";

type Book = { code: string; name: string; chapters: number; section: string };

type Props = {
  books?: Book[];
  showTrigger?: boolean;
  mode?: "overlay" | "inline";
};

export default function SidebarNav({ books = [], showTrigger = false, mode = "inline" }: Props) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => getInitialCollapsed());

  // Initialize active item based on current URL
  const [activeItem, setActiveItem] = useState<string>(() => {
    if (typeof window === "undefined") return "bible";
    const path = window.location.pathname;
    if (path.includes("/tracker")) return "tracking";
    if (path.includes("/plans")) return "plans";
    if (path.includes("/commentary")) return "commentary";
    if (path.includes("/interlinear")) return "interlinear";
    return "bible";
  });

  const mainNav = [
    { id: "bible", label: "Biblia", icon: BookOpen, url: "/" },
    { id: "interlinear", label: "Interlineal", icon: Languages, url: "/interlinear" },
    { id: "commentary", label: "Comentario", icon: Library, url: "/commentary" },
    { id: "tracking", label: "Seguimiento", icon: Bookmark, url: "/tracker" },
    { id: "plans", label: "Planes", icon: Star, url: "/plans" },
  ];

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    const toggleHandler = () => {
      if (window.innerWidth < 768) {
        setOpen(prev => !prev);
      } else {
        setCollapsed(prev => !prev);
      }
    };

    window.addEventListener("open-sidebar", openHandler as EventListener);
    window.addEventListener("close-sidebar", closeHandler as EventListener);
    window.addEventListener("toggle-sidebar", toggleHandler as EventListener);

    return () => {
      window.removeEventListener("open-sidebar", openHandler as EventListener);
      window.removeEventListener("close-sidebar", closeHandler as EventListener);
      window.removeEventListener("toggle-sidebar", toggleHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("reader-sidebar-collapsed", collapsed ? "true" : "false");
      }
      // Actualizar el atributo en el documentElement para que el CSS del Layout responda
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
  }, [collapsed]);

  // ELIMINADO: Ya no necesitamos useLayoutEffect para calcular offsets manuales con JS
  // ya que lo maneja el CSS Grid en ReaderLayout.astro
  
  const goTo = (url: string) => {
    if (url === "#") return;
    setOpen(false); // Cerrar el overlay si está abierto
    window.location.href = url;
  };

  return (
    <>
      {showTrigger && mode === "overlay" && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setOpen(true);
            }
          }}
          className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors flex items-center gap-2 cursor-pointer"
          aria-label="Abrir menú lateral"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-6 h-6" />
          <span className="hidden md:inline text-sm font-semibold">Menú</span>
        </div>
      )}

      {mode === "inline" && (
        <div
          className={`hidden md:flex shrink-0 h-full transition-all duration-300 ease-in-out ui-protect ${collapsed ? 'w-0' : 'w-64'}`}
          style={{ backgroundColor: "transparent", overflow: "hidden" }}
        >
          <aside
            className={`flex flex-col w-64 h-full border-r shadow-none transition-transform duration-300 ease-in-out will-change-transform ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", borderRight: "1px solid color-mix(in srgb, var(--color-text), transparent 85%)" }}
            data-role="reader-inline-sidebar"
            aria-hidden={collapsed}
          >
            <div className="p-1 border-b flex justify-end" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCollapsed(true);
                  }
                }}
                className={`p-1.5 rounded-md border surface-card cursor-pointer transition-opacity duration-200 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                aria-label="Colapsar sidebar"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
              {mainNav.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveItem(item.id);
                      goTo(item.url);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveItem(item.id);
                        goTo(item.url);
                      }
                    }}
                    className={`
                      w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer
                      ${isActive
                        ? "font-bold shadow-sm border border-[var(--color-link)]"
                        : "hover:bg-[var(--surface-hover-bg)] opacity-80 hover:opacity-100"
                      }
                    `}
                    style={isActive ? {
                      backgroundColor: "color-mix(in srgb, var(--color-link), transparent 90%)",
                      color: "var(--color-link)"
                    } : {}}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`} />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <a
                href="https://wa.me/56930599095"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 cursor-pointer hover:bg-[var(--surface-hover-bg)] transition-all text-[var(--color-link)]"
                style={{ textDecoration: 'none' }}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Contáctanos</span>
              </a>
            </div>
          </aside>
        </div>
      )}

      {mode === "inline" && (
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              setCollapsed(false);
            }
          }}
          className={`hidden md:flex fixed left-2 p-2 rounded-md border surface-card z-40 cursor-pointer transition-all duration-300 ${collapsed
            ? "opacity-100 translate-x-0 pointer-events-auto delay-500"
            : "opacity-0 -translate-x-4 pointer-events-none delay-0"
            }`}
          aria-label="Expandir sidebar"
          onClick={() => setCollapsed(false)}
          style={{ top: "calc(4rem + 8px)" }}
          data-role="reader-inline-toggle"
        >
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 md:hidden ui-protect ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} style={{ top: "var(--nav-height, 4rem)" }} />
        <aside
          className={`absolute left-0 bottom-0 w-full max-w-[280px] shadow-2xl transform transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
          style={{ 
            backgroundColor: "var(--color-bg)", 
            color: "var(--color-text)",
            top: "var(--nav-height, 4rem)"
          }}
        >
          <div className="relative h-16 flex items-center justify-center border-b px-4" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
            <h2 className="text-lg font-bold m-0 leading-none">Menú</h2>
            <div
              onClick={() => setOpen(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
            {mainNav.map((item) => {
              const isActive = activeItem === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item.id);
                    goTo(item.url);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setActiveItem(item.id);
                      goTo(item.url);
                    }
                  }}
                  className={`
                    w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all duration-200 cursor-pointer
                    ${isActive
                      ? "font-bold shadow-sm border border-[var(--color-link)]"
                      : "hover:bg-[var(--surface-hover-bg)] opacity-80 hover:opacity-100"
                    }
                  `}
                  style={isActive ? {
                    backgroundColor: "color-mix(in srgb, var(--color-link), transparent 90%)",
                    color: "var(--color-link)"
                  } : {}}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "" : "opacity-70"}`} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
            <a
              href="https://wa.me/56930599095"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 cursor-pointer hover:bg-[var(--surface-hover-bg)] transition-all text-[var(--color-link)]"
              style={{ textDecoration: 'none' }}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Contáctanos</span>
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}

export const getInitialCollapsed = (): boolean => {
  try {
    if (typeof localStorage === "undefined") return false;
    const saved = localStorage.getItem("reader-sidebar-collapsed");
    if (saved === "true") return true;
    if (saved === "false") return false;
    return false;
  } catch {
    return false;
  }
};

export const computeSidebarOffset = (
  mode: "overlay" | "inline",
  width: number
): string => {
  const isDesktop = width >= 768;
  return mode === "inline" && isDesktop ? "18rem" : "0.5rem";
};
