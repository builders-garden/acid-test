import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import {
  DbUser,
  InsertDbUser,
  DbSong,
  InsertDbSong,
  DbCollection,
  InsertDbCollection,
} from "../types";
import { prisma } from "./client";

export const getUser = async (fid: number) => {
  const user = await prisma.user.findUnique({
    where: {
      fid,
    },
  });

  if (!user) {
    return null;
  }

  return user;
};

export const createUser = async (user: InsertDbUser): Promise<DbUser> => {
  return await prisma.user.create({
    data: user,
  });
};

export const setUserNotificationDetails = async (
  fid: number,
  notificationDetails: FrameNotificationDetails
) => {
  return await prisma.user.update({
    where: {
      fid,
    },
    data: {
      notificationDetails: JSON.stringify(notificationDetails),
    },
  });
};

export const deleteUserNotificationDetails = async (fid: number) => {
  return await prisma.user.update({
    where: {
      fid,
    },
    data: {
      notificationDetails: null,
    },
  });
};

export const getUserNotificationDetails = async (
  fid: number
): Promise<FrameNotificationDetails | null> => {
  const user = await getUser(fid);

  if (!user) {
    return null;
  }

  return user.notificationDetails
    ? (JSON.parse(user.notificationDetails) as FrameNotificationDetails)
    : null;
};

export const getSong = async (id: number) => {
  return await prisma.song.findUnique({
    where: { id },
    include: {
      collectors: {
        include: {
          user: true,
        },
      },
    },
  });
};

export const createSong = async (song: InsertDbSong): Promise<DbSong> => {
  return await prisma.song.create({
    data: {
      id: song.id,
      title: song.title,
      startDate: song.startDate ?? "",
      endDate: song.endDate ?? "",
    },
  });
};

export const isInCollection = async (userId: number, songId: number) => {
  const collection = await prisma.collection.findUnique({
    where: {
      userId_songId: {
        userId,
        songId,
      },
    },
  });
  return !!collection;
};

export const getCollection = async (userId: number, songId: number) => {
  const collection = await prisma.collection.findUnique({
    where: {
      userId_songId: {
        userId,
        songId,
      },
    },
  });

  return collection;
};

export const getCollectorsBySongId = async (songId: number) => {
  const collectors = await prisma.collection.findMany({
    where: {
      songId,
    },
    include: {
      user: true,
    },
  });

  return collectors;
};

export const createCollection = async (collection: {
  userId: number;
  songId: number;
  amount: number;
}): Promise<DbCollection> => {
  // First check if the collection already exists
  const existingCollection = await isInCollection(
    collection.userId,
    collection.songId
  );

  if (existingCollection) {
    const res = await getCollection(collection.userId, collection.songId);

    if (!res) {
      throw new Error("Collection exists but couldn't be retrieved");
    }

    return await prisma.collection.update({
      where: {
        userId_songId: {
          userId: collection.userId,
          songId: collection.songId,
        },
      },
      data: {
        amount: res.amount + collection.amount,
      },
    });
  }

  const user = await getUser(collection.userId);
  if (!user) {
    throw new Error(`User with ID ${collection.userId} does not exist`);
  }

  const song = await getSong(collection.songId);
  if (!song) {
    throw new Error(`Song with ID ${collection.songId} does not exist`);
  }

  return await prisma.collection.create({
    data: {
      userId: collection.userId,
      songId: collection.songId,
      amount: collection.amount,
    },
  });
};
