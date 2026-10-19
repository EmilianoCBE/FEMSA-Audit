import { describe, expect, it } from "vitest";
import type { User } from "../types";
import { getEmailBase, getEmailPreview, getInitials, isUserActive, validateNewUser } from "./users";

function user(email: string, isActive: boolean | number = true): User {
  return {
    user_id: 1,
    entra_id: "",
    email,
    full_name: "Usuario Prueba",
    is_active: isActive as boolean,
    created_at: "2026-10-01T00:00:00Z",
    role_id: 3,
    role_name: "Visualizador",
    role_description: "",
  };
}

const VALID = {
  firstName: "Daniela",
  lastName: "Aedo",
  roleId: "3",
  password: "contraseña-9",
  confirmPassword: "contraseña-9",
};

describe("US02 alta de usuarios", () => {
  it("genera el correo corporativo con el primer nombre y apellido sin acentos", () => {
    expect(getEmailBase("José María", "Núñez López")).toBe("jose.nunez@femsa.com");
    expect(getEmailBase("  Ana ", " O'Neil ")).toBe("ana.oneil@femsa.com");
    expect(getEmailBase("", "Aedo")).toBe("");
    expect(getEmailBase("***", "Aedo")).toBe("");
  });

  it("agrega sufijo cuando el correo ya existe, igual que el backend", () => {
    const users = [user("daniela.aedo@femsa.com"), user("DANIELA.AEDO2@femsa.com")];
    expect(getEmailPreview("Daniela", "Aedo", [])).toBe("daniela.aedo@femsa.com");
    expect(getEmailPreview("Daniela", "Aedo", users)).toBe("daniela.aedo3@femsa.com");
  });

  it("valida el formulario en orden y acepta uno correcto", () => {
    expect(validateNewUser({ ...VALID, lastName: " " })).toMatch(/nombre y el apellido/);
    expect(validateNewUser({ ...VALID, roleId: "" })).toMatch(/rol/);
    expect(validateNewUser({ ...VALID, password: "corta", confirmPassword: "corta" })).toMatch(/9 caracteres/);
    const long = "x".repeat(1025);
    expect(validateNewUser({ ...VALID, password: long, confirmPassword: long })).toMatch(/longitud/);
    expect(validateNewUser({ ...VALID, confirmPassword: "otra-contraseña" })).toMatch(/no coinciden/);
    expect(validateNewUser(VALID)).toBeNull();
  });

  it("calcula iniciales y estado activo aunque la BD regrese 0/1", () => {
    expect(getInitials("  daniela  aedo  ruiz")).toBe("DA");
    expect(isUserActive(user("a@femsa.com", 1))).toBe(true);
    expect(isUserActive(user("a@femsa.com", 0))).toBe(false);
    expect(isUserActive(user("a@femsa.com", false))).toBe(false);
  });
});
