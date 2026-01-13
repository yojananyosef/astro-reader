import { ArrowLeft, ArrowRight } from "lucide-preact";

interface ArrowNavigationProps {
    prevHref?: string | null;
    nextHref?: string | null;
    onPrev?: (e: MouseEvent) => void;
    onNext?: (e: MouseEvent) => void;
    prevLabel?: string;
    nextLabel?: string;
}

/**
 * Componente de navegación centralizado para las flechas laterales.
 * Implementa el diseño consistente del sistema y soporte responsive.
 */
export default function ArrowNavigation({
    prevHref,
    nextHref,
    onPrev,
    onNext,
    prevLabel = "Anterior",
    nextLabel = "Siguiente",
}: ArrowNavigationProps) {
    return (
        <>
            {(prevHref || onPrev) && (
                <a
                    href={prevHref || "#"}
                    onClick={(e) => {
                        if (onPrev) {
                            e.preventDefault();
                            onPrev(e);
                        }
                    }}
                    class="nav-arrow nav-arrow-prev fixed top-1/2 -translate-y-1/2 z-50 visible ui-protect"
                    aria-label={prevLabel}
                    data-nav-prev
                >
                    <ArrowLeft class="w-5 h-5" />
                </a>
            )}

            {(nextHref || onNext) && (
                <a
                    href={nextHref || "#"}
                    onClick={(e) => {
                        if (onNext) {
                            e.preventDefault();
                            onNext(e);
                        }
                    }}
                    class="nav-arrow nav-arrow-next fixed top-1/2 -translate-y-1/2 z-50 visible ui-protect"
                    aria-label={nextLabel}
                    data-nav-next
                >
                    <ArrowRight class="w-5 h-5" />
                </a>
            )}
        </>
    );
}
