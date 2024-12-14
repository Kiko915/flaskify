import {
  BookOpen,
  Bot,
  Cog,
  Frame,
  HandCoins,
  LayoutDashboard,
  Map,
  MessageSquare,
  PieChart,
  Settings2,
  ShoppingBag,
  ShoppingBasket,
  SquarePercent,
  SquareTerminal,
  Store,
  Tags,
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
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import { useLocation } from "react-router-dom"

const sellerLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/seller/seller-center",
    variant: "ghost",
  },
  {
    title: "Products",
    icon: Package,
    href: "/seller/seller-center/products",
    variant: "ghost",
    children: [
      {
        title: "Listings",
        href: "/seller/seller-center/products/listings",
      },
      {
        title: "Manage Products",
        href: "/seller/seller-center/products/manage",
      },
    ],
  },
  {
    title: "Shop",
    icon: Store,
    href: "/seller/seller-center/shop",
    variant: "ghost",
    children: [
      {
        title: "Shop Information",
        href: "/seller/seller-center/shop/info",
      },
    ],
  },
  {
    title: "Marketing",
    icon: SquarePercent,
    href: "/seller/seller-center/marketing",
    variant: "ghost",
    children: [
      {
        title: "Discounts",
        href: "/seller/seller-center/marketing/discounts",
      },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    href: "/seller/seller-center/orders",
    variant: "ghost",
  },
  {
    title: "Settings",
    icon: Settings2,
    href: "/seller/seller-center/settings",
    variant: "ghost",
  },
]

export function SellerSidebar({
  ...props
}) {
  const { user } = useAuth()
  const { state, open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

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
        title: "Orders",
        url: "/seller/seller-center/orders",
        icon: ShoppingBasket,
        items: [
          {
            title: "My Orders",
            url: "/seller/seller-center/orders",
          },
          {
            title: "Cancellation Requests",
            url: "/seller/seller-center/orders/cancellations",
          },
          
        ],
      },
      {
        title: "Products",
        url: "#",
        icon: ShoppingBag,
        items: [
          {
            title: "Product Listings",
            url: "/seller/seller-center/products/listings",
          },
          {
            title: "Archived Products",
            url: "/seller/seller-center/products/archived",
          },
          {
            title: "Inventory Management",
            url: "/seller/seller-center/products/inventory",
          },
          {
            title: "Product Reviews",
            url: "/seller/seller-center/products/reviews",
          },
        ],
      },
      {
        title: "Shop Management",
        url: "#",
        icon: Store,
        items: [
          {
            title: "Shop Information",
            url: "/seller/seller-center/shop/info",
          },
        ],
      },
      {
        title: "Marketing Center",
        url: "#",
        icon: SquarePercent,
        items: [
          {
            title: "Discounts",
            url: "/seller/seller-center/marketing/discounts",
          },
        ],
      },
      {
        title: "Finance",
        url: "#",
        icon: HandCoins,
        items: [
          {
            title: "My Income",
            url: "/seller/seller-center/finance/income",
          },
          {
            title: "Bank Accounts",
            url: "/seller/seller-center/finance/bank-accounts",
          }
        ],
      },
      {
        title: "Customer Service",
        url: "#",
        icon: MessageSquare,
        items: [
          {
            title: "Chat Management",
            url: "/seller/seller-center/chat",
          }
        ],
      },
    ],
    projects: [
      {
        name: "Settings",
        url: "#",
        icon: Cog,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
    ],
  }

  return (
    (<Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link to="/">
          <div className={`flex items-center gap-2 ${state === "expanded" && 'p-2 bg-yellow-500'} rounded`}>
            <img src="/assets/flaskify-primary.png" alt="Flaskify Logo" className="w-10" />
            {state === "expanded" && <h3 className="font-bold text-white" >Seller Center</h3>}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard Overview">
              <Link to="/seller/seller-center/" className={`text-sm flex items-center gap-1 my-2 hover:bg-gray-100 rounded p-2 ${!open && "mx-2"}`}>
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