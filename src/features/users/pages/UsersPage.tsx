
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Search,
  Users as UsersIcon,
  ShieldCheck,
  UserRound,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  KeyRound,
  RefreshCw,
  Mail,
  Shield,
} from "lucide-react";

import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, Page } from "@/shared/ui";
import { usersService } from "../services/usersService";
import type { Role, User } from "../types";

const PAGE_SIZE = 10;

type QuickFilter = "all" | "active-admins";

function normalizeNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getEmailBase(firstName: string, lastName: string): string {
  const firstPart = normalizeNamePart(firstName.trim().split(/\s+/)[0] ?? "");
  const lastPart = normalizeNamePart(lastName.trim().split(/\s+/)[0] ?? "");

  if (!firstPart || !lastPart) {
    return "";
  }

  return `${firstPart}.${lastPart}@femsa.com`;
}

function getEmailPreview(
  firstName: string,
  lastName: string,
  users: User[],
): string {
  const baseEmail = getEmailBase(firstName, lastName);

  if (!baseEmail) {
    return "";
  }

  const existingEmails = new Set(
    users.map((user) => String(user.email ?? "").trim().toLowerCase()),
  );

  if (!existingEmails.has(baseEmail.toLowerCase())) {
    return baseEmail;
  }

  const atIndex = baseEmail.lastIndexOf("@");
  const namePart = baseEmail.substring(0, atIndex);
  const domainPart = baseEmail.substring(atIndex);

  let suffix = 2;

  while (
    existingEmails.has(`${namePart}${suffix}${domainPart}`.toLowerCase())
  ) {
    suffix++;
  }

  return `${namePart}${suffix}${domainPart}`;
}

function getRoleBadgeClass(roleName: unknown): string {
  const role =
    typeof roleName === "string" ? roleName : String(roleName ?? "");

  const normalizedRole = role
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalizedRole.includes("administrador")) {
    return "bg-green-100 text-green-800 ring-1 ring-green-200";
  }

  if (normalizedRole.includes("creador")) {
    return "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
  }

  if (normalizedRole.includes("visualizador")) {
    return "bg-purple-100 text-purple-800 ring-1 ring-purple-200";
  }

  if (normalizedRole.includes("auditor")) {
    return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
  }

  if (normalizedRole.includes("gestor")) {
    return "bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200";
  }

  if (normalizedRole.includes("supervisor")) {
    return "bg-orange-100 text-orange-800 ring-1 ring-orange-200";
  }

  if (normalizedRole.includes("consulta")) {
    return "bg-pink-100 text-pink-800 ring-1 ring-pink-200";
  }

  return "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200";
}

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Ocurrió un error inesperado. Intenta nuevamente.";
}

