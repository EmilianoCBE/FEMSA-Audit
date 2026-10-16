import { useEffect, useMemo, useState } from "react";
import { Search, Users as UsersIcon } from "lucide-react";
import { ApiError } from "@/shared/api/httpClient";
import { ContentArea, EmptyState, Page, PageHeader } from "@/shared/ui";
import { usersService } from "../services/usersService";
import type { Role, User } from "../types";

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const [usersData, rolesData] = await Promise.all([usersService.list(), usersService.roles()]);

        setUsers(usersData);
        setRoles(rolesData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError("No se pudo cargar la información de usuarios.");
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.full_name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        user.role_name.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [users, search]);

  async function handleRoleChange(userId: number, roleId: number) {
    setSavingUserId(userId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await usersService.updateRole(userId, roleId);

      setUsers((currentUsers) =>
        currentUsers.map((user) => {
          if (user.user_id !== userId) {
            return user;
          }

          const newRole = roles.find((role) => role.role_id === roleId);

          return {
            ...user,
            role_id: roleId,
            role_name: newRole?.name ?? user.role_name,
            role_description: newRole?.description ?? user.role_description,
          };
        }),
      );

      setSuccessMessage(response.message);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("No se pudo actualizar el rol.");
      }
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <Page>
      <PageHeader
        title="Usuarios y roles"
        description="Administra los usuarios registrados en FEMSA GRC y asigna el rol correspondiente a cada uno."
      />

      <ContentArea>
        {successMessage && (
          <div
            role="status"
            className="mb-4 rounded-[5px] border border-line bg-surface px-4 py-3 text-body-sm text-ink"
          >
            ✓ {successMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-[5px] border border-line-2 bg-surface px-4 py-3 text-body-sm text-ink"
          >
            {error}
          </div>
        )}

        <div className="mb-4 flex flex-col gap-3 desktop:flex-row desktop:items-center desktop:justify-between">
          <div>
            <div className="flex items-center gap-2 text-body-sm font-medium text-ink">
              <UsersIcon size={17} />
              {loading ? "Cargando usuarios..." : `${users.length} usuario${users.length === 1 ? "" : "s"}`}
            </div>

            {!loading && search && (
              <p className="mt-1 text-control text-muted">
                Mostrando {filteredUsers.length} resultado
                {filteredUsers.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className="relative w-full desktop:w-[300px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar usuario..."
              aria-label="Buscar usuario"
              className="w-full rounded-[5px] border border-line-2 bg-surface py-2 pl-9 pr-3 text-body-sm text-ink outline-none placeholder:text-muted focus:border-accent"
            />
          </div>
        </div>

        {loading ? (
          <div
            role="status"
            className="rounded-md border border-line bg-surface px-4 py-10 text-center text-body-sm text-muted"
          >
            Cargando usuarios...
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No se encontraron usuarios"
            description={
              search ? "Intenta con otro nombre, correo o rol." : "No hay usuarios registrados para mostrar."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-md">
            <table className="w-full min-w-[760px] border-collapse overflow-hidden rounded-md border border-line bg-surface">
              <thead>
                <tr>
                  <th className="border-b border-line bg-nav px-3.5 py-[9px] text-left text-label font-semibold tracking-[.03em] text-muted uppercase">
                    Usuario
                  </th>

                  <th className="border-b border-line bg-nav px-3.5 py-[9px] text-left text-label font-semibold tracking-[.03em] text-muted uppercase">
                    Correo
                  </th>

                  <th className="border-b border-line bg-nav px-3.5 py-[9px] text-left text-label font-semibold tracking-[.03em] text-muted uppercase">
                    Estado
                  </th>

                  <th className="border-b border-line bg-nav px-3.5 py-[9px] text-left text-label font-semibold tracking-[.03em] text-muted uppercase">
                    Rol
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-row-hover">
                    <td className="border-b border-line px-3.5 py-3 align-middle">
                      <div className="font-medium text-ink">{user.full_name}</div>
                      <div className="mt-0.5 text-control text-muted">Usuario #{user.user_id}</div>
                    </td>

                    <td className="border-b border-line px-3.5 py-3 align-middle text-body-sm text-ink-2">
                      {user.email}
                    </td>

                    <td className="border-b border-line px-3.5 py-3 align-middle">
                      <span
                        className={
                          user.is_active
                            ? "inline-flex items-center rounded-full border border-line px-2 py-1 text-control text-ink"
                            : "inline-flex items-center rounded-full border border-line-2 px-2 py-1 text-control text-muted"
                        }
                      >
                        <span className="mr-1.5">{user.is_active ? "●" : "○"}</span>
                        {user.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    <td className="border-b border-line px-3.5 py-3 align-middle">
                      <select
                        value={user.role_id}
                        disabled={savingUserId === user.user_id}
                        onChange={(event) => void handleRoleChange(user.user_id, Number(event.target.value))}
                        aria-label={`Rol de ${user.full_name}`}
                        className="w-full max-w-[240px] rounded-[5px] border border-line-2 bg-surface px-2.5 py-2 text-body-sm text-ink outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {roles.map((role) => (
                          <option key={role.role_id} value={role.role_id}>
                            {role.name}
                          </option>
                        ))}
                      </select>

                      {savingUserId === user.user_id && (
                        <div className="mt-1 text-control text-muted">Guardando...</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentArea>
    </Page>
  );
}
