import React, { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { Status } from "../../types/auth";
import { showToast } from "../../lib/toast";
import { useTranslation } from "../../contexts/TranslationContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Tipo genérico para slots (cumpleaños o daycare)
export interface GenericSlot {
  id?: number;
  date?: string;               // YYYY-MM-DD
  startTime?: string;          // ISO
  endTime?: string;            // ISO
  hour?: number;               // para Daycare
  openHour?: string;           // opcional si generas rangos
  closeHour?: string;          // opcional si generas rangos
  capacity?: number;           // solo daycare
  availableSpots?: number;     // solo daycare
  status?: "OPEN" | "CLOSED" | string; // admitir string por compatibilidad
}


interface SlotModalProps<T extends GenericSlot> {
  isOpen: boolean;
  onClose: () => void;
  slot?: T | null;
  createSlot: (data: Partial<T>) => Promise<void>;
  updateSlot: (id: number, data: Partial<T>) => Promise<void>;
  isDaycare?: boolean;
}

export function SlotModal<T extends GenericSlot>({
  isOpen,
  onClose,
  slot,
  createSlot,
  updateSlot,
  isDaycare,
}: SlotModalProps<T>) {
  const { t } = useTranslation('SlotModal');
  const tCalendar = useTranslation('Calendar');
  const [formData, setFormData] = useState<Partial<T>>({
    date: new Date().toISOString(),
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    status: "OPEN",
    capacity: 0,
    openHour: "00:00",
    closeHour: "01:00",
  } as Partial<T>
  );
  const [useAdvancedConfig, setUseAdvancedConfig] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false); // ✅ Estado de carga

  useEffect(() => {
    if (slot) {
      // Detectamos qué tipo de slot tenemos
      const isDaycare = "openHour" in slot || "capacity" in slot;

      if (isDaycare) {
        // 🧩 DaycareSlot
        setFormData({
          ...slot,
          date: slot.date,
          openHour: slot.openHour || "00:00",
          closeHour: slot.closeHour || "01:00",
          capacity: slot.capacity ?? 0,
          status: slot.status ?? "OPEN",
        } as any);
      } else {
        // 🎉 BirthdaySlot
        setFormData({
          ...slot,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status ?? "OPEN",
        } as any);
      }
    } else {
      // 🆕 Si no hay slot (modo crear nuevo)
      setFormData({
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        openHour: "00:00",
        closeHour: "01:00",
        capacity: 0,
        status: "OPEN",
      } as any);
      setUseAdvancedConfig(false);
      setSelectedDates([]);
    }
  }, [slot]);


  if (!isOpen) return null;


  const handleChange = (field: keyof T, value: any) => {
    if (field === "date") {
      const newDate = value;
      setFormData((prev) => ({
        ...prev,
        date: newDate,
        startTime: prev.startTime
          ? new Date(`${newDate}T${format(new Date(prev.startTime), "HH:mm")}`).toISOString()
          : new Date(newDate).toISOString(),
        endTime: prev.endTime
          ? new Date(`${newDate}T${format(new Date(prev.endTime), "HH:mm")}`).toISOString()
          : new Date(newDate).toISOString(),
      }));
    } else if (field === "startTime" || field === "endTime") {
      const [hours, minutes] = value.split(":").map(Number);
      setFormData((prev) => ({
        ...prev,
        [field]: new Date(new Date(prev.date!).setHours(hours, minutes)).toISOString(),
      }));
    } else if (field === "openHour" || field === "closeHour") {
      // Para daycare slots, mantener como string "HH:mm"
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    // ✅ Evitar múltiples envíos
    if (isLoading) return;

    if (!formData.date) {
      showToast.error(t('dateRequired'));
      return;
    }

    // Validación específica para daycare o cumpleaños
    if (isDaycare) {
      if (!formData.openHour || !formData.closeHour || !formData.capacity) {
        showToast.error(t('fillRequiredDaycare'));
        return;
      }

      // Validar que la hora de cierre sea posterior
      const [openH, openM] = formData.openHour.split(":").map(Number);
      const [closeH, closeM] = formData.closeHour.split(":").map(Number);

      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (closeMinutes <= openMinutes) {
        showToast.error(t('endAfterStart'));
        return;
      }

      // ✅ Los valores ya están en formato correcto
      formData.capacity = formData.capacity ?? 20;

      // Si usa configuración avanzada, validar fechas seleccionadas
      if (useAdvancedConfig) {
        if (selectedDates.length === 0) {
          showToast.error(t('selectAtLeastOneDate'));
          return;
        }
      }

    } else {
      // Slots de cumpleaños
      if (!formData.startTime || !formData.endTime) {
        showToast.error(t('fillRequiredBirthday'));
        return;
      }

      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        showToast.error(t('endAfterStart'));
        return;
      }
    }

    try {
      setIsLoading(true); // ✅ Activar spinner
      
      // Guardar o actualizar
      if (slot?.id) {
        const updatedSlot: any = await updateSlot(slot.id, formData);
        if (updatedSlot) {
          showToast.success(t('updateSuccess'));
          onClose();
        }
      } else {
        // Para daycare con configuración avanzada, enviar fechas personalizadas
        if (isDaycare && useAdvancedConfig && selectedDates.length > 0) {
          const customDates = selectedDates.map(date => format(date, 'yyyy-MM-dd'));
          const dataWithCustomDates = {
            ...formData,
            customDates,
          };
          const newSlot: any = await createSlot(dataWithCustomDates);
          if (newSlot) {
            showToast.success(t('createSuccess'));
            onClose();
          }
        } else {
          const newSlot: any = await createSlot(formData);
          if (newSlot) {
            showToast.success(t('createSuccess'));
            onClose();
          }
        }
      }
    } catch (error) {
      console.error("Error guardando slot:", error);
      showToast.error(t('saveError'));
    } finally {
      setIsLoading(false); // ✅ Desactivar spinner
    }
  };

  // Toggle fecha en el calendario de selección múltiple
  const toggleDateSelection = (date: Date) => {
    setSelectedDates(prev => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingIndex = prev.findIndex(d => format(d, 'yyyy-MM-dd') === dateStr);
      
      if (existingIndex >= 0) {
        // Deseleccionar
        return prev.filter((_, i) => i !== existingIndex);
      } else {
        // Seleccionar
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  };

  // Renderizar calendario de selección múltiple
  const renderMultiDateCalendar = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // Lunes = 0

    const daysOfWeek = [
      tCalendar.t('daysOfWeek.0'),
      tCalendar.t('daysOfWeek.1'),
      tCalendar.t('daysOfWeek.2'),
      tCalendar.t('daysOfWeek.3'),
      tCalendar.t('daysOfWeek.4'),
      tCalendar.t('daysOfWeek.5'),
      tCalendar.t('daysOfWeek.6'),
    ];
    const months = [
      tCalendar.t('months.0'),
      tCalendar.t('months.1'),
      tCalendar.t('months.2'),
      tCalendar.t('months.3'),
      tCalendar.t('months.4'),
      tCalendar.t('months.5'),
      tCalendar.t('months.6'),
      tCalendar.t('months.7'),
      tCalendar.t('months.8'),
      tCalendar.t('months.9'),
      tCalendar.t('months.10'),
      tCalendar.t('months.11'),
    ];

    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <h4 className="font-semibold text-sm text-gray-800">
            {months[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
          </h4>
          <button
            type="button"
            onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
            className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {daysInMonth.map(day => {
            const isSelected = selectedDates.some(d => isSameDay(d, day));
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => toggleDateSelection(day)}
                className={`aspect-square rounded-md text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-sm scale-105"
                    : "bg-white hover:bg-blue-50 text-gray-700 border border-gray-200 hover:border-blue-300"
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>

        {selectedDates.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">
              Fechas seleccionadas ({selectedDates.length}):
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedDates.map((date, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium"
                >
                  {format(date, 'dd/MM')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl p-6 shadow-xl w-full ${useAdvancedConfig && isDaycare && !slot ? 'max-w-lg' : 'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <h3 className="text-2xl font-bold mb-4">{slot ? `${t('editSlot')} #${slot.id}` : t('newSlot')}</h3>

        <div className="space-y-3 text-gray-700">
          <div>
            <label className="font-medium">{t('date')}:</label>
            <input
              type="date"
              value={format(new Date(formData.date ?? new Date()), "yyyy-MM-dd")}
              onChange={(e) => handleChange("date" as keyof T, e.target.value)}
              className="border rounded px-2 py-1 w-full" />
          </div>
          {!isDaycare ? (
            <>
              <div>
                <label className="font-medium">{t('startTime')}:</label>
                <input
                  type="time"
                  value={formData.startTime ? format(new Date(formData.startTime ?? new Date()), "HH:mm") : ""}
                  onChange={(e) => handleChange("startTime" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div><div>
                <label className="font-medium">{t('endTime')}:</label>
                <input
                  type="time"
                  value={formData.endTime ? format(new Date(formData.endTime ?? new Date()), "HH:mm") : ""}
                  onChange={(e) => handleChange("endTime" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div>
              {(formData.capacity !== undefined || slot?.capacity !== undefined) && (
                <div>
                  <label className="font-medium">{t('capacity')}:</label>
                  <input
                    type="number"
                    value={formData.capacity || 0}
                    onChange={(e) => handleChange("capacity" as keyof T, Number(e.target.value))}
                    className="border rounded px-2 py-1 w-full" />
                </div>
              )}
            </>
          ) : (
            <>
              {!slot && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="advancedConfig"
                    checked={useAdvancedConfig}
                    onChange={(e) => {
                      setUseAdvancedConfig(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedDates([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="advancedConfig" className="font-medium cursor-pointer">
                    Configuración avanzada
                  </label>
                </div>
              )}

              {useAdvancedConfig && !slot && (
                <div className="mb-4">
                  <label className="font-medium block mb-2">Seleccionar fechas personalizadas:</label>
                  {renderMultiDateCalendar()}
                </div>
              )}

              <div>
                <label className="font-medium">{t('startTime')}:</label>
                <input
                  type="time"
                  value={formData.openHour || ""}
                  onChange={(e) => handleChange("openHour" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="font-medium">{t('endTime')}:</label>
                <input
                  type="time"
                  value={formData.closeHour || ""}
                  onChange={(e) => handleChange("closeHour" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="font-medium">{t('capacity')}:</label>
                <input
                  type="number"
                  value={formData.capacity || 0}
                  onChange={(e) => handleChange("capacity" as keyof T, Number(e.target.value))}
                  className="border rounded px-2 py-1 w-full" />
              </div>
            </>
          )}

          <div>
            <label className="font-medium">{t('status')}:</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status" as keyof T, e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="OPEN">{t('open')}</option>
              <option value="CLOSED">{t('closed')}</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{t('saving')}</span>
              </>
            ) : (
              <span>{slot ? t('saveChanges') : t('createSlot')}</span>
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
