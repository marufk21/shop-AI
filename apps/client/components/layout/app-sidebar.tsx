"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import {
  House,
  SquaresFour,
  Package,
  ChatCircle,
  Files,
  ChartBar,
  Storefront,
  Gear,
} from "@phosphor-icons/react"

const adminGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: House },
      { title: "Analytics", url: "/admin/analytics", icon: ChartBar },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Products", url: "/admin/products", icon: SquaresFour },
      { title: "Orders", url: "/admin/orders", icon: Package },
      { title: "Documents", url: "/admin/documents", icon: Files },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { title: "Chatbot", url: "/admin/chatbot", icon: ChatCircle },
    ],
  },
]

const footerItems = [
  { title: "Storefront", url: "/store", icon: Storefront },
  { title: "Settings", url: "/admin/settings", icon: Gear },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link href="/admin">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0 overflow-hidden">
                    <Image src="/logo.png" alt="ShopAI" width={28} height={28} className="size-7 object-cover" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden group-data-[collapsible=icon]:hidden">
                    <span className="font-heading font-semibold truncate">ShopAI</span>
                    <span className="text-xs text-muted-foreground truncate">Admin</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {adminGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      render={
                        <Link href={item.url}>
                          <item.icon className="size-4 shrink-0" />
                          <span className="truncate group-data-[collapsible=icon]:hidden">
                            {item.title}
                          </span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.url}
                tooltip={item.title}
                render={
                  <Link href={item.url}>
                    <item.icon className="size-4 shrink-0" />
                    <span className="truncate group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </Link>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
