export type User = {
  user_id: number;
  entra_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  role_id: number;
  role_name: string;
  role_description: string;
};

export type Role = {
  role_id: number;
  name: string;
  description: string;
};

export type UsersResponse = {
  users: User[];
};

export type RolesResponse = {
  roles: Role[];
};

export type UpdateRoleResponse = {
  message: string;
  user: {
    user_id: number;
    email: string;
    full_name: string;
    role_id: number;
  };
};
