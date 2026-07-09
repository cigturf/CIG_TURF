import Link from "next/link";

import { Button, Display, LAYOUT, Text } from "@/components/design-system";

export default function NotFound() {
  return (
    <div className={LAYOUT.containerMd + " flex min-h-[60vh] flex-col items-center justify-center py-16 text-center"}>
      <Display size="sm">Page not found</Display>
      <Text className="text-muted-foreground mt-3 max-w-md">
        The page you are looking for does not exist or may have moved.
      </Text>
      <Link href="/" className="mt-8">
        <Button variant="booking">Back to home</Button>
      </Link>
    </div>
  );
}
