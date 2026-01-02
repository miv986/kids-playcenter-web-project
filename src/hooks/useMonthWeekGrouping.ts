import { useState, useCallback, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

interface MonthWeekGroupingConfig<T> {
    items: T[];
    getDate: (item: T) => Date;
    getTime?: (item: T) => Date | string; // Para ordenar por hora dentro de cada fecha
    selectedDate?: Date;
    loadedMonths: Set<string>;
    loadingMonths: Set<string>;
}

interface WeekData<T> {
    weekStart: Date;
    weekEnd: Date;
    items: T[];
    totalItems: number;
}

interface MonthData<T> {
    monthStart: Date;
    monthEnd: Date;
    monthKey: string;
    weeks: WeekData<T>[];
    totalItems: number;
    isLoaded: boolean;
    isLoading: boolean;
}

export function useMonthWeekGrouping<T>({
    items,
    getDate,
    getTime,
    selectedDate,
    loadedMonths,
    loadingMonths
}: MonthWeekGroupingConfig<T>): MonthData<T>[] {
    return useMemo(() => {
        if (items.length === 0 || selectedDate) return [];

        // Obtener todas las fechas únicas
        const uniqueDates = Array.from(
            new Set(items.map(item => {
                const date = getDate(item);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            }))
        ).map(timestamp => new Date(timestamp));

        if (uniqueDates.length === 0) return [];

        // Encontrar el rango de fechas
        const minDate = new Date(Math.min(...uniqueDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...uniqueDates.map(d => d.getTime())));

        // Obtener todos los meses en el rango
        const months = eachMonthOfInterval({ start: minDate, end: maxDate });

        // Agrupar items por mes y luego por semanas
        const monthsData = months.map(monthStart => {
            const monthEnd = endOfMonth(monthStart);
            const monthItems = items.filter(item => {
                const itemDate = getDate(item);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate >= startOfMonth(monthStart) && itemDate <= monthEnd;
            });

            // Obtener todas las semanas en el mes
            const weeks = eachWeekOfInterval(
                { start: startOfMonth(monthStart), end: monthEnd },
                { weekStartsOn: 1 } // Lunes
            );

            // Agrupar items por semana dentro del mes
            const weeksData = weeks.map(weekStart => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                const weekItems = monthItems.filter(item => {
                    const itemDate = getDate(item);
                    itemDate.setHours(0, 0, 0, 0);
                    return isWithinInterval(itemDate, { start: weekStart, end: weekEnd });
                });

                // Ordenar items por fecha descendente (más recientes primero) y luego por hora ascendente
                const sortedItems = weekItems.sort((a, b) => {
                    const dateA = getDate(a).getTime();
                    const dateB = getDate(b).getTime();
                    if (dateA !== dateB) {
                        return dateB - dateA; // Fecha descendente
                    }
                    // Si es la misma fecha, ordenar por hora ascendente si hay getTime
                    if (getTime) {
                        const timeA = typeof getTime(a) === 'string' 
                            ? new Date(getTime(a) as string).getTime() 
                            : (getTime(a) as Date).getTime();
                        const timeB = typeof getTime(b) === 'string' 
                            ? new Date(getTime(b) as string).getTime() 
                            : (getTime(b) as Date).getTime();
                        return timeA - timeB;
                    }
                    return 0;
                });

                return {
                    weekStart,
                    weekEnd,
                    items: sortedItems,
                    totalItems: weekItems.length
                };
            }).filter(week => week.totalItems > 0); // Solo semanas con items

            // Ordenar semanas por fecha descendente (más recientes primero)
            weeksData.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());

            const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
            return {
                monthStart,
                monthEnd,
                monthKey,
                weeks: weeksData,
                totalItems: monthItems.length,
                isLoaded: loadedMonths.has(monthKey),
                isLoading: loadingMonths.has(monthKey)
            };
        }).filter(month => month.totalItems > 0); // Solo meses con items

        // Ordenar por fecha descendente (más recientes primero)
        return monthsData.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    }, [items, getDate, getTime, selectedDate, loadedMonths, loadingMonths]);
}

