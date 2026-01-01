import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import { BookOpen, Menu, ChevronRight, Bookmark, Star, MessageSquare, ChevronLeft } from "lucide-preact";

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
    return "bible";
  });

  const mainNav = [
    { id: "bible", label: "Biblia", icon: BookOpen, url: "/" },
    { id: "tracking", label: "Seguimiento", icon: Bookmark, url: "/tracker" },
    { id: "plans", label: "Planes", icon: Star, url: "/plans" },
  ];

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    const toggleHandler = () => setOpen(prev => !prev);

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
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
  }, [collapsed]);
  useLayoutEffect(() => {
    const applyOffset = () => {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
      const value = mode === "inline" && isDesktop && !collapsed ? "18rem" : "0.5rem";
      document.documentElement.style.setProperty("--sidebar-offset-left", value);
    };
    applyOffset();
    const onResize = () => applyOffset();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode, collapsed]);

  const goTo = (url: string) => {
    if (url === "#") return;
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
          className={`hidden md:flex shrink-0 sticky top-16 h-[calc(100vh-4rem)] transition-all duration-300 ease-in-out ${collapsed ? 'w-0' : 'w-64'}`}
          style={{ backgroundColor: "transparent", overflow: "hidden" }}
        >
          <aside
            className={`flex flex-col w-64 h-full border-r shadow-none transition-transform duration-300 ease-in-out will-change-transform ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", borderRight: "1px solid color-mix(in srgb, var(--color-text), transparent 85%)" }}
            data-role="reader-inline-sidebar"
            aria-hidden={collapsed}
          >
            <div className="p-2 border-b flex justify-end" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setCollapsed(true);
                  }
                }}
                className={`p-2 rounded-md border surface-card cursor-pointer transition-opacity duration-200 ${collapsed ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                aria-label="Colapsar sidebar"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
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
                        ? "font-bold shadow-sm ring-1 ring-[var(--color-link)]"
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
              <div
                role="button"
                tabIndex={0}
                className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 cursor-pointer hover:opacity-100 transition-opacity text-[var(--color-link)]"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Contáctanos</span>
              </div>
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
              ? "opacity-100 translate-x-0 pointer-events-auto delay-300"
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
      <div className={`fixed inset-0 z-[60] transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside
          className={`absolute left-0 top-0 bottom-0 w-full max-w-sm border-r shadow-2xl transform transition-transform duration-300 flex flex-col ${open ? "translate-x-0" : "-translate-x-full"}`}
          style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", borderRight: "1px solid color-mix(in srgb, var(--color-text), transparent 85%)" }}
        >
          <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[var(--color-link)]" />
              <h2 className="text-lg font-bold">Navegación</h2>
            </div>
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setOpen(false);
                }
              }}
              className="p-2 rounded-md hover:bg-[var(--surface-hover-bg)] text-[var(--color-link)] transition-colors cursor-pointer"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2">
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
                      ? "font-bold shadow-sm ring-1 ring-[var(--color-link)]"
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
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  // Handle contact
                }
              }}
              className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 cursor-pointer hover:opacity-100 transition-opacity"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Contáctanos</span>
            </div>
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
