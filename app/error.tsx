"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button, Display, LAYOUT, Text } from "@/components/design-system";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={LAYOUT.containerMd + " flex min-h-[60vh] flex-col items-center justify-center py-16 text-center"}>
      <Display size="sm">Something went wrong</Display>
      <Text className="text-muted-foreground mt-3 max-w-md">
        An unexpected error occurred. Please try again or return to the home page.
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="booking" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    </div>
  );
}
