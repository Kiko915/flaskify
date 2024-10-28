import { Outlet } from "react-router-dom";
import PlainHeader from "../components/PlainHeader";

const AuthLayout = () => {
    return (
        <div className='auth_layout'>
            <PlainHeader />
            <div className='auth_layout_container'>
                <Outlet />
            </div>
        </div>
    )
}

export default AuthLayout;