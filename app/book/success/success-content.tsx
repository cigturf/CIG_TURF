"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

import { Button, Display, LAYOUT, ScaleIn, Text } from "@/components/design-system";

export function BookingSuccessContent() {
  return (
    <div className="surface-public flex min-h-screen items-center">
      <div className={LAYOUT.containerMd}>
        <ScaleIn className="mx-auto max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="bg-primary/15 text-primary mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
          >
            <CheckCircle2 className="size-8" strokeWidth={1.5} />
          </motion.div>
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
        </ScaleIn>
      </div>
    </div>
  );
}
