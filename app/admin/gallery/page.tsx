import { AdminPlaceholderPage } from "@/features/admin/components/pages/admin-placeholder-page";

export const metadata = { title: "Gallery" };

export default function AdminGalleryPage() {
  return (
    <AdminPlaceholderPage
      title="Gallery"
      description="Upload and organize photos and videos for the public website."
    />
  );
}