// Hook para manejar estados y funciones de meses
export function useMonthLoading() {
    const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
    const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set());

    const loadMonth = useCallback(async (
        year: number,
        month: number,
        fetchByMonth: (year: number, month: number) => Promise<any[]>,
        setItems: (updater: (prev: any[]) => any[]) => void,
        isInitial = false
    ) => {
        const monthKey = `${year}-${month}`;
        
        // Si ya está cargado, no hacer nada
        if (loadedMonths.has(monthKey)) {
            return;
        }
        
        // Marcar como cargando
        setLoadingMonths(prev => new Set(prev).add(monthKey));
        
        try {
            const monthItems = await fetchByMonth(year, month);
            setItems(prev => {
                // Combinar items existentes con los nuevos, evitando duplicados
                const existingIds = new Set(prev.map((item: any) => item.id));
                const newItems = monthItems.filter((item: any) => !existingIds.has(item.id));
                return [...prev, ...newItems];
            });
            setLoadedMonths(prev => new Set(prev).add(monthKey));
            if (isInitial) {
                setExpandedMonths(prev => new Set(prev).add(monthKey));
            }
        } catch (error) {
            console.error("Error cargando mes:", error);
        } finally {
            setLoadingMonths(prev => {
                const next = new Set(prev);
                next.delete(monthKey);
                return next;
            });
        }
    }, [loadedMonths]);

    const toggleMonth = useCallback(async (
        monthKey: string,
        year: number,
        month: number,
        fetchByMonth: (year: number, month: number) => Promise<any[]>,
        setItems: (updater: (prev: any[]) => any[]) => void
    ) => {
        const isExpanded = expandedMonths.has(monthKey);
        
        if (!isExpanded && !loadedMonths.has(monthKey)) {
            // Si no está cargado, cargarlo primero
            await loadMonth(year, month, fetchByMonth, setItems);
        }
        
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthKey)) {
                newSet.delete(monthKey);
            } else {
                newSet.add(monthKey);
            }
            return newSet;
        });
    }, [expandedMonths, loadedMonths, loadMonth]);

    return {
        loadedMonths,
        expandedMonths,
        loadingMonths,
        loadMonth,
        toggleMonth
    };
}

// Hook para manejar paginación por semana
export function useWeekPagination() {
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
    const [weekPages, setWeekPages] = useState<Record<string, number>>({});
    const ITEMS_PER_PAGE = 20;

    const toggleWeek = useCallback((weekKey: string) => {
        setExpandedWeeks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(weekKey)) {
                newSet.delete(weekKey);
            } else {
                newSet.add(weekKey);
                // Resetear página cuando se expande
                if (!weekPages[weekKey]) {
                    setWeekPages(prev => ({ ...prev, [weekKey]: 1 }));
                }
            }
            return newSet;
        });
    }, [weekPages]);

    const getWeekPage = useCallback((weekKey: string) => weekPages[weekKey] || 1, [weekPages]);

    const setWeekPage = useCallback((weekKey: string, page: number) => {
        setWeekPages(prev => ({ ...prev, [weekKey]: page }));
    }, []);

    const getPaginatedItems = useCallback(<T,>(items: T[], weekKey: string): T[] => {
        const page = getWeekPage(weekKey);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return items.slice(startIndex, endIndex);
    }, [getWeekPage]);

    const getTotalPages = useCallback(<T,>(items: T[]): number => {
        return Math.ceil(items.length / ITEMS_PER_PAGE);
    }, []);

    return {
        expandedWeeks,
        toggleWeek,
        getWeekPage,
        setWeekPage,
        getPaginatedItems,
        getTotalPages,
        ITEMS_PER_PAGE
    };
}

