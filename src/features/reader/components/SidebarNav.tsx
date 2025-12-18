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
  const [activeItem, setActiveItem] = useState<string>("bible");

  const mainNav = [
    { id: "bible", label: "Biblia", icon: BookOpen, url: "/" },
    { id: "tracking", label: "Seguimiento", icon: Bookmark, url: "#" },
    { id: "plans", label: "Planes", icon: Star, url: "#" },
  ];

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");
    } catch { }
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener("open-sidebar", openHandler as EventListener);
    window.addEventListener("close-sidebar", closeHandler as EventListener);
    return () => {
      window.removeEventListener("open-sidebar", openHandler as EventListener);
      window.removeEventListener("close-sidebar", closeHandler as EventListener);
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
      const value = mode === "inline" && isDesktop ? "18rem" : "0.5rem";
      document.documentElement.style.setProperty("--sidebar-offset-left", value);
    };
    applyOffset();
    const onResize = () => applyOffset();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode]);

  const goTo = (url: string) => {
    if (url === "#") return;
    window.location.href = url;
  };

  return (
    <>
      {showTrigger && mode === "overlay" && (
        <button
          className="p-2 rounded-md hover:bg-theme-text/5 text-theme-text transition-colors flex items-center gap-2"
          aria-label="Abrir menú lateral"
          onClick={() => setOpen(true)}
        >
          <Menu className="w-6 h-6" />
          <span className="hidden md:inline text-sm font-semibold">Menú</span>
        </button>
      )}

      {mode === "inline" && (
        <div
          className="hidden md:flex w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)]"
          style={{ backgroundColor: "transparent" }}
        >
          <aside
            className={`flex flex-col w-64 h-full border-r shadow-none transition-transform duration-300 ease-out will-change-transform ${collapsed ? "-translate-x-full" : "translate-x-0"}`}
            style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)", borderRight: "1px solid color-mix(in srgb, var(--color-text), transparent 85%)" }}
            data-role="reader-inline-sidebar"
            aria-hidden={collapsed}
          >
            <div className="p-2 border-b flex justify-end" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <button
                className="p-2 rounded-md border surface-card"
                aria-label="Colapsar sidebar"
                onClick={() => setCollapsed(true)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {mainNav.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveItem(item.id);
                    goTo(item.url);
                  }}
                  className={`w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 ${activeItem === item.id ? "ring-2 ring-[var(--color-link)]" : ""}`}
                >
                  <item.icon className="w-5 h-5 opacity-80" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
              <button className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3">
                <MessageSquare className="w-4 h-4" />
                <span className="text-sm">Contáctanos</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {mode === "inline" && collapsed && (
        <button
          className="hidden md:flex fixed left-2 p-2 rounded-full border surface-card z-40"
          aria-label="Expandir sidebar"
          onClick={() => setCollapsed(false)}
          style={{ top: "calc(4rem + 8px)" }}
          data-role="reader-inline-toggle"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
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
            <button
              className="p-2 rounded-md transition-colors"
              style={{ backgroundColor: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--color-text), transparent 95%)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              onClick={() => setOpen(false)}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            {mainNav.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id);
                  goTo(item.url);
                }}
                className={`w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3 ${activeItem === item.id ? "ring-2 ring-[var(--color-link)]" : ""}`}
              >
                <item.icon className="w-5 h-5 opacity-80" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: "color-mix(in srgb, var(--color-text), transparent 85%)" }}>
            <button className="w-full text-left p-3 rounded-lg border surface-card flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Contáctanos</span>
            </button>
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
