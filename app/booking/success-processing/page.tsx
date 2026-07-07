import { Suspense } from "react";

import { SuccessProcessingClient } from "@/features/booking/components/success-processing-client";

export const metadata = {
  title: "Processing Booking",
};

export default function SuccessProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
        </div>
      }
    >
      <SuccessProcessingClient />
    </Suspense>
  );
}
