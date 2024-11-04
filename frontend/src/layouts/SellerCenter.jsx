import { Outlet } from "react-router-dom"


const SellerCenter = () => {
    return (
        <>
        <div>
            <h1>Seller Center</h1>
        </div>
        <section id="seller-center-layout rbac-23c789">
            <Outlet />
        </section>
        </>
    )
}

export default SellerCenter