import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"


const AdminLayout = () => {
    return (
        <SidebarProvider>
            <AppSidebar />
            <div>
                <SidebarTrigger />
                <div>
                    
                </div>
                <div id="flaskify_admin_content" className="p-4">
                    <Outlet />
                </div>
            </div>
        </SidebarProvider>
    )
}

export default AdminLayout