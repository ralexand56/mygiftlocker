"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authMode, useUser } from "@/lib/auth";

/** Signed-in visitors skip the marketing page and land in their locker. */
export function SignedInRedirect({ to = "/locker" }: { to?: string }) {
  const user = useUser();
  const router = useRouter();
  useEffect(() => {
    if (authMode === "amplify" && user) router.replace(to);
  }, [user, router, to]);
  return null;
}
