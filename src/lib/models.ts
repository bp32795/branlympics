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
  /** Admin-defined position in the public itinerary. */
  itineraryOrder?: number;
  /** Inclusive. 1 = solo allowed. */
  minTeamSize: number;
  maxTeamSize: number;
  /** Data URL or http(s) URL for the game photo. */
  imageUrl?: string;
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

export type GameSuggestionStatus = "pending" | "approved" | "rejected";

export interface GameSuggestion {
  id: string;
  title: string;
  description: string;
  minTeamSize: number;
  maxTeamSize: number;
  imageUrl?: string;
  /** Optional note from the submitter to admins. */
  note?: string;
  submittedBy: string;
  submitterName: string;
  submitterEmail: string;
  status: GameSuggestionStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  /** If approved, the resulting Game id. */
  approvedGameId?: string;
}
