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
            title: "All Products",
            url: "/admin/products",
          },
          {
            title: "Product Categories",
            url: "/admin/products/categories",
          },
          {
            title: "Product Reviews",
            url: "/admin/products/reviews",
          }
        ],
      },
      {
        title: "Seller Management",
        url: "#",
        icon: UserRound,
        items: [
          {
            title: "All Sellers",
            url: "/admin/sellers",
          },
          {
            title: "Pending Approvals",
            url: "/admin/sellers/pending",
          },
          {
            title: "Seller Verification",
            url: "/admin/sellers/verification",
          },
          {
            title: "Shop Management",
            url: "/admin/shops",
          }
        ],
      },
      {
        title: "Orders & Payments",
        url: "#",
        icon: ShoppingBag,
        items: [
          {
            title: "All Orders",
            url: "/admin/orders",
          },
          {
            title: "Pending Orders",
            url: "/admin/orders/pending",
          },
          {
            title: "Payment Transactions",
            url: "/admin/payments",
          },
          {
            title: "Seller Payouts",
            url: "/admin/payments/payouts",
          }
        ],
      },
      {
        title: "User Management",
        url: "#",
        icon: UserRound,
        items: [
          {
            title: "All Users",
            url: "/admin/users",
          },
          {
            title: "User Roles",
            url: "/admin/users/roles",
          },
          {
            title: "User Analytics",
            url: "/admin/users/analytics",
          }
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "General Settings",
            url: "/admin/settings",
          },
          {
            title: "Platform Settings",
            url: "/admin/settings/platform",
          },
          {
            title: "Security Settings",
            url: "/admin/settings/security",
          }
        ],
      },
    ],
    projects: [
      {
        name: "Analytics",
        url: "/admin/analytics",
        icon: PieChart,
      },
      {
        name: "Reports",
        url: "/admin/reports",
        icon: Frame,
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
