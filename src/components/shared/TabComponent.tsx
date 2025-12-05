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
    onTabChange?: (tabId: string) => void;
    variant?: 'primary' | 'secondary';
};

export default function TabComponent({ tabs, defaultTab, onTabChange, variant = 'primary' }: TabComponentProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

    // Actualizar el tab activo cuando cambie defaultTab
    useEffect(() => {
        if (defaultTab && tabs.some(tab => tab.id === defaultTab)) {
            setActiveTab(defaultTab);
        }
    }, [defaultTab, tabs]);

    const colorClasses = variant === 'secondary' 
        ? {
            active: "text-blue-500 bg-blue-50 shadow-sm",
            activeIcon: "text-blue-500",
            activeBar: "bg-blue-500",
            activeBg: "bg-blue-50",
            inactive: "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            inactiveIcon: "text-gray-500",
            barBg: "bg-gray-50"
        }
        : {
            active: "text-blue-600 bg-blue-50 shadow-sm",
            activeIcon: "text-blue-600",
            activeBar: "bg-blue-600",
            activeBg: "bg-blue-50",
            inactive: "text-gray-600 hover:text-gray-800 hover:bg-gray-50",
            inactiveIcon: "text-gray-600",
            barBg: "bg-white"
        };

    return (
        <div className="w-full">
            {/* Barra de Tabs - Diseño moderno */}
            <div className={`${colorClasses.barBg} border-b border-gray-200 shadow-sm`}>
                <div className="flex flex-wrap gap-1 px-2 sm:px-4 justify-center">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    onTabChange?.(tab.id);
                                }}
                                className={`relative px-3 sm:px-4 md:px-6 py-2.5 sm:py-3.5 text-xs sm:text-sm font-medium transition-all duration-300 rounded-t-xl flex items-center justify-center gap-1.5 sm:gap-2 min-w-[48px] ${
                                    activeTab === tab.id
                                        ? colorClasses.active
                                        : colorClasses.inactive
                                }`}
                                title={tab.label}
                            >
                                <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                                    {Icon && (
                                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${activeTab === tab.id ? colorClasses.activeIcon : colorClasses.inactiveIcon}`} />
                                    )}
                                    <span className="hidden sm:inline">{tab.label}</span>
                                </span>
                                {activeTab === tab.id && (
                                    <>
                                        <span className={`absolute bottom-0 left-0 right-0 h-1 ${colorClasses.activeBar} rounded-t-full z-0`}></span>
                                        <span className={`absolute inset-0 ${colorClasses.activeBg} rounded-t-xl -z-10`}></span>
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
