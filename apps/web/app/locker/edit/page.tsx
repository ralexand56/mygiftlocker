import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { EditPerson } from "./EditPerson";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("editPerson") };
}

export default function EditPersonPage() {
  return (
    <Suspense>
      <EditPerson />
    </Suspense>
  );
}
