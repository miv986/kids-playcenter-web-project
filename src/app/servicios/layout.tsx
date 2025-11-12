import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Servicios - Actividades y Talleres para Niños",
    description: "Descubre nuestros servicios: fiestas de cumpleaños, talleres de arte, música y baile, cuentacuentos, juegos educativos y actividades grupales. Actividades diseñadas para estimular el desarrollo integral de los niños.",
    keywords: ["servicios ludoteca", "fiestas infantiles", "talleres niños", "actividades educativas", "cuentacuentos", "juegos educativos"],
    openGraph: {
        title: "Servicios - Somriures & Colors",
        description: "Fiestas de cumpleaños, talleres de arte, música, cuentacuentos y más actividades para niños.",
        url: "/servicios",
        type: "website",
        images: [
            {
                url: "/logo.png",
                width: 1200,
                height: 630,
                alt: "Servicios - Somriures & Colors",
            },
        ],
    },
    alternates: {
        canonical: "/servicios",
    },
};

export default function ServiciosLayout({ children }: { children: React.ReactNode }) {
    return children;
}


