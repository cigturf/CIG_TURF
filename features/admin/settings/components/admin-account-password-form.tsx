"use client";

import { useState } from "react";
import { toast } from "sonner";

import { changeAdminPasswordAction } from "@/features/auth/actions";
import { Button, FormField, FormInput, Text } from "@/components/design-system";
import { passwordSchema } from "@/lib/validations/common";

export function AdminAccountPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async () => {
    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }

    const parsedNew = passwordSchema.safeParse(newPassword);
    if (!parsedNew.success) {
      toast.error(parsedNew.error.issues[0]?.message ?? "Invalid new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword === currentPassword) {
      toast.error("New password must be different from the current password");
      return;
    }

    setLoading(true);
    try {
      const result = await changeAdminPasswordAction(currentPassword, parsedNew.data);
      if (!result.success) {
        toast.error(result.error || "Failed to change password");
        return;
      }
      toast.success("Password changed successfully");
      reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm space-y-4">
      <Text size="sm" className="text-muted-foreground">
        Change the password for the admin sign-in account. Your current password is required to
        confirm the change.
      </Text>

      <FormField label="Current password" htmlFor="current-password">
        <FormInput
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          autoComplete="current-password"
        />
      </FormField>

      <FormField label="New password" htmlFor="new-password">
        <FormInput
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
        />
      </FormField>

      <FormField label="Confirm new password" htmlFor="confirm-new-password">
        <FormInput
          id="confirm-new-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
        />
      </FormField>

      <Button loading={loading} onClick={() => void handleSubmit()}>
        Change Password
      </Button>
    </div>
  );
}
