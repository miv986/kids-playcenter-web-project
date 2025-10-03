import React, { useState, useEffect } from "react";
import { BirthdaySlot } from "../../types/auth";
import { format } from "date-fns";

interface SlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: BirthdaySlot | null;
  createSlot: (data: Partial<BirthdaySlot>) => void;
  updateSlot: (id: number, data: Partial<BirthdaySlot>) => void;
}

export function SlotModal({
  isOpen,
  onClose,
  slot,
  createSlot,
  updateSlot,
}: SlotModalProps) {
  const [formData, setFormData] = useState<Partial<BirthdaySlot>>({
    date: new Date().toISOString(),
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    status: "OPEN",
  });

  useEffect(() => {
    if (slot) {
      setFormData({
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: "OPEN",
      });
    } else {
      setFormData({
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: "OPEN",
      });
    }
  }, [slot]);

  if (!isOpen) return null;

  const handleChange = (field: keyof BirthdaySlot, value: any) => {
    if (field === "date") {
      const newDate = value;
      setFormData((prev) => ({
        ...prev,
        date: new Date(newDate).toISOString(),
        startTime: prev.startTime
          ? new Date(
            `${newDate}T${format(new Date(prev.startTime), "HH:mm")}`
          ).toISOString()
          : new Date(newDate).toISOString(),
        endTime: prev.endTime
          ? new Date(
            `${newDate}T${format(new Date(prev.endTime), "HH:mm")}`
          ).toISOString()
          : new Date(newDate).toISOString(),
      }));
    } else if (field === "startTime" || field === "endTime") {
      const [hours, minutes] = value.split(":").map(Number);
      setFormData((prev) => ({
        ...prev,
        [field]: new Date(
          new Date(prev.date!).setHours(Number(hours), Number(minutes))
        ).toISOString(),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = () => {
    if (!formData.date || !formData.startTime || !formData.endTime) {
      alert("Todos los campos son obligatorios");
      return;
    }

    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      alert("La hora de fin debe ser posterior a la hora de inicio");
      return;
    }

    if (slot) {
      updateSlot(slot.id, formData);
    } else {
      createSlot(formData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-md">
        <h3 className="text-2xl font-bold mb-4">
          {slot ? `Editar Slot #${slot.id}` : "Nuevo Slot"}
        </h3>

        <div className="space-y-3 text-gray-700">
          <div>
            <label className="font-medium">Fecha:</label>
            <input
              type="date"
              value={format(formData.date!, "yyyy-MM-dd")}
              onChange={(e) => handleChange("date", e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Hora inicio:</label>
            <input
              type="time"
              value={format(formData.startTime!, "HH:mm")}
              onChange={(e) => handleChange("startTime", e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Hora fin:</label>
            <input
              type="time"
              value={format(formData.endTime!, "HH:mm")}
              onChange={(e) => handleChange("endTime", e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>

          <div>
            <label className="font-medium">Estado:</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange("status", e.target.value)}
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
