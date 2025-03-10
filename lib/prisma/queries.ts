import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { DbUser, InsertDbUser } from "../types";
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
