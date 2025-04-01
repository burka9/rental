"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BuildingIcon, HouseIcon, LucideUsers, MilestoneIcon, UserIcon, BellIcon, ChartBarIcon, DollarSign } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const links = [
  {
    href: '/dashboard/buildings',
    title: 'Buildings',
    icon: <BuildingIcon />,
    selector: 'buildings',
    showOnDashboard: true
  },
  {
    href: '/dashboard/rooms',
    title: 'Rooms',
    icon: <HouseIcon />,
    selector: 'rooms',
    showOnDashboard: true
  },
  {
    href: '/dashboard/tenants',
    title: 'Tenants',
    icon: <LucideUsers />,
    selector: 'tenants',
    showOnDashboard: true
  },
  {
    href: '/dashboard/payments',
    title: 'Payments',
    icon: <DollarSign />,
    selector: 'payments',
    showOnDashboard: false
  },
  {
    href: '/dashboard/banks',
    title: 'Banks',
    icon: <MilestoneIcon />,
    selector: 'banks',
    showOnDashboard: true
  },
  {
    href: '/dashboard/notification',
    title: 'Notification',
    icon: <BellIcon />,
    selector: 'notification',
    showOnDashboard: false
  },
  {
    href: '/dashboard/report',
    title: 'Report',
    icon: <ChartBarIcon />,
    selector: 'report',
    showOnDashboard: false
  },
  {
    href: '/dashboard/users',
    title: 'Users',
    icon: <UserIcon />,
    selector: 'users',
    showOnDashboard: true
  },
]

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="p-8 bg-white px-0">
      <SidebarHeader className="bg-white">
        <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
          Dashboard
        </h2>
      </SidebarHeader>
      <SidebarContent className="bg-white px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      // pathname doesnt match any of the links
                      !links.some(link => pathname.startsWith(link.href))
                    }
                    className="data-[active=true]:font-bold"
                  >
                    <Link
                      href={'/dashboard'}
                      className="flex gap-4 items-center my-1 p-2 h-[40px] text-gray-900/65
		                    data-[active=true]:bg-[#000000] data-[active=true]:text-white"
                    >
                      {<HouseIcon />}
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              {/* Sidebar menu items */}
              {links.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton asChild isActive={pathname.includes(item.href)} className="data-[active=true]:font-bold">
                    <Link
                      href={item.href}
                      className="flex gap-4 items-center my-1 p-2 h-[40px] text-gray-900/50
		                    data-[active=true]:bg-[#000000] data-[active=true]:text-white"
                    >
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter></SidebarFooter>
    </Sidebar>
  );
}