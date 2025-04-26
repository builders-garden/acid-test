import { DbCollection } from "@/lib/types";
import { CollectorItem } from "./collector-item";
import { useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const totalPages = Math.ceil(sortedCollectors.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCollectors = sortedCollectors.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Generate array of page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);
    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }
    pages.push(totalPages);

    return pages;
  };

  return (
    <div className="w-full max-w-md">
      <h2 className="text-lg mb-3 font-bold">COLLECTORS</h2>
      <div className="space-y-2">
        {collectorsLoading ? (
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

            {currentCollectors.map((collector, i) => (
              <CollectorItem
                key={collector.userId}
                collector={collector}
                position={startIndex + i + 1}
                tokenId={tokenId}
                onClickUser={handleClickUser}
              />
            ))}

            {sortedCollectors.length === 0 && (
              <div className="text-center py-4">No collectors yet</div>
            )}

            {sortedCollectors.length > itemsPerPage && (
              <Pagination className="pt-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(currentPage - 1)}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, i) => (
                    <PaginationItem key={i}>
                      {pageNum === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          isActive={pageNum === currentPage}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(currentPage + 1)}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </div>
  );
};
