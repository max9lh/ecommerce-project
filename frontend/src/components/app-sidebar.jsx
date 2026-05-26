import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Building2,
  Command,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  LineChart,
  Map,
  PieChart,
  ReceiptText,
  Settings2,
  SquareTerminal,
  Wallet,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"

// Helper temporal para decodificar el token sin librerías externas
function hasPermission(permissionName) {
  const token = localStorage.getItem("token");
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'ADMIN') return true;
    return payload.permissions?.[permissionName] === true;
  } catch(e) {
    return false;
  }
}

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  company: {
    name: "Acme Inc",
    logo: GalleryVerticalEnd,
    plan: "Enterprise",
  },
  navMain: [
    {
      title: "Panel Principal",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Cierres de Caja",
      url: "/cierres",
      icon: Wallet,
    },
    {
      title: "Proveedores",
      url: "/proveedores",
      icon: Building2,
    },
    {
      title: "Egresos",
      url: "/egresos",
      icon: ReceiptText,
    },
    {
      title: "Reportes",
      url: "/reportes",
      icon: LineChart,
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({
  ...props
}) {
  
  // Filtramos la barra lateral según los permisos
  const filteredNavMain = data.navMain.filter((item) => {
    if (item.title === "Proveedores" && !hasPermission('canManageProviders')) return false;
    // Si necesitás ocultar "Egresos", podrías agregar acá:
    // if (item.title === "Egresos" && !hasPermission('canRegisterExpenses')) return false;
    return true;
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent cursor-default">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <data.company.logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{data.company.name}</span>
                <span className="truncate text-xs">{data.company.plan}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
