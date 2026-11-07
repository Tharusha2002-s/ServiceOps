export enum RoleName {
  EMPLOYEE = 'EMPLOYEE',
  IT_SUPPORT_AGENT = 'IT_SUPPORT_AGENT',
  IT_MANAGER = 'IT_MANAGER',
  SYSTEM_ADMINISTRATOR = 'SYSTEM_ADMINISTRATOR',
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  jobTitle?: string;
  roles: RoleName[];
  permissions: string[];
}

export interface AuthResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    user: UserProfile;
  };
}

