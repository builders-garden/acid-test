"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { SongMetadata } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { useUsersByUsernames } from "@/hooks/use-users-by-usernames";

interface SongDescriptionProps {
  metadata: SongMetadata | null;
  isLoading: boolean;
}

export function SongDescription({ metadata, isLoading }: SongDescriptionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Extract all usernames from the description for preloading
  const usernames = useMemo(() => {
    if (!metadata?.description) return null;

    const tagRegex = /@([a-zA-Z0-9._-]+)/g;
    const matches = Array.from(metadata.description.matchAll(tagRegex));
    return matches.map((match) => match[1]);
  }, [metadata?.description]);

  // Fetch user data for all tags in the description
  const { data: usersData } = useUsersByUsernames(usernames);

  // Create a map of username to FID for easy lookup
  const userMap = useMemo(() => {
    if (!usersData?.users) return new Map();

    const map = new Map();
    usersData.users.forEach((user) => {
      if (user.success && user.fid) {
        map.set(user.username, user.fid);
      }
    });
    return map;
  }, [usersData]);

  if (isLoading || !metadata) {
    return (
      <div className="w-full max-w-lg bg-black/20 border border-white/10 rounded-lg p-4 animate-pulse">
        <div className="h-16 bg-white/10 rounded-md"></div>
      </div>
    );
  }

  if (!metadata.description) {
    return null;
  }

  // Get the first 100 characters for the short description
  const fullDescription = metadata.description;
  const hasMore = fullDescription.length > 100;

  // Create the short description without the ellipsis if we'll show the button
  // Also trim any trailing whitespace to ensure the ellipsis appears directly after the last character
  const shortDescription = hasMore
    ? fullDescription.substring(0, 100).replace(/\s+$/, "")
    : fullDescription;

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-baseline">
        <p className="whitespace-pre-wrap text-sm mr-1">
          {shortDescription}
          {hasMore && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
            >
              <DialogTrigger asChild>
                <button className="text-blue-400 hover:text-blue-300 transition-colors text-sm inline-flex items-baseline ml-[-1px]">
                  <span className="text-white mr-1">...</span>
                  <span>show more</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-black text-white border-white/20 p-6 max-h-[80vh] overflow-y-auto max-w-[85%] rounded-lg">
                <DescriptionContent
                  description={metadata.description}
                  userMap={userMap}
                />
              </DialogContent>
            </Dialog>
          )}
        </p>
      </div>
    </div>
  );
}

function DescriptionContent({
  description,
  userMap,
}: {
  description: string;
  userMap: Map<string, string>;
}) {
  const [parsedDescription, setParsedDescription] = useState<React.ReactNode[]>(
    []
  );

  const handleLinkClick = useCallback(async (url: string) => {
    try {
      await sdk.actions.openUrl(url);
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  }, []);

  const handleTagClick = useCallback(
    async (username: string) => {
      try {
        const fid = userMap.get(username);
        if (fid) {
          await sdk.actions.viewProfile({ fid: parseInt(fid) });
        } else {
          console.log(`No FID found for username: ${username}`);
        }
      } catch (error) {
        console.error("Error viewing profile:", error);
      }
    },
    [userMap]
  );

  const parseTagsInText = useCallback(
    (text: string) => {
      // Updated regex to match @ followed by alphanumeric chars & common username chars like dots,
      // but exclude trailing punctuation
      const tagRegex = /@([a-zA-Z0-9._-]+)/g;
      const parts: React.ReactNode[] = [];

      let lastIndex = 0;
      let match;

      while ((match = tagRegex.exec(text)) !== null) {
        // Add text before the tag
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }

        // Add the tag as a clickable element
        const username = match[1]; // Just the username without the @ symbol
        parts.push(
          <a
            key={`tag-${match.index}`}
            className="text-blue-400 hover:text-blue-300 cursor-pointer"
            onClick={() => handleTagClick(username)}
          >
            @{username}
          </a>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add the remaining text after the last tag
      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return <span key={`segment-${text}`}>{parts}</span>;
    },
    [handleTagClick]
  );

  useEffect(() => {
    const parseDescription = () => {
      const parts: React.ReactNode[] = [];
      let currentText = "";

      // Regular expression for links
      const linkRegex = /https?:\/\/[^\s]+/g;

      let lastIndex = 0;
      let match;

      // Find all links
      while ((match = linkRegex.exec(description)) !== null) {
        // Add text before the link
        if (match.index > lastIndex) {
          const textSegment = description.substring(lastIndex, match.index);
          currentText += textSegment;
        }

        // Add accumulated text before the link
        if (currentText) {
          parts.push(parseTagsInText(currentText));
          currentText = "";
        }

        // Add the link as a clickable element
        const url = match[0];
        parts.push(
          <a
            key={`link-${match.index}`}
            className="text-blue-400 hover:text-blue-300 cursor-pointer break-all"
            onClick={() => handleLinkClick(url)}
          >
            {url}
          </a>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add the remaining text after the last link
      if (lastIndex < description.length) {
        currentText += description.substring(lastIndex);
      }

      // Process any remaining text with tags
      if (currentText) {
        parts.push(parseTagsInText(currentText));
      }

      setParsedDescription(parts);
    };

    parseDescription();
  }, [description, parseTagsInText, handleLinkClick]);

  return (
    <div className="whitespace-pre-wrap w-full">
      <h2 className="text-xl font-semibold mb-4">Description</h2>
      <div className="text-sm break-words">{parsedDescription}</div>
    </div>
  );
}
