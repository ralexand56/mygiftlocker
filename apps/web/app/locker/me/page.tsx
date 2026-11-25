import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { MyProfile } from "./MyProfile";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("titles"))("myProfile") };
}

export default function MyProfilePage() {
  return <MyProfile />;
}
