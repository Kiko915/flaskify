import GreetingTab from "@/components/misc/GreetingTab"
import NewSellerGuide from "@/components/seller/NewSellerActions";
import { useAuth } from "@/utils/AuthContext"
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { createSwapy } from "swapy";

const StatCard = ({ title, value, icon: Icon, trend, color, slotId }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm" data-swapy-item={slotId}>
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


function SellerDashboard() {
  const { user } = useAuth();
  
  useEffect(() => {
    const container = document.querySelector('#container')
    const swapy = createSwapy(container, {
      swapMode: 'hover'
    })
    swapy.onSwap(({ data }) => {
      console.log('swap', data);
      localStorage.setItem('slotItem', JSON.stringify(data.object))
    })

    swapy.onSwapEnd(({ data, hasChanged }) => {
      console.log(hasChanged);
      console.log('end', data);
    })

    swapy.onSwapStart(() => {
      console.log('start')
    })

    return () => {
      swapy.destroy()
    }
  }, [])

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
        <GreetingTab username={user ? user.first_name : 'loading...'} />
        <div id="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 motion-preset-slide-up-md">
          <section data-swapy-slot="1">
          <StatCard 
            title="Total Revenue" 
            value="$34,545" 
            icon={DollarSign}
            trend={12.5}
            color="bg-indigo-500"
            slotId={1}
          />
          </section>
          <section data-swapy-slot="2">
          <StatCard 
            title="Total Orders" 
            value="456" 
            icon={ShoppingCart}
            trend={8.2}
            color="bg-blue-500"
            slotId={2}
          />
          </section>
          <section data-swapy-slot="3">
          <StatCard 
            title="Total Products" 
            value="89" 
            icon={Package}
            trend={-2.4}
            color="bg-green-500"
            slotId={3}
          />
          </section>
          <section data-swapy-slot="4">
          <StatCard 
            title="Total Customers" 
            value="2.4k" 
            icon={Users}
            trend={4.7}
            color="bg-purple-500"
            slotId={4}
          />
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 motion-preset-slide-up-lg">
          <div className="lg:col-span-2" data-swapy-slot="5">
            <div data-swapy-item="5">
            <RevenueChart data={revenueData} />
            </div>
          </div>
          <div data-swapy-slot="6">
            <div data-swapy-item="6">
            <SalesChart />
            </div>
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


export default SellerDashboard