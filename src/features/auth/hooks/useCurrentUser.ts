import { useAuth } from '../AuthProvider';
import type { User } from "../types";

/**
 * Punto único de acceso al usuario autenticado. Los componentes dependen de este hook,
 * no de la fuente de datos. La sesión se carga desde la API en AuthProvider.
 * TODO(US14 - Leonel): exponer el rol autenticado para restringir funcionalidades no autorizadas.
 */
export function useCurrentUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error('No hay una sesión activa.');
  return user;
}
