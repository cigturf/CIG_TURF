"use client";

import { formatAdminRole } from "@/features/admin/config/admin-permissions";
import { useAdminShell } from "@/features/admin/providers/admin-shell-provider";
import { Card, CardBody, CardHeader, CardTitle, Heading, Text } from "@/components/design-system";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminProfilePageClient() {
  const { admin, branding } = useAdminShell();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Heading level="h3" className="mb-2">
          Admin Profile
        </Heading>
        <Text className="text-muted-foreground">
          Your admin identity for {branding.businessName}.
        </Text>
      </div>

      <Card variant="admin" padding="md">
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            {admin.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={admin.image}
                alt={admin.name}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="bg-primary/15 text-primary flex size-16 items-center justify-center rounded-full text-lg font-semibold">
                {getInitials(admin.name)}
              </span>
            )}
            <div>
              <Text className="font-semibold">{admin.name}</Text>
              <Text size="sm" className="text-primary font-medium">
                {formatAdminRole(admin.role)}
              </Text>
            </div>
          </div>
          <div>
            <Text size="sm" className="text-muted-foreground">
              Email
            </Text>
            <Text className="font-medium">{admin.email}</Text>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
