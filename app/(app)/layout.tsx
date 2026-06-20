import { AuthGuard } from "@/components/auth-guard";
import { Sidebar } from "@/components/sidebar";
import { VaultProvider } from "@/components/vault-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <VaultProvider>
        <div className="flex min-h-screen flex-1">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">{children}</div>
          </main>
        </div>
      </VaultProvider>
    </AuthGuard>
  );
}
