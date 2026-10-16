import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../AuthProvider";

export function LogoutButton() {
  const { logout } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        disabled={pending}
        className="rounded p-2 text-muted hover:bg-nav-hover focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50"
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            await logout();
          } catch {
            setError("No se pudo cerrar sesión. Intenta nuevamente.");
          } finally {
            setPending(false);
          }
        }}
      >
        <LogOut size={16} aria-hidden="true" />
      </button>
      {error && (
        <p
          role="alert"
          className="absolute right-0 bottom-full z-10 mb-2 w-48 rounded border border-red-line bg-red-bg p-2 text-label text-red"
        >
          {error}
        </p>
      )}
    </div>
  );
}
