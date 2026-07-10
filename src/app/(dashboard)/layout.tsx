export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/10">
      <header className="flex h-14 items-center gap-4 border-b bg-white px-6 lg:h-[60px] shadow-sm">
        <div className="font-semibold text-xl tracking-tight text-primary">
          Redline
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
