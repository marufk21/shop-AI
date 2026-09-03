import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { AdminGuard } from "@/components/auth/admin-guard"
import { SidebarInset } from "@workspace/ui/components/sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminGuard>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main id="main-content" className="flex flex-1 flex-col gap-6 p-6 min-w-0">
          {children}
        </main>
      </SidebarInset>
    </AdminGuard>
  )
}
