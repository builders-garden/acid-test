import { DbCollection } from "@/lib/types";
import { CollectorItem } from "./collector-item";

type CollectorsSectionProps = {
  collectorsLoading: boolean;
  sortedCollectors: DbCollection[];
  userFid: number | null;
  userPosition: number | null;
  tokenId: number;
  handleClickUser: (fid: number) => void;
};

export const CollectorsSection = ({
  collectorsLoading,
  sortedCollectors,
  userFid,
  userPosition,
  tokenId,
  handleClickUser,
}: CollectorsSectionProps) => {
  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg mb-3 font-bold">COLLECTORS</h2>
      <div className="space-y-2">
        {/* Show loading state when collectors are being fetched */}
        {collectorsLoading ? (
          <div className="text-center py-4">Loading collectors...</div>
        ) : (
          <>
            {/* Signed-in user's collector spot if they're in the list and have FID */}
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

            {/* Display all collectors */}
            {sortedCollectors.map((collector, i) => (
              <CollectorItem
                key={collector.userId}
                collector={collector}
                position={i + 1}
                tokenId={tokenId}
                onClickUser={handleClickUser}
              />
            ))}

            {/* Show message if no collectors */}
            {sortedCollectors.length === 0 && (
              <div className="text-center py-4">No collectors yet</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
