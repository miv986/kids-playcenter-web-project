import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Precios y Paquetes - Tarifas de Nuestros Servicios",
    description: "Consulta nuestros precios y paquetes para fiestas de cumpleaños, guardería, talleres y actividades. Ofertas especiales y descuentos disponibles.",
    keywords: ["precios ludoteca", "tarifas guardería", "precios fiestas infantiles", "paquetes ludoteca", "ofertas actividades niños"],
    openGraph: {
        title: "Precios y Paquetes - Somriures & Colors",
        description: "Consulta nuestras tarifas y paquetes para todos nuestros servicios.",
        url: "/precios",
        type: "website",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Precios - Somriures & Colors",
            },
        ],
    },
    alternates: {
        canonical: "/precios",
    },
};

export default function PreciosLayout({ children }: { children: React.ReactNode }) {
    return children;
}


