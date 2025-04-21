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
import { BuildingIcon, HouseIcon, LucideUsers, MilestoneIcon, UserIcon, BellIcon, ChartBarIcon, DollarSign, LogOutIcon, Signature } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const links = [
  {
    href: "/dashboard/buildings",
    title: "Buildings",
    icon: <BuildingIcon />,
    selector: "buildings",
    showOnDashboard: true,
  },
  {
    href: "/dashboard/rooms",
    title: "Rooms",
    icon: <HouseIcon />,
    selector: "rooms",
    showOnDashboard: true,
  },
  {
    href: "/dashboard/tenants",
    title: "Tenants",
    icon: <LucideUsers />,
    selector: "tenants",
    showOnDashboard: true,
  },
  {
    href: "/dashboard/leases",
    title: "Leases",
    icon: <Signature />,
    selector: "leases",
    showOnDashboard: true,
  },
  {
    href: "/dashboard/payments",
    title: "Payments",
    icon: <DollarSign />,
    selector: "payments",
    showOnDashboard: false,
  },
  {
    href: "/dashboard/banks",
    title: "Banks",
    icon: <MilestoneIcon />,
    selector: "banks",
    showOnDashboard: true,
  },
  {
    href: "/dashboard/notification",
    title: "Notification",
    icon: <BellIcon />,
    selector: "notification",
    showOnDashboard: false,
  },
  {
    href: "/dashboard/report",
    title: "Report",
    icon: <ChartBarIcon />,
    selector: "report",
    showOnDashboard: false,
  },
  {
    href: "/dashboard/users",
    title: "Users",
    icon: <UserIcon />,
    selector: "users",
    showOnDashboard: true,
  },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="pt-12 bg-slate-800 text-white px-0">
      <SidebarHeader className="bg-slate-800 text-white">
        <h2 className="text-2xl font-semibold text-center text-white mb-4">
          Dashboard
        </h2>
      </SidebarHeader>
      <SidebarContent className="bg-slate-800 text-white px-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Home Link */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/home"}
                  className="data-[active=true]:font-bold data-[active=true]:bg-[#ffffff] data-[active=true]:text-black"
                >
                  <Link
                    href="/dashboard"
                    className="flex gap-4 items-center my-1 p-2 h-[40px] text-white/65 hover:bg-gray-100 px-4"
                  >
                    <HouseIcon />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Other Links */}
              {links.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === item.href || pathname.startsWith(item.href + "/")
                    }
                    className="data-[active=true]:font-bold data-[active=true]:bg-[#ffffff] data-[active=true]:text-black"
                  >
                    <Link
                      href={item.href}
                      className="flex gap-4 items-center my-1 p-2 h-[40px] text-white/65 hover:bg-gray-100 px-4"
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
      <SidebarFooter className="bg-slate-800 text-white">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[active=true]:font-bold data-[active=true]:bg-[#ffffff] data-[active=true]:text-black"
            >
              <Link
                href="/"
                className="flex gap-4 items-center justify-center my-1 p-2 h-[40px] text-white/65 hover:bg-gray-100 px-4"
              >
                <span>Logout</span>
                <LogOutIcon />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}