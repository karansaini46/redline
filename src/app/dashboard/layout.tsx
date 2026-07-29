import { Sidebar } from "@/components/global/Sidebar";
import { TopNavbar } from "@/components/global/TopNavbar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await auth();
  } catch (e) {
    console.error("Auth error in dashboard layout:", e);
    redirect("/api/auth/signin");
  }
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const membership = await prisma.membership.findFirst({
    where: { user_id: session.user.id },
    include: { organization: true },
  });
  const orgName = membership?.organization?.name || "No Organization";

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50">
        <Sidebar orgName={orgName} />
      </div>

      <div className="flex flex-1 flex-col md:pl-64 w-full min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center gap-4 border-b border-border/40 bg-background px-4 z-40 sticky top-0">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="shrink-0" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r-0">
              <Sidebar orgName={orgName} />
            </SheetContent>
          </Sheet>
          <div className="font-semibold text-sm tracking-tight text-foreground flex-1">
            <Link href="/dashboard">Redline</Link>
          </div>
        </header>

        {/* Desktop Header */}
        <div className="hidden md:block">
          <TopNavbar user={session.user} />
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
