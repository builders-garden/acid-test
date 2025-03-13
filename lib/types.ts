export interface DbUser {
  fid: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  walletAddress: string | null;
  notificationDetails: string | null;
  createdAt: Date;
}


export interface DbSong {
  id: number; 
  title: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: Date; 
}

export type InsertDbUser = Omit<DbUser, "createdAt">;
export type InsertDbSong = Omit<DbSong, "createdAt">;