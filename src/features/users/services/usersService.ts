import { httpClient } from "@/shared/api/httpClient";
import type {
  Role,
  RolesResponse,
  UpdateRoleResponse,
  User,
  UsersResponse,
} from "../types";

export const usersService = {
  list: async (): Promise<User[]> => {
    const response = await httpClient.get<UsersResponse>("/users");
    return response.users;
  },

  roles: async (): Promise<Role[]> => {
    const response = await httpClient.get<RolesResponse>("/users/roles");
    return response.roles;
  },

  updateRole: (userId: number, roleId: number) =>
    httpClient.put<UpdateRoleResponse>(`/users/${userId}/role`, {
      role_id: roleId,
    }),
};