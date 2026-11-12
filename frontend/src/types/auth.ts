export enum RoleName {
  EMPLOYEE = 'EMPLOYEE',
  IT_SUPPORT_AGENT = 'IT_SUPPORT_AGENT',
  IT_MANAGER = 'IT_MANAGER',
  SYSTEM_ADMINISTRATOR = 'SYSTEM_ADMINISTRATOR',
}

export enum TicketStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_CUSTOMER = 'PENDING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum TicketPriority {
  CRITICAL_P1 = 'CRITICAL_P1',
  HIGH_P2 = 'HIGH_P2',
  MEDIUM_P3 = 'MEDIUM_P3',
  LOW_P4 = 'LOW_P4',
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
