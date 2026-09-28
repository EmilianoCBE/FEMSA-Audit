import { currentUserMock } from "../data/currentUser.mock";
import type { User } from "../types";

/**
 * Punto único de acceso al usuario autenticado. Los componentes dependen de este hook,
 * no de la fuente de datos, así que cambiar el mock por la sesión real no los afecta.
 *
 * TODO(US01 - Rafael Valdez): obtener la sesión desde Microsoft Entra ID y bloquear usuarios no autorizados.
 * TODO(US14 - Leonel): exponer el rol autenticado para restringir funcionalidades no autorizadas.
 */
export function useCurrentUser(): User {
  return currentUserMock;
}
