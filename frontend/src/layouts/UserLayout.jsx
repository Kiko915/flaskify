import { Outlet } from "react-router-dom";
import UserSidebar from "../components/user/UserSidebar";
import { Helmet } from "react-helmet-async";

const UserLayout = () => {
    return (
        <div id="user-shell" className="flex p-8 gap-4">
            <Helmet>
                <title>Flaskify | User Dashboard</title>
            </Helmet>
            <div >
                <UserSidebar />
            </div>
            <div className="flex-1 bg-slate-50 p-8 shadow">
                <Outlet />
            </div>
        </div>
    )
}

export default UserLayout;