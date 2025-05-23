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
  feat: string | null;
  createdAt: Date;
}

export interface DbCollection {
  userId: number;
  songId: number;
  amount: number;
  user?: DbUser;
  song?: DbSong;
}

export type InsertDbUser = Omit<DbUser, "createdAt">;
export type InsertDbSong = Omit<DbSong, "createdAt">;
export type InsertDbCollection = Omit<DbCollection, "createdAt">;

export interface DbSongWithCollectors {
  id: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
  feat: string | null;
  createdAt: Date;
  collectors: (DbCollection & {
    user: DbUser;
  })[];
}

export interface FeatArtist {
  users: {
    username: string;
    fid: number;
    pfp: string;
  }[];
  text?: string;
}
