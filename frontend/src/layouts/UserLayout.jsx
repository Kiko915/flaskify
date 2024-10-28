import { Outlet } from "react-router-dom";
import UserSidebar from "../components/user/UserSidebar";

const UserLayout = () => {
    return (
        <div id="user-shell" className="flex p-8 gap-4">
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