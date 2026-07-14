import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./_components/settings-client";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Settings",
  description:
    "Configure your workspace, members, and organizational defaults.",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await prisma.membership.findFirst({
    where: { user_id: session.user.id },
    include: { organization: true, user: true },
  });

  if (!membership) {
    return <div>No organization found</div>;
  }

  return (
    <SettingsClient
      initialOrgName={membership.organization.name || "Redline HQ"}
      initialUserName={membership.user.name || "User"}
      initialUserEmail={membership.user.email || "user@example.com"}
      orgId={membership.org_id}
    />
  );
}
