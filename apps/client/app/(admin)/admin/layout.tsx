import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import { fetchServerAuthUser } from "@/server/auth-fetchers"
import { SidebarInset } from "@workspace/ui/components/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await fetchServerAuthUser()
  if (!user || user.role !== "admin") {
    redirect("/store")
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <main id="main-content" className="flex flex-1 flex-col gap-6 p-6 min-w-0">{children}</main>
      </SidebarInset>
    </>
  )
}
