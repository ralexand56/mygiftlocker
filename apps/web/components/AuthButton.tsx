"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut, useUser } from "@/lib/auth";

const pill = "rounded-full bg-white/80 px-4 py-2 text-ink shadow-soft hover:bg-white";

/** "Sign in" when signed out; the user's first name and "Sign out" when signed in. */
export function AuthButton() {
  const user = useUser();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!user)
    return (
      <Link href="/sign-in" className={pill}>
        Sign in
      </Link>
    );

  return (
    <span className="flex items-center gap-1">
      <span className="hidden max-w-[12rem] truncate px-2 text-ink md:block" title={user.email}>
        {user.name.split(" ")[0]}
      </span>
      <button
        type="button"
        disabled={busy}
        className={`${pill} disabled:opacity-50`}
        onClick={async () => {
          setBusy(true);
          try {
            await signOut();
          } finally {
            setBusy(false);
            router.push("/");
            router.refresh();
          }
        }}
      >
        Sign out
      </button>
    </span>
  );
}
