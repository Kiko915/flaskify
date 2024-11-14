import {
  BookOpen,
  Bot,
  Frame,
  LayoutDashboard,
  Map,
  PieChart,
  Settings2,
  ShoppingBag,
  SquareTerminal,
  UserRound,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/utils/AuthContext"
import { Link } from "react-router-dom"


export function AppSidebar({
  ...props
}) {
  const { user } = useAuth()
  const { state, open } = useSidebar()

  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : "";
    const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : "";
    return `${firstInitial}${lastInitial}`;
  };
  

  const data = {
    user: {
      name: user?.username,
      email: user?.email,
      avatar: user?.profile_image_url,
      initials: getInitials(user?.first_name, user?.last_name),
      role: user?.role,
    },
    navMain: [
      {
        title: "Products",
        url: "#",
        icon: ShoppingBag,
        items: [
          {
            title: "History",
            url: "#",
          },
          {
            title: "Starred",
            url: "#",
          },
          {
            title: "Settings",
            url: "#",
          },
        ],
      },
      {
        title: "Seller",
        url: "#",
        icon: UserRound,
        items: [
          {
            title: "Seller Management",
            url: "/admin/sellers",
          },
          {
            title: "Seller Verification",
            url: "/admin/sellers/verification",
          },
          {
            title: "Seller Payouts",
            url: "#",
          },
          {
            title: "Seller Analytics",
            url: "#",
          }
        ],
      },
      {
        title: "Documentation",
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: "Introduction",
            url: "#",
          },
          {
            title: "Get Started",
            url: "#",
          },
          {
            title: "Tutorials",
            url: "#",
          },
          {
            title: "Changelog",
            url: "#",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Settings",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      }
    ],
  }

  return (
    (<Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link to="/">
        <div className={`flex items-center gap-2 ${state === "expanded" && 'p-2 bg-yellow-500'} rounded`}>
          <img src="/assets/flaskify-primary.png" alt="Flaskify Logo" className="w-10" />
          {state === "expanded" && <h3 className="font-bold text-white" >Admin Dashboard</h3>}
        </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Dashboard Overview">
          <Link to="/admin/dashboard" className={`text-sm flex items-center gap-1 my-2 hover:bg-gray-100 rounded p-2 ${!open && "mx-2"}`}>
            <LayoutDashboard /> <span>Dashboard Overview</span>
          </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>)
  );
}
