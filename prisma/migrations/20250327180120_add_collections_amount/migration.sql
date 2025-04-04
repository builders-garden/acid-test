/*
Warnings:

- You are about to drop the column `collectedAt` on the `collections` table. All the data in the column will be lost.
- Added the required column `amount` to the `collections` table without a default value. This is not possible if the table is not empty.

 */
-- RedefineTables
PRAGMA defer_foreign_keys = ON;

PRAGMA foreign_keys = OFF;

-- Create new table with the updated schema
CREATE TABLE
  "new_collections" (
    "userId" INTEGER NOT NULL,
    "songId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    PRIMARY KEY ("userId", "songId"),
    CONSTRAINT "collections_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "collections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("fid") ON DELETE RESTRICT ON UPDATE CASCADE
  );

-- Copy data from the old table to the new table
INSERT INTO
  "new_collections" ("userId", "songId", "amount")
SELECT
  "userId",
  "songId",
  1
FROM
  "collections";

-- Drop the old table
DROP TABLE "collections";

-- Rename the new table to the original name
ALTER TABLE "new_collections"
RENAME TO "collections";

PRAGMA foreign_keys = ON;

PRAGMA defer_foreign_keys = OFF;