import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Status } from "../../types/auth";
import { showToast } from "../../lib/toast";
import { useTranslation } from "../../contexts/TranslationContext";

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
    }
  }, [slot]);


  if (!isOpen) return null;

  console.log(slot);

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
      // Guardar o actualizar
      if (slot?.id) {
        const updatedSlot = await updateSlot(slot.id, formData);
        console.log("✅ Slot actualizado en modal:", updatedSlot);
        showToast.success(t('updateSuccess'));
      } else {
        await createSlot(formData);
        showToast.success(t('createSuccess'));
      }

      onClose();
    } catch (error) {
      console.error("Error guardando slot:", error);
      showToast.error(t('saveError'));
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
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

            </>
          ) : (
            <>            <div>
              <label className="font-medium">{t('startTime')}:</label>
              <input
                type="time"
                value={formData.openHour || ""}
                onChange={(e) => handleChange("openHour" as keyof T, e.target.value)}
                className="border rounded px-2 py-1 w-full" />
            </div><div>
                <label className="font-medium">{t('endTime')}:</label>
                <input
                  type="time"
                  value={formData.closeHour || ""}
                  onChange={(e) => handleChange("closeHour" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div><div>
                <label className="font-medium">{t('capacity')}:</label>
                <input
                  type="number"
                  value={formData.capacity || 0}
                  onChange={(e) => handleChange("capacity" as keyof T, Number(e.target.value))}
                  className="border rounded px-2 py-1 w-full" />
              </div></>
          )}

          <div>
            <label className="font-medium">{t('status')}:</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status" as keyof T, e.target.value)}
              className="border rounded px-2 py-1 w-full"
            >
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 flex-1"
          >
            {slot ? t('saveChanges') : t('createSlot')}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 flex-1"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}
