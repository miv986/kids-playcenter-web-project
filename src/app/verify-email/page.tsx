"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    // Si viene del backend con éxito, mostrar mensaje de éxito
    if (success === "true") {
      setStatus("success");
      setMessage("Email verificado correctamente");
      return;
    }

    // Si hay error, mostrar mensaje de error
    if (error) {
      setStatus("error");
      setMessage(decodeURIComponent(error));
      return;
    }

    // Si viene con token y email (acceso directo), verificar en el backend
    if (token && email) {
      const verifyEmail = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
          const response = await fetch(
            `${apiUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`,
            {
              method: "GET",
              credentials: "include",
              headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: `Error ${response.status}` }));
            setStatus("error");
            setMessage(errorData.error || "Error al verificar el email");
            return;
          }

          const data = await response.json();
          if (data.success) {
            setStatus("success");
            setMessage(data.message || "Email verificado correctamente");
          } else {
            setStatus("error");
            setMessage(data.error || "Error al verificar el email");
          }
        } catch (err: any) {
          console.error("Error verificando email:", err);
          setStatus("error");
          setMessage(err.message || "Error al conectar con el servidor");
        }
      };

      verifyEmail();
      return;
    }

    // Si no hay parámetros válidos, mostrar error
    setStatus("error");
    setMessage("Parámetros de verificación inválidos");
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Verificando email...
            </h1>
            <p className="text-gray-600">
              Por favor espera mientras verificamos tu correo electrónico
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              ¡Verificación exitosa!
            </h1>
            <p className="text-gray-600 mb-6">
              Tu correo electrónico ha sido verificado correctamente. Ya puedes iniciar sesión.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Ir al inicio
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Error en la verificación
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Volver al inicio
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

