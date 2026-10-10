import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientProfilePanel } from "@/components/client/ClientProfilePanel";
import { getClientProfile } from "@/data/client/get-client-profile.server";
import { getMessages } from "@/lib/messages/server";


export async function generateMetadata(): Promise<Metadata> {
  const messages = await getMessages();
  return {
    title: messages.profile.client.metaTitle,
  };
}

export default async function ClientProfilePage() {
    const profile = await getClientProfile();

  if (!profile) {
    notFound();
  }

  return <ClientProfilePanel profile={profile} />;
}
