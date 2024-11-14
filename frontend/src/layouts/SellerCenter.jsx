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
            <section id="seller-center-layout rbac-23c789" className="w-full bg-gray-50">
                <SidebarTrigger />
                <div className="seller-center-outlet container p-8">
                    <Outlet />
                </div>
            </section>
        </SidebarProvider>
        </>
    )
}

export default SellerCenter