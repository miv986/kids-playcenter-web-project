import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Panel de Usuario",
    description: "Panel de control de usuario",
    robots: {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
    },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return children;
}

