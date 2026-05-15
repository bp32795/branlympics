// Shared domain types persisted in Cosmos DB.

export type AuthProvider = "google" | "microsoft-entra-id" | "credentials";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: AuthProvider;
  /** Only set for credentials provider. bcrypt hash. */
  passwordHash?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  location?: string;
  /** ISO datetime — when this game will be played. */
  scheduledFor?: string;
  /** Inclusive. 1 = solo allowed. */
  minTeamSize: number;
  maxTeamSize: number;
  createdBy: string;
  createdAt: string;
}

export interface Signup {
  id: string;
  gameId: string;
  userId: string;
  /** Players sharing the same teamId are on the same team. Undefined = solo. */
  teamId?: string;
  createdAt: string;
}

export type TeamRequestStatus = "pending" | "accepted" | "declined" | "cancelled";

export interface TeamRequest {
  id: string;
  gameId: string;
  fromUserId: string;
  toUserId: string;
  status: TeamRequestStatus;
  createdAt: string;
  respondedAt?: string;
}
