import { DbCollection } from "@/lib/types";
import { CollectorItem } from "./collector-item";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useUserCollector } from "@/hooks/use-get-collectors";

type CollectorsSectionProps = {
  collectorsLoading: boolean;
  sortedCollectors: DbCollection[];
  userFid: number | null;
  tokenId: number;
  handleClickUser: (fid: number) => void;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  userCollectorData:
    | {
        collection: DbCollection | null;
        position: number | null;
      }
    | undefined;
  userCollectorIsLoading: boolean;
};

export const CollectorsSection = ({
  collectorsLoading,
  sortedCollectors,
  userFid,
  tokenId,
  handleClickUser,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  userCollectorData,
  userCollectorIsLoading,
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
        {userCollectorIsLoading ||
        (collectorsLoading && sortedCollectors.length === 0) ? (
          <div className="text-center py-4">Loading collectors...</div>
        ) : (
          <>
            {userFid &&
              userCollectorData?.collection &&
              userCollectorData.position && (
                <CollectorItem
                  collector={userCollectorData.collection}
                  position={userCollectorData.position}
                  tokenId={tokenId}
                  isUser={true}
                />
              )}

            {sortedCollectors.map((collector) => (
              <CollectorItem
                key={collector.userId}
                collector={collector}
                position={
                  sortedCollectors.findIndex(
                    (c) => c.userId === collector.userId
                  ) + 1
                }
                tokenId={tokenId}
                onClickUser={handleClickUser}
              />
            ))}

            {sortedCollectors.length === 0 &&
              !userCollectorData?.collection && (
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
