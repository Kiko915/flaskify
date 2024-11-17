import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "@/components/ui/tooltip"
import { Outlet } from "react-router-dom"


const AdminLayout = () => {
    return (
        <SidebarProvider>
            <div className="flex mx-auto">
                <AppSidebar />
                <div className="flex-1 flex flex-col">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarTrigger />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle Sidebar</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <main className="flex-1 overflow-y-auto">
                        <div className="container mx-auto px-4 py-6 max-w-[1400px]">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    )
}

export default AdminLayout