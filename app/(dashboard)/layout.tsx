import { Sidebar } from "@/components/layout/Sidebar";
import { UserNav } from "@/components/layout/UserNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <header className="h-16 border-b bg-white flex items-center justify-end px-6">
          <UserNav />
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 