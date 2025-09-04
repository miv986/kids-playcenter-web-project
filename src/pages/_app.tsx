import { AppProps } from 'next/app';
import { AuthProvider } from '../contexts/AuthContext';
import { BookingProvider } from '../contexts/BookingContext';
import '../styles/global.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <BookingProvider>
        <Component {...pageProps} />
      </BookingProvider>
    </AuthProvider>
  );
}

export default MyApp;
