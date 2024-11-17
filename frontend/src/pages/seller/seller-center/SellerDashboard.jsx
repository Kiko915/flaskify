import GreetingTab from "@/components/misc/GreetingTab"
import NewSellerGuide from "@/components/seller/NewSellerActions";
import { useAuth } from "@/utils/AuthContext"
import { DollarSign, Package, ShoppingCart, Users, Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { createSwapy } from "swapy";

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend && (
        <span className={`text-sm ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-gray-600 text-sm mb-1">{title}</p>
    <h3 className="text-2xl font-semibold">{value}</h3>
  </div>
);

const RevenueChart = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
  </div>
);

const SalesChart = () => {
  const data = [
    { name: 'Products', value: 65 },
    { name: 'Services', value: 35 }
  ];
  const COLORS = ['#6366F1', '#E0E7FF'];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Sales Distribution</h3>
    </div>
  );
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(() => {
    const savedLockState = localStorage.getItem('dashboardLocked');
    return savedLockState ? JSON.parse(savedLockState) : false;
  });
  const [swapyInstance, setSwapyInstance] = useState(null);

  // Default layout configuration
  const DEFAULT_LAYOUT = {
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6'
  };

  // Get saved layout or use default
  const [layout, setLayout] = useState(() => {
    const savedLayout = localStorage.getItem('dashboardLayout');
    console.log('Saved layout:', savedLayout);
    return savedLayout ? JSON.parse(savedLayout) : DEFAULT_LAYOUT;
  });

  useEffect(() => {
    const container = document.querySelector('#container');
    if (!container) {
      console.error('Container not found');
      return;
    }

    const swapy = createSwapy(container, {
      swapMode: 'hover'
    });
    setSwapyInstance(swapy);

    swapy.enable(!isLocked);

    swapy.onSwap(({ data }) => {
      console.log('Swap event triggered');
      console.log('Previous layout:', layout);
      console.log('Swap data:', data);
      const newLayout = data.object;
      console.log('New layout:', newLayout);
      setLayout(newLayout);
      localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
    });

    return () => {
      swapy.destroy();
    }
  }, [isLocked]);

  // Helper function to render the correct component based on item ID
  const getItemById = (itemId) => {
    console.log('Getting item for ID:', itemId);
    switch (itemId) {
      case '1':
        return (
          <div data-swapy-item="1">
            <StatCard 
              title="Total Revenue" 
              value="$34,545" 
              icon={DollarSign}
              trend={12.5}
              color="bg-indigo-500"
            />
          </div>
        );
      case '2':
        return (
          <div data-swapy-item="2">
            <StatCard 
              title="Total Orders" 
              value="456" 
              icon={ShoppingCart}
              trend={8.2}
              color="bg-blue-500"
            />
          </div>
        );
      case '3':
        return (
          <div data-swapy-item="3">
            <StatCard 
              title="Total Products" 
              value="89" 
              icon={Package}
              trend={-2.4}
              color="bg-green-500"
            />
          </div>
        );
      case '4':
        return (
          <div data-swapy-item="4">
            <StatCard 
              title="Total Customers" 
              value="2.4k" 
              icon={Users}
              trend={4.7}
              color="bg-purple-500"
            />
          </div>
        );
      case '5':
        return (
          <div data-swapy-item="5">
            <RevenueChart data={revenueData} />
          </div>
        );
      case '6':
        return (
          <div data-swapy-item="6">
            <SalesChart />
          </div>
        );
      default:
        console.log('No matching item for ID:', itemId);
        return null;
    }
  };
  
  const toggleLock = () => {
    if (swapyInstance) {
      const newLockedState = !isLocked;
      swapyInstance.enable(!newLockedState);
      setIsLocked(newLockedState);
      localStorage.setItem('dashboardLocked', JSON.stringify(newLockedState));
    }
  };

  const revenueData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen rounded">
      <div className="p-6">
        <button
          onClick={toggleLock}
          className="flex items-center gap-2 px-4 py-2 mb-4 bg-white shadow-sm border border-gray-100 rounded-lg hover:bg-gray-50 transition-all duration-200 ease-in-out"
          title={isLocked ? "Unlock Layout" : "Lock Layout"}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-gray-600">Layout Locked</span>
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-600">Layout Unlocked</span>
            </>
          )}
        </button>
        <div className="relative mb-4">
          <GreetingTab username={user ? user.first_name : 'loading...'} />
        </div>
        <div id="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 motion-preset-slide-up-md">
            <section data-swapy-slot="1">
              {getItemById(layout['1'])}
            </section>
            <section data-swapy-slot="2">
              {getItemById(layout['2'])}
            </section>
            <section data-swapy-slot="3">
              {getItemById(layout['3'])}
            </section>
            <section data-swapy-slot="4">
              {getItemById(layout['4'])}
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 motion-preset-slide-up-lg">
            <div className="lg:col-span-2" data-swapy-slot="5">
              {getItemById(layout['5'])}
            </div>
            <div data-swapy-slot="6">
              {getItemById(layout['6'])}
            </div>
          </div>
          <div className="my-6 motion-preset-slide-up-lg">
            <NewSellerGuide />
          </div>
        </div>
      </div>
    </div>
  );
}