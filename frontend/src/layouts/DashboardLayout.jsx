import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/AuthContext"
import { EmployeeCheckInForm } from "@/components/attendance/EmployeeCheckInForm"
import { Loader2 } from "lucide-react"

export function DashboardLayout({ children }) {
  const { isEmployee, attendanceStatus, attendanceLoading } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <span className="font-semibold text-sm text-muted-foreground">Panel de Control</span>
          </div>
          <ModeToggle />
        </header>
        
        {/* Aquí adentro se inyectarán las pantallas (Dashboard, Cierres, etc.) */}
        <div className="flex flex-1 flex-col gap-4 p-6 bg-background">
          {attendanceLoading ? (
            <div className="flex flex-1 items-center justify-center min-h-[50vh]">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : isEmployee && !attendanceStatus?.hasActiveSession ? (
            <EmployeeCheckInForm />
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
