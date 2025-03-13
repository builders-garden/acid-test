import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { DbUser, InsertDbUser, DbSong, InsertDbSong } from "../types";
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
    data: song,
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


export const createCollection = async (userId: number, songId: number): Promise<boolean> => {
  try {
    // Check if the relation already exists
    const existingCollection = await isInCollection(userId, songId);
    
    if (existingCollection) {
      return false; // User already owns this song
    }
    
    // Create the new collection entry
    await prisma.collection.create({
      data: {
        userId,
        songId,
        // collectedAt will default to now() as defined in your schema
      },
    });
    
    return true; // Successfully created the collection
  } catch (error) {
    console.error("Error creating collection:", error);
    return false; // Failed to create collection
  }
};