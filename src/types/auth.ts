export interface User {
  phone: string;
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


export interface Booking {
  id: number;
  contact_number: string;
  number_of_kinds: number;
  type_of_package: string;
  comments: string;
  createdAt?: Date;
  updatedAt?: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
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