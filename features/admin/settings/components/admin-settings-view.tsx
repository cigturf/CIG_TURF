"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { QUERY_KEYS } from "@/config/query-keys.config";

import type { BusinessSettings, PricingTier } from "@/features/business-settings/types";
import { createEmptyBusinessSettings } from "@/features/business-settings/lib/defaults";
import { parseBusinessSettings } from "@/features/business-settings/lib/parse";
import { useBusinessSettings } from "@/features/business-settings/hooks/use-business-settings";
import {
  AnalyticsCard,
  Badge,
  Button,
  Heading,
  Input,
  Text,
  Textarea,
} from "@/components/design-system";

type SettingsSection =
  | "general"
  | "branding"
  | "contact"
  | "booking"
  | "pricing"
  | "payments"
  | "emails"
  | "notifications"
  | "social"
  | "seo"
  | "legal"
  | "advanced";

const SECTIONS: Array<{ id: SettingsSection; label: string; description: string }> = [
  { id: "general", label: "General", description: "Name, locale, and platform defaults." },
  { id: "branding", label: "Branding", description: "Logo, colors, and public identity." },
  { id: "contact", label: "Contact", description: "Address, phone numbers, and support." },
  { id: "booking", label: "Booking", description: "Window, duration, advance, and policies." },
  { id: "pricing", label: "Pricing Display", description: "Homepage Transparent Rates tiers." },
  { id: "payments", label: "Payments", description: "Instructions and settlement messages." },
  { id: "emails", label: "Emails", description: "Admin notification recipients and templates." },
  { id: "notifications", label: "Notifications", description: "Prepare notification preferences." },
  { id: "social", label: "Social Links", description: "Social presence and external links." },
  { id: "seo", label: "SEO", description: "Meta title and description for public pages." },
  { id: "legal", label: "Legal", description: "Terms, privacy, refunds and cancellations." },
  { id: "advanced", label: "Advanced", description: "Maintenance mode and system toggles." },
];

function resolveStringArray(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminSettingsView() {
  const empty = useMemo(() => createEmptyBusinessSettings(), []);
  const publicSettingsQuery = useBusinessSettings();
  const queryClient = useQueryClient();

  const [section, setSection] = useState<SettingsSection>("general");
  const [settings, setSettings] = useState<BusinessSettings>(empty);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { settings: BusinessSettings }) => {
        if (cancelled) return;
        const parsed = parseBusinessSettings(data.settings) ?? empty;
        setSettings(parsed);
      })
      .catch(() => {
        if (!cancelled) setSettings(empty);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [empty]);

  const activeSection = SECTIONS.find((item) => item.id === section) ?? SECTIONS[0]!;

  const save = async () => {
    const parsed = parseBusinessSettings(settings);
    if (!parsed) {
      toast.error("Settings payload is invalid. Please review fields.");
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: parsed }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save settings");
      }
      const data = (await response.json()) as { settings: BusinessSettings };
      setSettings(parseBusinessSettings(data.settings) ?? parsed);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.businessSettings.public });
      toast.success("Settings saved — changes are live on the website");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Heading level="h1">Business Configuration</Heading>
          <Text className="text-muted-foreground mt-1">
            Centralized configuration center — changes propagate live across customer and admin modules.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button loading={isSaving} onClick={() => void save()}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_360px]">
        <aside className="space-y-2">
          <AnalyticsCard title="Settings" description="Navigate configuration sections.">
            <div className="space-y-1">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={[
                    "w-full rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors",
                    section === item.id
                      ? "border-primary bg-primary/10"
                      : "border-border/70 hover:bg-muted/20",
                  ].join(" ")}
                >
                  <div className="font-medium">{item.label}</div>
                  <div className="text-muted-foreground mt-0.5 text-xs">{item.description}</div>
                </button>
              ))}
            </div>
          </AnalyticsCard>
        </aside>

        <main className="min-w-0 space-y-6">
          <AnalyticsCard title={activeSection.label} description={activeSection.description}>
            {isLoading ? (
              <Text size="sm" className="text-muted-foreground">
                Loading settings…
              </Text>
            ) : (
              <SettingsSectionForm section={section} settings={settings} onChange={setSettings} />
            )}
          </AnalyticsCard>
        </main>

        <aside className="space-y-6">
          <AnalyticsCard title="Live Preview" description="Branding preview updates instantly.">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Text className="font-semibold">
                    {settings.branding.businessName ?? "Business name not set"}
                  </Text>
                  <Text size="sm" className="text-muted-foreground">
                    {settings.branding.tagline ?? "Tagline not set"}
                  </Text>
                </div>
                {settings.branding.themeAccentColor ? (
                  <span
                    className="size-8 rounded-full border"
                    style={{ backgroundColor: settings.branding.themeAccentColor }}
                    aria-label="Accent color"
                  />
                ) : null}
              </div>

              <div className="border-border/70 bg-muted/20 rounded-[var(--radius-md)] border p-3">
                <Text size="sm" className="text-muted-foreground">
                  Logo URL
                </Text>
                <Text size="sm" className="mt-1 break-all">
                  {settings.branding.logoUrl ?? "—"}
                </Text>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  Timezone: {settings.operations.timezone ?? "—"}
                </Badge>
                <Badge variant="outline">
                  Currency: {settings.pricing.currency ?? "INR"}
                </Badge>
                {settings.operations.maintenanceMode ? (
                  <Badge variant="destructive">Maintenance Mode</Badge>
                ) : (
                  <Badge variant="secondary">Live</Badge>
                )}
              </div>

              <Text size="sm" className="text-muted-foreground">
                Public modules are already consuming Business Settings through the shared providers.
              </Text>
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Realtime Status" description="Settings refresh live without reload.">
            <Text size="sm" className="text-muted-foreground">
              Public settings hook is{" "}
              <span className="font-medium text-foreground">
                {publicSettingsQuery.isLoading ? "loading" : "ready"}
              </span>
              .
            </Text>
            <Text size="sm" className="text-muted-foreground mt-1">
              Any `business_settings` update triggers a refresh via the event bus.
            </Text>
          </AnalyticsCard>
        </aside>
      </div>
    </div>
  );
}

