export interface DbUser {
  fid: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  notificationDetails: string | null;
  createdAt: Date;
}

export type InsertDbUser = Omit<DbUser, "createdAt">;
