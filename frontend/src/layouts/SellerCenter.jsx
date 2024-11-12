import { SellerSidebar } from "@/components/seller-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Outlet } from "react-router-dom"


const SellerCenter = () => {
    return (
        <>
        <SidebarProvider>
            <div>
                <SellerSidebar />
            </div>
            <section id="seller-center-layout rbac-23c789">
                <SidebarTrigger />
                <Outlet />
            </section>
        </SidebarProvider>
        </>
    )
}

export default SellerCenter