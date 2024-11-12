import {
    BookOpen,
    Bot,
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
  
  
  export function SellerSidebar({
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
          title: "Orders",
          url: "#",
          icon: ShoppingBasket,
          items: [
            {
              title: "My Orders",
              url: "#",
            },
            {
              title: "Cancellation Requests",
              url: "#",
            },
            {
              title: "Returns/Refunds",
              url: "#",
            },
            {
              title: "Shipping & Delivery",
              url: "#",
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
              url: "#",
            },
            {
              title: "Archived Products",
              url: "#",
            },
            {
              title: "Inventory Management",
              url: "#",
            },
            {
              title: "Product Reviews",
              url: "#",
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
              url: "/admin/sellers",
            },
            {
              title: "Shop Decorations",
              url: "/admin/sellers/verification",
            },
            {
              title: "Shop Settings",
              url: "#",
            }
          ],
        },
        {
          title: "Marketing Center",
          url: "#",
          icon: SquarePercent,
          items: [
            {
              title: "Discounts",
              url: "#",
            },
            {
              title: "Vouchers",
              url: "#",
            },
            {
              title: "ADS",
              url: "#",
            }
          ],
        },
        {
          title: "Finance",
          url: "#",
          icon: HandCoins,
          items: [
            {
              title: "My Income",
              url: "#",
            },
            {
              title: "My Balance",
              url: "#",
            },
            {
              title: "Bank Accounts",
              url: "#",
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
              url: "#",
            }
          ],
        },
      ],
      projects: [
        {
          name: "Design Engineering",
          url: "#",
          icon: Frame,
        },
        {
          name: "Sales & Marketing",
          url: "#",
          icon: PieChart,
        },
        {
          name: "Travel",
          url: "#",
          icon: Map,
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
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>)
    );
  }
  