"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { BookmarkIcon, CheckIcon } from "lucide-react";

interface SongCollectionStatusProps {
  songId: number;
  initialIsCollected?: boolean;
}

export default function SongCollectionStatus({ 
  songId, 
  initialIsCollected = false 
}: SongCollectionStatusProps) {
  const [isCollected, setIsCollected] = useState(initialIsCollected);
  const [isLoading, setIsLoading] = useState(false);

  // Toggle collection status
  const toggleCollection = async () => {
    try {
      setIsLoading(true);
      
      // Call your API endpoint to add/remove from collection
      const response = await fetch(`/api/collection/${isCollected ? 'remove' : 'add'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ songId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update collection');
      }
      
      // Toggle the state after successful API call
      setIsCollected(!isCollected);
    } catch (error) {
      console.error('Error updating collection:', error);
      // Show error notification here if needed
    } finally {
      setIsLoading(false);
    }
  };

  // Check the latest collection status when component mounts
  useEffect(() => {
    const checkCollectionStatus = async () => {
      try {
        const response = await fetch(`/api/songs/${songId}`);
        const data = await response.json();
        setIsCollected(data.isCollected);
      } catch (error) {
        console.error('Error fetching collection status:', error);
      }
    };

    if (!initialIsCollected) {
      checkCollectionStatus();
    }
  }, [songId, initialIsCollected]);

  return (
    <Button
      variant={isCollected ? "default" : "outline"}
      className={`flex items-center gap-2 ${isCollected ? 'bg-green-600 hover:bg-green-700' : ''}`}
      onClick={toggleCollection}
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : isCollected ? (
        <>
          <CheckIcon className="h-4 w-4" />
          <span>Collected</span>
        </>
      ) : (
        <>
          <BookmarkIcon className="h-4 w-4" />
          <span>Add to Collection</span>
        </>
      )}
    </Button>
  );
} 