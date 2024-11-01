import { Outlet } from "react-router-dom"

const SellerLayout = () => {
    return (
        <div id="flaskify_seller_rbac" >
            <Outlet />
        </div>
    )
}

export default SellerLayout;