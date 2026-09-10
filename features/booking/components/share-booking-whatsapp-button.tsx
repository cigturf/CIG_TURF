"use client";

import { MessageCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/design-system";
import {
  buildBookingShareMessage,
  buildWhatsAppShareLink,
  type BookingShareDetails,
} from "@/features/booking/lib/whatsapp-share";
import { cn } from "@/lib/utils";

type ShareBookingWhatsAppButtonProps = BookingShareDetails & {
  /** When set, opens a chat with this number directly (admin sharing to the
   * customer). Omit for "share with anyone" (customer sharing with friends). */
  recipientPhone?: string | null;
  label?: string;
  iconOnly?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

export function ShareBookingWhatsAppButton({
  recipientPhone,
  label = "Share on WhatsApp",
  iconOnly = false,
  variant = "outline",
  size = "lg",
  className,
  ...details
}: ShareBookingWhatsAppButtonProps) {
  const handleShare = () => {
    const message = buildBookingShareMessage(details);
    const url = buildWhatsAppShareLink(message, recipientPhone);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={iconOnly ? "icon-sm" : size}
      className={cn(className)}
      onClick={handleShare}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      <MessageCircle className="size-4" />
      {iconOnly ? null : label}
    </Button>
  );
}
