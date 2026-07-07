import { Suspense } from "react";

import { AuthPage } from "@/features/auth/components";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="surface-public min-h-screen">
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="border-primary size-8 animate-spin rounded-full border-2 border-t-transparent" />
          </div>
        }
      >
        <AuthPage />
      </Suspense>
    </div>
  );
}
