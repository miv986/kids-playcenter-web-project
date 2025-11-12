import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Calendario - Reserva tu Visita",
    description: "Consulta nuestro calendario de actividades y reserva tu visita. Disponibilidad de horarios para fiestas, talleres y guardería.",
    keywords: ["calendario ludoteca", "reservar visita", "horarios actividades", "disponibilidad ludoteca"],
    openGraph: {
        title: "Calendario - Somriures & Colors",
        description: "Reserva tu visita y consulta la disponibilidad de nuestras actividades.",
        url: "/calendario",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
    },
    alternates: {
        canonical: "/calendario",
    },
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
    return children;
}


