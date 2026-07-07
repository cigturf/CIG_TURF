import { LandingPage } from "@/components/landing";
import { SettingsService } from "@/server/settings";

export default async function HomePage() {
  const initialBusinessSettings = await SettingsService.getPublic();

  return <LandingPage initialBusinessSettings={initialBusinessSettings} />;
}
