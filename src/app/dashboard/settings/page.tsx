import { prisma } from "@/lib/prisma";
import { SettingsClient } from "./_components/settings-client";

export default async function SettingsPage() {
  const org = await prisma.organization.findFirst();
  
  // Try to find the first owner or admin user to populate the default profile
  // In a real app, this would use the currently authenticated user's session
  const user = await prisma.user.findFirst({
    where: {
      memberships: {
        some: {
          org_id: org?.id,
          role: { in: ['OWNER', 'ADMIN'] }
        }
      }
    }
  });

  return (
    <SettingsClient 
      initialOrgName={org?.name || "Redline HQ"}
      initialUserName={user?.name || "Karan Saini"}
      initialUserEmail={user?.email || "karan@redline.com"}
    />
  );
}
