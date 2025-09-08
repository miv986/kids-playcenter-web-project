export interface User {
  id: number;
  email: string;
  name: string;
  surname: string;
  role: string;
}

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