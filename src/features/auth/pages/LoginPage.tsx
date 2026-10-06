import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck, LockKeyhole } from "lucide-react";
import { Navigate, useLocation, useSearchParams } from "react-router";
import { Button } from "@/shared/ui";
import { useAuth } from "../AuthProvider";
import { authService } from "../services/authService";

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entraPending, setEntraPending] = useState(false);
  const from: unknown = location.state?.from;
  const destination =
    typeof from === "string" && from.startsWith("/") && !from.startsWith("//") && !from.startsWith("/login")
      ? from
      : "/";
  if (!loading && user) return <Navigate to={destination} replace />;
  const callbackError =
    params.get("error") === "unauthorized"
      ? "Tu cuenta de Microsoft no tiene acceso a esta aplicación. Contacta al administrador."
      : params.has("error")
        ? "No se pudo completar el acceso con Entra ID. Intenta nuevamente."
        : null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setPending(false);
    }
  }
  const disabled = pending || entraPending || loading;
  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center gap-3 px-6 py-6 sm:px-10">
        <span className="text-lg font-bold tracking-tight text-femsa">FEMSA</span>
        <span className="h-5 w-px bg-line-2" />
        <span className="text-body font-medium text-ink-2">Auditoría Interna</span>
      </header>
      <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-line bg-surface shadow-sm desktop:grid-cols-2">
          <aside className="relative hidden flex-col justify-between bg-accent p-12 text-white desktop:flex">
            <div className="flex items-center gap-2 text-body font-medium">
              <ShieldCheck size={20} aria-hidden="true" /> Portal de auditoría
            </div>
            <div className="py-16">
              <div className="mb-6 h-1 w-12 rounded-full bg-accent-line" />
              <h1 className="text-4xl leading-tight font-semibold tracking-tight">
                Confianza en cada
                <br />
                decisión.
              </h1>
              <p className="mt-5 max-w-xs text-base leading-relaxed text-accent-soft">
                Un espacio para gestionar tus procesos y dar seguimiento a los hallazgos de auditoría.
              </p>
            </div>
            <p className="text-body-sm text-accent-soft">Auditoría Interna · FEMSA</p>
          </aside>
          <section aria-labelledby="login-title" className="p-7 sm:p-12">
            <p className="mb-3 text-label font-semibold tracking-widest text-accent uppercase">Bienvenido</p>
            <h2 id="login-title" className="text-3xl font-semibold tracking-tight">
              Inicia sesión
            </h2>
            <p className="mt-2 text-body text-muted">Accede al portal con tu cuenta corporativa.</p>
            <div className="mt-8 rounded-xl border border-accent-line bg-accent-bg p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-body font-semibold text-accent">Cuenta corporativa</span>
                <span className="rounded-full bg-surface px-2 py-1 text-label font-medium text-accent">
                  Recomendado
                </span>
              </div>
              <Button
                variant="primary"
                disabled={disabled}
                onClick={() => {
                  setEntraPending(true);
                  window.location.assign(authService.entraUrl);
                }}
                className="min-h-12 w-full gap-3 rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M2 2h9v9H2zm11 0h9v9h-9zM2 13h9v9H2zm11 0h9v9h-9z" />
                </svg>
                {entraPending ? "Redirigiendo…" : "Ingresar con Entra ID"}
                <ArrowRight size={17} aria-hidden="true" />
              </Button>
              <p className="mt-3 text-center text-body-sm text-muted">Usa tu cuenta de Microsoft de la organización.</p>
            </div>
            <div className="my-6 flex items-center gap-3 text-label text-muted">
              <span className="h-px flex-1 bg-line" />o accede con tu cuenta local
              <span className="h-px flex-1 bg-line" />
            </div>
            {(error || callbackError) && (
              <p
                role="alert"
                id="login-error"
                className="mb-4 rounded-lg border border-red-line bg-red-bg p-3 text-body text-red"
              >
                {error || callbackError}
              </p>
            )}
            <form
              onSubmit={submit}
              className="space-y-4"
              aria-describedby={error || callbackError ? "login-error" : undefined}
            >
              <div>
                <label htmlFor="identifier" className="mb-2 block text-body font-medium text-ink-2">
                  Usuario o email
                </label>
                <input
                  id="identifier"
                  name="username"
                  autoComplete="username"
                  required
                  maxLength={254}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  disabled={disabled}
                  placeholder="Tu usuario o correo electrónico"
                  className="min-h-11 w-full rounded-lg border border-line-2 bg-surface px-3 text-sm outline-none placeholder:text-muted-2 focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-body font-medium text-ink-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={1024}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={disabled}
                  placeholder="Ingresa tu contraseña"
                  className="min-h-11 w-full rounded-lg border border-line-2 bg-surface px-3 text-sm outline-none placeholder:text-muted-2 focus:border-accent focus:ring-2 focus:ring-accent-soft disabled:opacity-50"
                />
              </div>
              <Button
                type="submit"
                disabled={disabled}
                className="min-h-11 w-full rounded-lg text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {pending ? "Ingresando…" : "Ingresar con usuario y contraseña"}
              </Button>
            </form>
            <p className="mt-6 flex items-center justify-center gap-2 text-label text-muted">
              <LockKeyhole size={14} aria-hidden="true" />
              Acceso exclusivo para usuarios autorizados
            </p>
          </section>
        </div>
      </div>
      <footer className="px-6 py-5 text-center text-label text-muted">FEMSA · Auditoría Interna</footer>
    </main>
  );
}
