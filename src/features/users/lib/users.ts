import type { User } from "../types";

/**
 * Reglas de la pantalla de usuarios (US02). El correo y la contraseña deben seguir las mismas reglas que
 * `controllers/users.controller.js` del backend, que es quien crea la cuenta; aquí solo se previsualiza y valida.
 */
export const PASSWORD_MIN_LENGTH = 9;
export const PASSWORD_MAX_LENGTH = 1024;

function normalizeNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function getEmailBase(firstName: string, lastName: string): string {
  const firstPart = normalizeNamePart(firstName.trim().split(/\s+/)[0] ?? "");
  const lastPart = normalizeNamePart(lastName.trim().split(/\s+/)[0] ?? "");

  if (!firstPart || !lastPart) {
    return "";
  }

  return `${firstPart}.${lastPart}@femsa.com`;
}

export function getEmailPreview(firstName: string, lastName: string, users: User[]): string {
  const baseEmail = getEmailBase(firstName, lastName);

  if (!baseEmail) {
    return "";
  }

  const existingEmails = new Set(
    users.map((user) =>
      String(user.email ?? "")
        .trim()
        .toLowerCase(),
    ),
  );

  if (!existingEmails.has(baseEmail.toLowerCase())) {
    return baseEmail;
  }

  const atIndex = baseEmail.lastIndexOf("@");
  const namePart = baseEmail.substring(0, atIndex);
  const domainPart = baseEmail.substring(atIndex);

  let suffix = 2;

  while (existingEmails.has(`${namePart}${suffix}${domainPart}`.toLowerCase())) {
    suffix++;
  }

  return `${namePart}${suffix}${domainPart}`;
}

export function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function isUserActive(user: User): boolean {
  return user.is_active === true || Number(user.is_active) === 1;
}

export type NewUserForm = {
  firstName: string;
  lastName: string;
  roleId: string;
  password: string;
  confirmPassword: string;
};

/** Regresa el primer error del formulario de alta, o `null` si es válido. */
export function validateNewUser(form: NewUserForm): string | null {
  if (!form.firstName.trim() || !form.lastName.trim()) {
    return "Escribe el nombre y el apellido del usuario.";
  }

  if (!form.roleId) {
    return "Selecciona el rol que tendrá el usuario.";
  }

  if (form.password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (form.password.length > PASSWORD_MAX_LENGTH) {
    return "La contraseña supera la longitud permitida.";
  }

  if (form.password !== form.confirmPassword) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}
