import { DbCollection } from "@/lib/types";
import { CollectorItem } from "./collector-item";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

type CollectorsSectionProps = {
  collectorsLoading: boolean;
  sortedCollectors: DbCollection[];
  userFid: number | null;
  userPosition: number | null;
  tokenId: number;
  handleClickUser: (fid: number) => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
};

export const CollectorsSection = ({
  collectorsLoading,
  sortedCollectors,
  userFid,
  userPosition,
  tokenId,
  handleClickUser,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: CollectorsSectionProps) => {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg mb-3 font-bold">COLLECTORS</h2>
      <div className="space-y-2">
        {collectorsLoading && sortedCollectors.length === 0 ? (
          <div className="text-center py-4">Loading collectors...</div>
        ) : (
          <>
            {userFid && userPosition && sortedCollectors && (
              <CollectorItem
                collector={
                  sortedCollectors.find((c) => c.user?.fid === userFid)!
                }
                position={userPosition}
                tokenId={tokenId}
                isUser={true}
              />
            )}

            {sortedCollectors.map((collector, i) => (
              <CollectorItem
                key={collector.userId}
                collector={collector}
                position={i + 1}
                tokenId={tokenId}
                onClickUser={handleClickUser}
              />
            ))}

            {sortedCollectors.length === 0 && (
              <div className="text-center py-4">No collectors yet</div>
            )}

            {hasNextPage && (
              <div
                ref={ref}
                className="text-center py-4"
              >
                {isFetchingNextPage ? "Loading more..." : ""}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
