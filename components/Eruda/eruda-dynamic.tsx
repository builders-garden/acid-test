"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "../ui/loading-screen";

export const ErudaProvider = dynamic(
  () => import("../Eruda").then((c) => c.ErudaProvider),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);
