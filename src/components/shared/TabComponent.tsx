import { ReactNode, useState, useEffect } from "react";
import { LucideIcon } from "lucide-react";

type Tab = {
    id: string;
    label: string;
    content: ReactNode | (() => ReactNode);
    icon?: LucideIcon;
};

type TabComponentProps = {
    tabs: Tab[];
    defaultTab?: string;
};

export default function TabComponent({ tabs, defaultTab }: TabComponentProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

    // Actualizar el tab activo cuando cambie defaultTab
    useEffect(() => {
        if (defaultTab && tabs.some(tab => tab.id === defaultTab)) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab, tabs]);

    return (
        <div className="w-full">
            {/* Barra de Tabs - Diseño moderno */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="flex flex-wrap gap-1 px-4 justify-center">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-4 md:px-6 py-3.5 text-sm font-medium transition-all duration-300 rounded-t-xl flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? "text-blue-600 bg-blue-50 shadow-sm"
                                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                                }`}
                                title={tab.label}
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {Icon && (
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'}`} />
                                    )}
                                    <span className="hidden md:inline">{tab.label}</span>
                                </span>
                                {activeTab === tab.id && (
                                    <>
                                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full z-0"></span>
                                        <span className="absolute inset-0 bg-blue-50 rounded-t-xl -z-10"></span>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Contenido dinámico - Mantener montados pero ocultos */}
            <div className="bg-gray-50">
                {tabs.map((tab) => (
                    <div 
                        key={tab.id} 
                        className={activeTab === tab.id ? "block" : "hidden"}
                    >
                        {typeof tab.content === "function"
                            ? tab.content()
                            : tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
