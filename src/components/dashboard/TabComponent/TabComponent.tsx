import { ReactNode, useState } from "react";
// Definimos el tipo de cada tab
type Tab = {
    id: string;
    label: string;
    content: ReactNode | (() => ReactNode); // puede ser un componente o una función que devuelve JSX
};

// Definimos las props del componente
type TabComponentProps = {
    tabs: Tab[];
    defaultTab?: string;
};

export default function TabComponent({ tabs, defaultTab }: TabComponentProps) {
    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0].id);

    return (
        <div>
            {/* Barra de Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-100">
                <ul className="flex flex-wrap -mb-px text-sm font-medium justify-center text-center text-gray-500 dark:text-gray-400">
                    {tabs.map((tab) => (
                        <li key={tab.id} className="me-2">
                            <button
                                onClick={() => setActiveTab(tab.id)}
                                className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg group transition-colors ${activeTab === tab.id
                                        ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500"
                                        : "border-transparent hover:text-gray-600 hover:border-gray-800  dark:hover:text-gray-300"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Contenido dinámico */}
            <div className="p-4">
                {tabs.map(
                    (tab) =>
                        activeTab === tab.id && (
                            <div key={tab.id} className="animate-fadeIn">
                                {typeof tab.content === "function"
                                    ? tab.content()
                                    : tab.content}
                            </div>
                        )
                )}
            </div>
        </div>
    );
}
