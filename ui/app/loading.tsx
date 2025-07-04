"use client";

import { LoadingSpinner } from "@/components/loading-spinner";

export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  );
}
