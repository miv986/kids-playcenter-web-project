import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Status } from "../../types/auth";

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
      alert("La fecha es obligatoria");
      return;
    }

    // Validación específica para daycare o cumpleaños
    if (isDaycare) {
      if (!formData.openHour || !formData.closeHour || !formData.capacity) {
        alert("Debes rellenar fecha, hora de inicio, hora de fin y capacidad");
        return;
      }

      // Validar que la hora de cierre sea posterior
      const [openH, openM] = formData.openHour.split(":").map(Number);
      const [closeH, closeM] = formData.closeHour.split(":").map(Number);

      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (closeMinutes <= openMinutes) {
        alert("La hora de fin debe ser posterior a la de inicio");
        return;
      }

      // ✅ Los valores ya están en formato correcto
      formData.capacity = formData.capacity ?? 20;

    } else {
      // Slots de cumpleaños
      if (!formData.startTime || !formData.endTime) {
        alert("Debes rellenar hora de inicio y fin");
        return;
      }

      if (new Date(formData.endTime) <= new Date(formData.startTime)) {
        alert("La hora de fin debe ser posterior a la de inicio");
        return;
      }
    }

    try {
      // Guardar o actualizar
      if (slot?.id) {
        const updatedSlot = await updateSlot(slot.id, formData);
        console.log("✅ Slot actualizado en modal:", updatedSlot);
      } else {
        await createSlot(formData);
      }

      onClose();
    } catch (error) {
      console.error("Error guardando slot:", error);
      alert("Error al guardar el slot");
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4">{slot ? `Editar Slot #${slot.id}` : "Nuevo Slot"}</h3>

        <div className="space-y-3 text-gray-700">
          <div>
            <label className="font-medium">Fecha:</label>
            <input
              type="date"
              value={format(new Date(formData.date ?? new Date()), "yyyy-MM-dd")}
              onChange={(e) => handleChange("date" as keyof T, e.target.value)}
              className="border rounded px-2 py-1 w-full" />
          </div>
          {!isDaycare ? (
            <>
              <div>
                <label className="font-medium">Hora inicio:</label>
                <input
                  type="time"
                  value={formData.startTime ? format(new Date(formData.startTime ?? new Date()), "HH:mm") : ""}
                  onChange={(e) => handleChange("startTime" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div><div>
                <label className="font-medium">Hora fin:</label>
                <input
                  type="time"
                  value={formData.endTime ? format(new Date(formData.endTime ?? new Date()), "HH:mm") : ""}
                  onChange={(e) => handleChange("endTime" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div>

            </>
          ) : (
            <>            <div>
              <label className="font-medium">Hora inicio:</label>
              <input
                type="time"
                value={formData.openHour || ""}
                onChange={(e) => handleChange("openHour" as keyof T, e.target.value)}
                className="border rounded px-2 py-1 w-full" />
            </div><div>
                <label className="font-medium">Hora fin:</label>
                <input
                  type="time"
                  value={formData.closeHour || ""}
                  onChange={(e) => handleChange("closeHour" as keyof T, e.target.value)}
                  className="border rounded px-2 py-1 w-full" />
              </div><div>
                <label className="font-medium">Capacidad:</label>
                <input
                  type="number"
                  value={formData.capacity || 0}
                  onChange={(e) => handleChange("capacity" as keyof T, Number(e.target.value))}
                  className="border rounded px-2 py-1 w-full" />
              </div></>
          )}

          <div>
            <label className="font-medium">Estado:</label>
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
            {slot ? "Guardar cambios" : "Crear Slot"}
          </button>
          <button
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded-xl hover:bg-gray-300 flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