function isUserActive(user: User): boolean {
  return user.is_active === true || Number(user.is_active) === 1;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [page, setPage] = useState(1);

  const [showRoles, setShowRoles] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [newRoleId, setNewRoleId] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [loadedUsers, loadedRoles] = await Promise.all([
        usersService.list(),
        usersService.roles(),
      ]);

      setUsers(loadedUsers);
      setRoles(loadedRoles);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const activeUsers = useMemo(
    () => users.filter(isUserActive),
    [users],
  );

  const activeAdmins = useMemo(
    () =>
      users.filter(
        (user) => isUserActive(user) && Number(user.role_id) === 2,
      ),
    [users],
  );

  const emailPreview = useMemo(
    () => getEmailPreview(firstName, lastName, users),
    [firstName, lastName, users],
  );

  const selectedRole = useMemo(
    () => roles.find((role) => Number(role.role_id) === Number(newRoleId)),
    [roles, newRoleId],
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        String(user.full_name ?? "").toLowerCase().includes(query) ||
        String(user.email ?? "").toLowerCase().includes(query) ||
        String(user.role_name ?? "").toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" || String(user.role_id) === roleFilter;

      const matchesQuickFilter =
        quickFilter === "all" ||
        (isUserActive(user) && Number(user.role_id) === 2);

      return matchesSearch && matchesRole && matchesQuickFilter;
    });
  }, [users, search, roleFilter, quickFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, quickFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function resetFilters() {
    setSearch("");
    setRoleFilter("all");
    setQuickFilter("all");
    setPage(1);
  }

  function openCreateForm() {
    setFirstName("");
    setLastName("");
    setNewRoleId("");
    setPassword("");
    setConfirmPassword("");
    setErrorMessage("");
    setSuccessMessage("");
    setShowCreateForm(true);
  }

  function closeCreateForm() {
    if (creating) return;

    setShowCreateForm(false);
    setFirstName("");
    setLastName("");
    setNewRoleId("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleRoleChange(user: User, value: string) {
    const newRoleIdValue = Number(value);
    const currentRoleId = Number(user.role_id);

    if (!newRoleIdValue || newRoleIdValue === currentRoleId) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setSavingRoleId(user.user_id);

    try {
      await usersService.updateRole(user.user_id, newRoleIdValue);

      const selectedRoleForUser = roles.find(
        (role) => Number(role.role_id) === newRoleIdValue,
      );

      setUsers((currentUsers) =>
        currentUsers.map((item) =>
          item.user_id === user.user_id
            ? {
                ...item,
                role_id: newRoleIdValue,
                role_name: selectedRoleForUser?.name ?? item.role_name,
                role_description:
                  selectedRoleForUser?.description ?? item.role_description,
              }
            : item,
        ),
      );

      setSuccessMessage(`Se actualizó el rol de ${user.full_name}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSavingRoleId(null);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage("Escribe el nombre y el apellido del usuario.");
      return;
    }

    if (!newRoleId) {
      setErrorMessage("Selecciona el rol que tendrá el usuario.");
      return;
    }

    if (password.length < 9) {
      setErrorMessage("La contraseña debe tener al menos 9 caracteres.");
      return;
    }

    if (password.length > 1024) {
      setErrorMessage("La contraseña supera la longitud permitida.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    if (!emailPreview) {
      setErrorMessage(
        "No se pudo generar el correo. Revisa el nombre y el apellido.",
      );
      return;
    }

    setCreating(true);

    try {
      const response = await usersService.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role_id: Number(newRoleId),
        password,
      });

      const createdEmail = response.user.email || emailPreview;

      setShowCreateForm(false);
      setFirstName("");
      setLastName("");
      setNewRoleId("");
      setPassword("");
      setConfirmPassword("");

      setSearch("");
      setRoleFilter("all");
      setQuickFilter("all");
      setPage(1);

      await loadData();

      setSuccessMessage(
        `Usuario creado correctamente. Correo asignado: ${createdEmail}`,
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setCreating(false);
    }
  }

  return (
    <Page>
      <ContentArea>
        <div className="space-y-6 pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted">
                <UsersIcon size={16} />
                Administración
                <span>/</span>
                <span>Usuarios y roles</span>
              </div>

              <h1 className="text-2xl font-bold text-ink sm:text-3xl">
                Usuarios y roles
              </h1>

              <p className="mt-1 text-sm text-muted">
                Administra las cuentas, los permisos y los roles de acceso.
              </p>
            </div>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <UserPlus size={18} />
              Agregar nuevo usuario
            </button>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle size={19} className="mt-0.5 shrink-0" />
              <p className="flex-1">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                aria-label="Cerrar mensaje de error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {successMessage && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
            >
              <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
              <p className="flex-1">{successMessage}</p>
              <button
                type="button"
                onClick={() => setSuccessMessage("")}
                aria-label="Cerrar mensaje de éxito"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => {
                resetFilters();
                setSuccessMessage("");
              }}
              className="rounded-2xl border border-line bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Usuarios registrados</p>
                  <p className="mt-2 text-3xl font-bold text-ink">
                    {users.length}
                  </p>
                </div>
                <span className="rounded-xl bg-blue-100 p-3 text-blue-700">
                  <UsersIcon size={22} />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">
                Ver todos los usuarios
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setRoleFilter("all");
                setQuickFilter("active-admins");
                setPage(1);
              }}
              className="rounded-2xl border border-line bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Administradores activos</p>
                  <p className="mt-2 text-3xl font-bold text-ink">
                    {activeAdmins.length}
                  </p>
                </div>
                <span className="rounded-xl bg-green-100 p-3 text-green-700">
                  <ShieldCheck size={22} />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">
                Ver solo administradores activos
              </p>
            </button>

            <button
              type="button"
              onClick={() => setShowRoles(true)}
              className="rounded-2xl border border-line bg-surface p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted">Roles disponibles</p>
                  <p className="mt-2 text-3xl font-bold text-ink">
                    {roles.length}
                  </p>
                </div>
                <span className="rounded-xl bg-purple-100 p-3 text-purple-700">
                  <Shield size={22} />
                </span>
              </div>
              <p className="mt-3 text-xs text-muted">
                Consultar roles y descripciones
              </p>
            </button>
          </div>

          <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
            <div className="border-b border-line p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-ink">
                    Directorio de usuarios
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Busca cuentas y administra sus roles.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadData()}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink transition hover:bg-nav disabled:opacity-50"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Actualizar
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px_auto]">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre, correo o rol..."
                    className="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  aria-label="Filtrar por rol"
                >
                  <option value="all">Todos los roles</option>
                  {roles.map((role) => (
                    <option key={role.role_id} value={String(role.role_id)}>
                      {role.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium text-ink transition hover:bg-nav"
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              </div>

              {quickFilter === "active-admins" && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
                  <span className="flex items-center gap-2">
                    <ShieldCheck size={16} />
                    Mostrando administradores activos
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuickFilter("all")}
                    className="font-semibold underline"
                  >
                    Ver todos
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-muted">
                <LoaderCircle size={30} className="animate-spin" />
                <p className="text-sm">Cargando usuarios...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <span className="rounded-2xl bg-nav p-4 text-muted">
                  <UserRound size={28} />
                </span>
                <h3 className="mt-4 font-semibold text-ink">
                  No se encontraron usuarios
                </h3>
                <p className="mt-1 max-w-md text-sm text-muted">
                  Intenta modificar la búsqueda o limpiar los filtros.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px] border-collapse text-left">
                    <thead className="bg-nav/60">
                      <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                        <th className="px-5 py-4 font-semibold">Usuario</th>
                        <th className="px-5 py-4 font-semibold">Rol</th>
                        <th className="px-5 py-4 font-semibold">Estado</th>
                        <th className="px-5 py-4 font-semibold">
                          Fecha de registro
                        </th>
                        <th className="px-5 py-4 font-semibold">
                          Cambiar rol
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {paginatedUsers.map((user) => (
                        <tr
                          key={user.user_id}
                          className="transition hover:bg-nav/30"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                                {getInitials(user.full_name || user.email)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-semibold text-ink">
                                  {user.full_name}
                                </p>
                                <p className="mt-0.5 text-sm text-muted">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(
                                  user.role_name,
                                )}`}
                              >
                                {user.role_name || "Sin rol"}
                              </span>
                              <span className="text-xs text-muted">
                                {user.role_description}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {isUserActive(user) ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-gray-500" />
                                Inactivo
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-muted">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString(
                                  "es-MX",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={String(user.role_id)}
                                disabled={savingRoleId === user.user_id}
                                onChange={(event) =>
                                  void handleRoleChange(user, event.target.value)
                                }
                                className="max-w-[220px] rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent disabled:opacity-50"
                                aria-label={`Cambiar rol de ${user.full_name}`}
                              >
                                {roles.map((role) => (
                                  <option
                                    key={role.role_id}
                                    value={String(role.role_id)}
                                  >
                                    {role.name}
                                  </option>
                                ))}
                              </select>

                              {savingRoleId === user.user_id && (
                                <LoaderCircle
                                  size={16}
                                  className="animate-spin text-muted"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">
                    Mostrando{" "}
                    <span className="font-semibold text-ink">
                      {(page - 1) * PAGE_SIZE + 1}
                    </span>
                    {"–"}
                    <span className="font-semibold text-ink">
                      {Math.min(page * PAGE_SIZE, filteredUsers.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-semibold text-ink">
                      {filteredUsers.length}
                    </span>{" "}
                    usuarios
                  </p>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                      Anterior
                    </button>

                    <span className="px-2 text-sm text-muted">
                      Página {page} de {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-nav disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <div className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
            <Info size={19} className="mt-0.5 shrink-0 text-muted" />
            <p className="text-sm text-muted">
              Los cambios de rol se aplican a la cuenta seleccionada. El sistema
              protege al último administrador activo para evitar que se pierda
              el acceso administrativo.
            </p>
          </div>
        </div>

        {showRoles && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowRoles(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="roles-modal-title"
              className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2
                    id="roles-modal-title"
                    className="text-xl font-bold text-ink"
                  >
                    Roles disponibles
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Consulta los permisos asociados a cada rol.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRoles(false)}
                  className="rounded-lg p-2 text-muted hover:bg-nav hover:text-ink"
                  aria-label="Cerrar ventana de roles"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {roles.map((role) => (
                  <div
                    key={role.role_id}
                    className="rounded-xl border border-line p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(
                          role.name,
                        )}`}
                      >
                        {role.name}
                      </span>
                      <span className="text-xs text-muted">
                        ID del rol: {role.role_id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {role.description || "Sin descripción disponible."}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRoles(false)}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Cerrar
                </button>
              </div>
            </section>
          </div>
        )}

        {showCreateForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            onClick={closeCreateForm}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-user-modal-title"
              className="my-auto max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex rounded-xl bg-accent/10 p-2.5 text-accent">
                    <UserPlus size={22} />
                  </div>
                  <h2
                    id="create-user-modal-title"
                    className="text-xl font-bold text-ink"
                  >
                    Agregar nuevo usuario
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Completa los datos para crear una cuenta local.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={creating}
                  className="rounded-lg p-2 text-muted hover:bg-nav hover:text-ink disabled:opacity-50"
                  aria-label="Cerrar formulario"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="mt-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="new-first-name"
                      className="mb-1.5 block text-sm font-medium text-ink"
                    >
                      Nombre(s)
                    </label>
                    <input
                      id="new-first-name"
                      autoComplete="given-name"
                      required
                      maxLength={100}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      placeholder="Ej. Daniela"
                      className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="new-last-name"
                      className="mb-1.5 block text-sm font-medium text-ink"
                    >
                      Apellido(s)
                    </label>
                    <input
                      id="new-last-name"
                      autoComplete="family-name"
                      required
                      maxLength={100}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      placeholder="Ej. Aedo"
                      className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-line bg-nav/30 p-4">
                  <div className="flex items-center gap-2">
                    <Mail size={18} className="text-accent" />
                    <p className="text-sm font-semibold text-ink">
                      Vista previa del correo corporativo
                    </p>
                  </div>

                  <p className="mt-2 break-all text-base font-semibold text-ink">
                    {emailPreview || "nombre.apellido@femsa.com"}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    El correo se genera usando el primer nombre y el primer
                    apellido. Si se detecta uno igual en los usuarios cargados,
                    se propone el siguiente número disponible.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="new-role"
                    className="mb-1.5 block text-sm font-medium text-ink"
                  >
                    Rol del usuario
                  </label>
                  <select
                    id="new-role"
                    required
                    value={newRoleId}
                    onChange={(event) => setNewRoleId(event.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Selecciona un rol</option>
                    {roles.map((role) => (
                      <option key={role.role_id} value={String(role.role_id)}>
                        {role.name}
                      </option>
                    ))}
                  </select>

                  {selectedRole && (
                    <div className="mt-3 rounded-xl border border-line p-3">
                      <p className="mb-2 text-xs font-medium text-muted">
                        Vista previa del rol asignado
                      </p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getRoleBadgeClass(
                          selectedRole.name,
                        )}`}
                      >
                        {selectedRole.name}
                      </span>
                      <p className="mt-2 text-sm text-muted">
                        {selectedRole.description ||
                          "Sin descripción disponible."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-line p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <KeyRound size={18} className="text-accent" />
                    <p className="text-sm font-semibold text-ink">
                      Contraseña temporal
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="new-password"
                        className="mb-1.5 block text-sm font-medium text-ink"
                      >
                        Contraseña
                      </label>
                      <input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={9}
                        maxLength={1024}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Mínimo 9 caracteres"
                        className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                      <p className="mt-1.5 text-xs text-muted">
                        Mínimo 9 caracteres.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="confirm-password"
                        className="mb-1.5 block text-sm font-medium text-ink"
                      >
                        Confirmar contraseña
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={9}
                        maxLength={1024}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Repite la contraseña"
                        className="w-full rounded-xl border border-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  </div>

                  {confirmPassword && (
                    <p
                      className={`mt-3 text-xs font-medium ${
                        password === confirmPassword
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {password === confirmPassword
                        ? "Las contraseñas coinciden."
                        : "Las contraseñas todavía no coinciden."}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">
                  <Info size={16} className="mt-0.5 shrink-0" />
                  <p>
                    La contraseña se almacenará como hash en el backend. El
                    correo mostrado es una vista previa; el servidor valida
                    nuevamente su disponibilidad al guardar.
                  </p>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeCreateForm}
                    disabled={creating}
                    className="rounded-xl border border-line px-4 py-3 text-sm font-semibold text-ink transition hover:bg-nav disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      creating ||
                      !firstName.trim() ||
                      !lastName.trim() ||
                      !newRoleId ||
                      password.length < 9 ||
                      password !== confirmPassword
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creating ? (
                      <>
                        <LoaderCircle size={17} className="animate-spin" />
                        Creando usuario...
                      </>
                    ) : (
                      <>
                        <UserPlus size={17} />
                        Crear usuario
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </ContentArea>
    </Page>
  );
}
