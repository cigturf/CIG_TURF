import { AppProviders } from "@/components/providers";
import { SettingsService } from "@/server/settings";
import { fontVariables } from "@/lib/fonts";
import { buildRootMetadata, buildRootViewport } from "@/lib/pwa/metadata";

import "./globals.css";

export async function generateMetadata() {
  return buildRootMetadata();
}

export const viewport = buildRootViewport();

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialBusinessSettings = await SettingsService.getPublic();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontVariables} min-h-screen font-sans antialiased`}>
        <AppProviders initialBusinessSettings={initialBusinessSettings}>{children}</AppProviders>
      </body>
    </html>
  );
}
