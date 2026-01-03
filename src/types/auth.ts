import { PAGE_TYPES } from "next/dist/lib/page-types";

export interface User {
  phone_number: string;
  id: number;
  email: string;
  name: string;
  surname: string;
  role: string;
  children?: Child[];
}
export type Child = {
  id: number;
  name: string;
  surname: string;
  dateOfBirth: string;
  notes?: string;
  medicalNotes?: string;
  allergies?: string;
  emergency_contact_name_1?: string;
  emergency_phone_1?: string;
  emergency_contact_name_2?: string;
  emergency_phone_2?: string;
};

export type Status = "PENDING" | "CANCELLED" | "CONFIRMED" | "CLOSED" | "OPEN";
export type AttendanceStatus = "PENDING" | "ATTENDED" | "NOT_ATTENDED";
export type Package = "ALEGRIA" | "FIESTA" | "ESPECIAL";

export interface DaycareBooking{
  id: number;
  comments?: string;
  startTime: string;
  endTime: string;
  createdAt?: string;
  upstringdAt: string;
  status: Status;
  attendanceStatus?: AttendanceStatus;
  user?: User | null; // Opcional para reservas manuales
  children: User[]; // Los hijos son usuarios (User con role CHILD)
  slots: DaycareSlot[];
  // Campos para reservas manuales
  isManual?: boolean;
  manualClientName?: string | null;
  manualNumberOfChildren?: number | null;
  manualChildName?: string | null;
  manualParent1Name?: string | null;
  manualParent1Phone?: string | null;
  manualParent2Name?: string | null;
  manualParent2Phone?: string | null;
}

export interface DaycareSlot{
  id: number;
  date: string;
  hour: number;
  openHour: string;
  closeHour: string;
  capacity: number;
  availableSpots: number;
  status: Status;
  createdAt: string;
  upstringdAt?: string;
  bookings: DaycareBooking[];
}

export interface BirthdayBooking {
  id: number;
  guestEmail: string;
  guest: string;
  number_of_kids: number;
  contact_number: string;
  comments: string;
  packageType?: Package;
  status: Status;
  createdAt?: string;
  upstringdAt?: string;
  slotId: number;
  slot?: BirthdaySlot;
  originalSlotDate?: string;
  originalSlotStartTime?: string;
  originalSlotEndTime?: string;
}


export interface BirthdaySlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  status: Status;
  booking?: BirthdayBooking;
  createdAt?: string;
  upstringdAt?: string;

}

export interface MeetingSlot {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSpots: number;
  status: Status;
  createdAt?: string;
  updatedAt?: string;
  bookings?: MeetingBooking[];
}

export interface MeetingBooking {
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  comments?: string | null;
  status: Status;
  slotId: number;
  slot?: MeetingSlot;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChildNote {
  id: number;
  childId: number;
  adminId: number;
  content: string;
  images: string[];
  noteDate: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  child?: {
    id: number;
    name: string;
    surname: string;
  };
  admin?: {
    id: number;
    name: string;
    surname: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name: string,
    surname: string
  ) => Promise<boolean>;
  logout: () => void;
}

export interface TokenContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  isLoading: boolean;
}