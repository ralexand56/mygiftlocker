"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button, inputCls } from "@/components/ui";
import { authMode, saveDisplayName, useUser } from "@/lib/auth";

const DISMISS_KEY = "mgl:name-prompt-dismissed";

/**
 * Email-code sign-in only gives us an address, so ask once for a name.
 * "Later" hides it for this browser session.
 */
export function NamePrompt() {
  const user = useUser();
  const [name, setName] = useState("");
  const [dismissed, setDismissed] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const show = authMode === "amplify" && !!user && !user.hasName && !dismissed;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode: just hide for this page */
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveDisplayName(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.form
          key="name-prompt"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          onSubmit={save}
          className="glass mx-auto mb-6 flex max-w-6xl flex-wrap items-center gap-3 rounded-[24px] px-5 py-4 shadow-soft"
        >
          <p className="font-bold text-ink">What should we call you?</p>
          <input
            className={`${inputCls} min-w-0 flex-1 basis-48`}
            placeholder="Your first name"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            aria-label="Your name"
          />
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <button type="button" onClick={dismiss} className="text-sm font-bold text-ink-soft hover:text-ink">
            Later
          </button>
          {error && <p className="w-full text-sm font-bold text-rose-deep">{error}</p>}
        </motion.form>
      )}
    </AnimatePresence>
  );
}
