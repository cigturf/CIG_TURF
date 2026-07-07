import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";

import { Button, Display, LAYOUT, Text } from "@/components/design-system";

export const metadata = {
  title: "Booking Confirmed",
};

export default function BookingSuccessPage() {
  return (
    <div className="surface-public flex min-h-screen items-center">
      <div className={LAYOUT.containerMd}>
        <div className="mx-auto max-w-md text-center">
          <div className="bg-primary/15 text-primary mx-auto mb-6 flex size-16 items-center justify-center rounded-full">
            <CheckCircle2 className="size-8" strokeWidth={1.5} />
          </div>
          <Display size="sm" className="text-foreground">
            Booking confirmed
          </Display>
          <Text className="text-muted-foreground mt-3">
            Your slot is reserved. A confirmation will be sent to your email shortly.
          </Text>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button variant="outline" className="touch-target min-h-11 w-full sm:w-auto">
                Back to home
              </Button>
            </Link>
            <Link href="/book">
              <Button variant="booking" className="touch-target min-h-11 w-full sm:w-auto">
                Book another slot
                <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
