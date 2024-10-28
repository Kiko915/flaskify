import { ArrowLeft } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

const NotFound = () => {
    const location = useLocation();

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h2 className="text-2xl font-bold">404 - Not Found</h2>
            <p>The page on <code>{location.pathname}</code> you are looking for does not exist.</p>
            <NavLink to="/" className="bg-yellow-500 px-4 py-2 rounded inline-flex items-center text-sm gap-1 hover:bg-yellow-600 my-4"><span><ArrowLeft className="w-6" /></span>Back to Home</NavLink>
        </div>
    )
}

export default NotFound;