function SettingsSectionForm({
  section,
  settings,
  onChange,
}: {
  section: SettingsSection;
  settings: BusinessSettings;
  onChange: (next: BusinessSettings) => void;
}) {
  if (section === "general") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business Name" value={settings.branding.businessName ?? ""} onChange={(value) =>
          onChange({ ...settings, branding: { ...settings.branding, businessName: value || null } })
        } />
        <Field label="Short Name" value={settings.branding.shortName ?? ""} onChange={(value) =>
          onChange({ ...settings, branding: { ...settings.branding, shortName: value || null } })
        } />
        <Field label="Tagline" value={settings.branding.tagline ?? ""} onChange={(value) =>
          onChange({ ...settings, branding: { ...settings.branding, tagline: value || null } })
        } />
        <Field label="Timezone" value={settings.operations.timezone ?? ""} onChange={(value) =>
          onChange({ ...settings, operations: { ...settings.operations, timezone: value || null } })
        } />
        <Field label="Currency" value={settings.pricing.currency ?? ""} onChange={(value) =>
          onChange({ ...settings, pricing: { ...settings.pricing, currency: value || null } })
        } />
        <Field
          label="Language"
          value={settings.metadata.language ?? ""}
          onChange={(value) =>
            onChange({ ...settings, metadata: { ...settings.metadata, language: value || null } })
          }
        />
      </div>
    );
  }

  if (section === "branding") {
    return (
      <div className="space-y-4">
        <Field label="Business Description" value={settings.branding.description ?? ""} multiline onChange={(value) =>
          onChange({ ...settings, branding: { ...settings.branding, description: value || null } })
        } />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo URL" value={settings.branding.logoUrl ?? ""} onChange={(value) =>
            onChange({ ...settings, branding: { ...settings.branding, logoUrl: value || null } })
          } />
          <Text size="sm" className="text-muted-foreground sm:col-span-2">
            Upload a logo in Media → Logos (public), then paste its URL here — e.g.{" "}
            <code className="text-xs">/api/media/your-asset-id</code>. Leave empty to use the
            latest public logo from Media automatically.
          </Text>
          <Field label="Favicon URL" value={settings.branding.faviconUrl ?? ""} onChange={(value) =>
            onChange({ ...settings, branding: { ...settings.branding, faviconUrl: value || null } })
          } />
          <Field label="Accent Color" value={settings.branding.themeAccentColor ?? ""} onChange={(value) =>
            onChange({ ...settings, branding: { ...settings.branding, themeAccentColor: value || null } })
          } />
        </div>
      </div>
    );
  }

  if (section === "contact") {
    return (
      <div className="space-y-4">
        <Field label="Address" value={settings.contact.address ?? ""} multiline onChange={(value) =>
          onChange({ ...settings, contact: { ...settings.contact, address: value || null } })
        } />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" value={settings.contact.city ?? ""} onChange={(value) =>
            onChange({ ...settings, contact: { ...settings.contact, city: value || null } })
          } />
          <Field label="State" value={settings.contact.state ?? ""} onChange={(value) =>
            onChange({ ...settings, contact: { ...settings.contact, state: value || null } })
          } />
          <Field label="Pincode" value={settings.contact.pincode ?? ""} onChange={(value) =>
            onChange({ ...settings, contact: { ...settings.contact, pincode: value || null } })
          } />
          <Field
            label="Phone Numbers (comma separated)"
            value={(settings.contact.contactNumbers ?? []).join(", ")}
            onChange={(value) =>
              onChange({
                ...settings,
                contact: {
                  ...settings.contact,
                  contactNumbers: resolveStringArray(value),
                },
              })
            }
          />
          <Field
            label="WhatsApp Numbers (comma separated)"
            value={(settings.contact.whatsappNumbers ?? []).join(", ")}
            onChange={(value) =>
              onChange({
                ...settings,
                contact: {
                  ...settings.contact,
                  whatsappNumbers: resolveStringArray(value),
                  whatsappNumber: null,
                },
              })
            }
          />
          <Field label="Google Maps Link" value={settings.contact.googleMapsLink ?? ""} onChange={(value) =>
            onChange({ ...settings, contact: { ...settings.contact, googleMapsLink: value || null } })
          } />
        </div>
      </div>
    );
  }

  if (section === "booking") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Booking Window (days)"
          type="number"
          value={String(settings.booking.maxAdvanceBookingDays ?? "")}
          onChange={(value) =>
            onChange({
              ...settings,
              booking: {
                ...settings.booking,
                maxAdvanceBookingDays: value ? Number(value) : null,
              },
            })
          }
        />
        <Field
          label="Slot Duration (minutes)"
          type="number"
          value={String(settings.booking.slotDurationMinutes ?? "")}
          onChange={(value) =>
            onChange({
              ...settings,
              booking: {
                ...settings.booking,
                slotDurationMinutes: value ? Number(value) : null,
              },
            })
          }
        />
        <Field
          label="Cancellation Window (hours)"
          type="number"
          value={String(settings.booking.cancellationWindowHours ?? "")}
          onChange={(value) =>
            onChange({
              ...settings,
              booking: {
                ...settings.booking,
                cancellationWindowHours: value ? Number(value) : null,
              },
            })
          }
        />
        <Field
          label="Advance Amount (₹)"
          type="number"
          value={String(settings.booking.advanceAmount ?? "")}
          onChange={(value) =>
            onChange({
              ...settings,
              booking: {
                ...settings.booking,
                advanceAmount: value ? Number(value) : null,
              },
            })
          }
        />
      </div>
    );
  }

  if (section === "pricing") {
    const tiers = settings.pricing.tiers ?? [];

    const updateTiers = (next: PricingTier[]) => {
      onChange({
        ...settings,
        pricing: {
          ...settings.pricing,
          tiers: next.length > 0 ? next : null,
        },
      });
    };

    return (
      <div className="space-y-4">
        <Text size="sm" className="text-muted-foreground">
          These tiers appear on the homepage under <strong>Transparent rates</strong>. Click{" "}
          <strong>Save Changes</strong> after editing. Live booking prices are managed separately
          under Admin → Pricing.
        </Text>

        <Field
          label="Currency"
          value={settings.pricing.currency ?? "INR"}
          onChange={(value) =>
            onChange({
              ...settings,
              pricing: { ...settings.pricing, currency: value || null },
            })
          }
        />

        {tiers.map((tier, index) => (
          <div
            key={tier.id}
            className="border-border/70 space-y-3 rounded-[var(--radius-md)] border p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Text className="font-medium">Tier {index + 1}</Text>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateTiers(tiers.filter((item) => item.id !== tier.id))}
              >
                Remove
              </Button>
            </div>
            <Field
              label="Name"
              value={tier.name ?? ""}
              onChange={(value) =>
                updateTiers(
                  tiers.map((item) =>
                    item.id === tier.id ? { ...item, name: value || null } : item,
                  ),
                )
              }
            />
            <Field
              label="Price per hour (₹)"
              type="number"
              value={tier.pricePerHour != null ? String(tier.pricePerHour) : ""}
              onChange={(value) =>
                updateTiers(
                  tiers.map((item) =>
                    item.id === tier.id
                      ? { ...item, pricePerHour: value ? Number(value) : null }
                      : item,
                  ),
                )
              }
            />
            <Field
              label="Description"
              value={tier.description ?? ""}
              multiline
              onChange={(value) =>
                updateTiers(
                  tiers.map((item) =>
                    item.id === tier.id ? { ...item, description: value || null } : item,
                  ),
                )
              }
            />
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const nextTier: PricingTier = {
              id: `tier-${Date.now()}`,
              name: null,
              description: null,
              pricePerHour: null,
              peakPricePerHour: null,
              sortOrder: tiers.length,
            };
            updateTiers([...tiers, nextTier]);
          }}
        >
          Add pricing tier
        </Button>
      </div>
    );
  }

  if (section === "payments") {
    return (
      <div className="space-y-4">
        <Text size="sm" className="text-muted-foreground">
          Payment instructions and messaging will be wired into payment flows in a later milestone.
        </Text>
      </div>
    );
  }

  if (section === "emails") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="From Name"
          value={settings.emails.fromName ?? ""}
          onChange={(value) =>
            onChange({
              ...settings,
              emails: { ...settings.emails, fromName: value || null },
            })
          }
        />
        <Field
          label="Reply-To Email"
          value={settings.emails.replyToEmail ?? ""}
          onChange={(value) =>
            onChange({
              ...settings,
              emails: { ...settings.emails, replyToEmail: value || null },
            })
          }
        />
        <Field
          label="Owner Notification Emails (comma separated)"
          value={(settings.emails.ownerNotificationEmails ?? settings.emails.bookingNotificationEmails ?? []).join(", ")}
          onChange={(value) =>
            onChange({
              ...settings,
              emails: {
                ...settings.emails,
                ownerNotificationEmails: resolveStringArray(value),
                bookingNotificationEmails: resolveStringArray(value),
              },
            })
          }
        />
        <Field
          label="Support Emails (comma separated)"
          value={(settings.emails.supportEmails ?? []).join(", ")}
          onChange={(value) =>
            onChange({
              ...settings,
              emails: { ...settings.emails, supportEmails: resolveStringArray(value) },
            })
          }
        />
        <Field
          label="Finance Emails (comma separated)"
          value={(settings.emails.financeEmails ?? []).join(", ")}
          onChange={(value) =>
            onChange({
              ...settings,
              emails: { ...settings.emails, financeEmails: resolveStringArray(value) },
            })
          }
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.emails.enableCustomerEmails ?? true}
            onChange={(event) =>
              onChange({
                ...settings,
                emails: { ...settings.emails, enableCustomerEmails: event.target.checked },
              })
            }
          />
          Enable customer emails
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.emails.enableOwnerEmails ?? true}
            onChange={(event) =>
              onChange({
                ...settings,
                emails: { ...settings.emails, enableOwnerEmails: event.target.checked },
              })
            }
          />
          Enable owner notification emails
        </label>
      </div>
    );
  }

  if (section === "notifications") {
    return (
      <div className="space-y-3">
        <Text size="sm" className="text-muted-foreground">
          Notification preferences architecture is prepared. Delivery channels will be implemented
          in later milestones.
        </Text>
      </div>
    );
  }

  if (section === "social") {
    const links = settings.contact.socialMediaLinks;
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Instagram" value={links.instagram ?? ""} onChange={(value) =>
          onChange({ ...settings, contact: { ...settings.contact, socialMediaLinks: { ...links, instagram: value || null } } })
        } />
        <Field label="Facebook" value={links.facebook ?? ""} onChange={(value) =>
          onChange({ ...settings, contact: { ...settings.contact, socialMediaLinks: { ...links, facebook: value || null } } })
        } />
        <Field label="YouTube" value={links.youtube ?? ""} onChange={(value) =>
          onChange({ ...settings, contact: { ...settings.contact, socialMediaLinks: { ...links, youtube: value || null } } })
        } />
        <Field label="X / Twitter" value={links.twitter ?? ""} onChange={(value) =>
          onChange({ ...settings, contact: { ...settings.contact, socialMediaLinks: { ...links, twitter: value || null } } })
        } />
        <Field
          label="Website"
          value={settings.contact.websiteUrl ?? ""}
          onChange={(value) =>
            onChange({ ...settings, contact: { ...settings.contact, websiteUrl: value || null } })
          }
        />
      </div>
    );
  }

  if (section === "seo") {
    return (
      <div className="space-y-4">
        <Field
          label="Meta Title"
          value={settings.content.seo.metaTitle ?? ""}
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                seo: { ...settings.content.seo, metaTitle: value || null },
              },
            })
          }
        />
        <Field
          label="Meta Description"
          value={settings.content.seo.metaDescription ?? ""}
          multiline
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                seo: { ...settings.content.seo, metaDescription: value || null },
              },
            })
          }
        />
        <Field
          label="Canonical URL"
          value={settings.content.seo.canonicalUrl ?? ""}
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                seo: { ...settings.content.seo, canonicalUrl: value || null },
              },
            })
          }
        />
      </div>
    );
  }

  if (section === "legal") {
    return (
      <div className="space-y-4">
        <Field
          label="Privacy Policy"
          value={settings.content.legal.privacyPolicy ?? ""}
          multiline
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                legal: { ...settings.content.legal, privacyPolicy: value || null },
              },
            })
          }
        />
        <Field
          label="Terms & Conditions"
          value={settings.content.legal.terms ?? ""}
          multiline
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                legal: { ...settings.content.legal, terms: value || null },
              },
            })
          }
        />
        <Field
          label="Cancellation Policy"
          value={settings.content.legal.cancellationPolicy ?? ""}
          multiline
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                legal: { ...settings.content.legal, cancellationPolicy: value || null },
              },
            })
          }
        />
        <Field
          label="Refund Policy"
          value={settings.content.legal.refundPolicy ?? ""}
          multiline
          onChange={(value) =>
            onChange({
              ...settings,
              content: {
                ...settings.content,
                legal: { ...settings.content.legal, refundPolicy: value || null },
              },
            })
          }
        />
      </div>
    );
  }

  if (section === "advanced") {
    return (
      <div className="space-y-4">
        <div className="border-border/70 rounded-[var(--radius-md)] border p-4">
          <Text className="font-medium">Maintenance Mode</Text>
          <Text size="sm" className="text-muted-foreground mt-1">
            When enabled, the public site can show a maintenance banner (future).
          </Text>
          <div className="mt-3 flex items-center gap-3">
            <select
              value={String(settings.operations.maintenanceMode ?? false)}
              onChange={(event) =>
                onChange({
                  ...settings,
                  operations: {
                    ...settings.operations,
                    maintenanceMode: event.target.value === "true",
                  },
                })
              }
              className="border-input bg-background h-10 rounded-[var(--radius-md)] border px-3 text-sm"
            >
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
            <Badge variant={settings.operations.maintenanceMode ? "destructive" : "secondary"}>
              {settings.operations.maintenanceMode ? "Maintenance ON" : "Live"}
            </Badge>
          </div>
          <div className="mt-3">
            <Field
              label="Maintenance Message"
              value={settings.operations.maintenanceMessage ?? ""}
              multiline
              onChange={(value) =>
                onChange({
                  ...settings,
                  operations: {
                    ...settings.operations,
                    maintenanceMessage: value || null,
                  },
                })
              }
            />
          </div>
        </div>

        <Text size="sm" className="text-muted-foreground">
          Additional advanced toggles (registration, booking, payments) are prepared for future rollout.
        </Text>
      </div>
    );
  }

  return (
    <Text size="sm" className="text-muted-foreground">
      This section is not configured yet.
    </Text>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <Text size="sm" className="text-muted-foreground">
        {label}
      </Text>
      {multiline ? (
        <Textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-1" />
      ) : (
        <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1" />
      )}
    </div>
  );
}

