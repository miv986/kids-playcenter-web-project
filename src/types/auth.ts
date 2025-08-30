export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  date: string;
  time: string;
  numberOfKids: string;
  package: string;
  comments: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}