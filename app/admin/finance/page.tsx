import { redirect } from "next/navigation";

// Finance was merged into the "Reports & Finances" page — keep this route
// alive (bookmarks, old links) and send it to the new combined view.
export default function AdminFinancePage() {
  redirect("/admin/reports");
}
