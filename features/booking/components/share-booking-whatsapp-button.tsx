"use client";

import { MessageCircle } from "lucide-react";

import { Button, type ButtonProps } from "@/components/design-system";
import {
  buildBookingShareMessage,
  buildWhatsAppShareLink,
  type BookingShareDetails,
  type BookingShareMode,
} from "@/features/booking/lib/whatsapp-share";
import { cn } from "@/lib/utils";

type ShareBookingWhatsAppButtonProps = BookingShareDetails & {
  /** When set, opens a chat with this number directly (admin sharing to the
   * customer). Without one — e.g. no phone on file — wa.me falls back to its
   * own contact picker, so the button still works either way. */
  recipientPhone?: string | null;
  mode?: BookingShareMode;
  label?: string;
  iconOnly?: boolean;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Called right after the WhatsApp window is opened, e.g. to close a dialog. */
  onShared?: () => void;
};

export function ShareBookingWhatsAppButton({
  recipientPhone,
  mode = "friends",
  label = "Share on WhatsApp",
  iconOnly = false,
  variant = "outline",
  size = "lg",
  className,
  onShared,
  ...details
}: ShareBookingWhatsAppButtonProps) {
  const handleShare = () => {
    const message = buildBookingShareMessage(details, mode);
    const url = buildWhatsAppShareLink(message, recipientPhone);
    window.open(url, "_blank", "noopener,noreferrer");
    onShared?.();
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
