import GreetingTab from "@/components/misc/GreetingTab"
import NewSellerGuide from "@/components/seller/NewSellerActions";
import { useAuth } from "@/utils/AuthContext"
import { DollarSign, Package, ShoppingCart, Users, Lock, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import React from "react";
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';

// API URL
const API_URL = 'http://localhost:5555';

const ResponsiveGridLayout = WidthProvider(Responsive);

const StatCard = React.memo(({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm h-full flex flex-col">
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
    <div className="flex-grow flex flex-col justify-center">
      <p className="text-gray-600 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-semibold">{value}</h3>
    </div>
  </div>
));

const RevenueChart = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm h-full flex flex-col">
    <h3 className="text-lg font-medium mb-4">Revenue Overview</h3>
    <div className="flex-grow">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(date) => {
              const [, month, day] = date.split('-');
              return `${month}/${day}`;
            }}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis 
            tickFormatter={(value) => `₱${value.toLocaleString()}`}
            stroke="#6b7280"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            formatter={(value, name) => [`₱${value.toLocaleString()}`, 'Revenue']}
            labelFormatter={(date) => {
              const dateObj = new Date(date);
              return dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SalesChart = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm h-full flex flex-col">
    <h3 className="text-lg font-medium mb-4">Sales Distribution</h3>
    <div className="flex-grow flex items-center justify-center">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const DraggableItem = React.memo(({ itemId, children }) => (
  <div data-swapy-item={itemId} className="h-full">
    {children}
  </div>
));

const DEFAULT_LAYOUT = {
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6'
};

export default function SellerDashboard() {
  const { user } = useAuth();
  const [isLocked, setIsLocked] = useState(() => {
    const savedLockState = localStorage.getItem('dashboardLocked');
    return savedLockState ? JSON.parse(savedLockState) : true;
  });

  const [layouts, setLayouts] = useState(() => {
    const savedLayouts = localStorage.getItem('dashboardLayouts');
    return savedLayouts ? JSON.parse(savedLayouts) : {
      lg: [
        { i: '1', x: 0, y: 0, w: 3, h: 2 },  // 0-3 columns
        { i: '2', x: 3, y: 0, w: 3, h: 2 },  // 3-6 columns
        { i: '3', x: 6, y: 0, w: 3, h: 2 },  // 6-9 columns
        { i: '4', x: 9, y: 0, w: 3, h: 2 },  // 9-12 columns
        { i: '5', x: 0, y: 2, w: 6, h: 3 },  // 0-6 columns
        { i: '6', x: 6, y: 2, w: 6, h: 3 }   // 6-12 columns
      ],
      md: [
        { i: '1', x: 0, y: 0, w: 5, h: 2 },
        { i: '2', x: 5, y: 0, w: 5, h: 2 },
        { i: '3', x: 0, y: 2, w: 5, h: 2 },
        { i: '4', x: 5, y: 2, w: 5, h: 2 },
        { i: '5', x: 0, y: 4, w: 10, h: 3 },
        { i: '6', x: 0, y: 7, w: 10, h: 3 }
      ],
      sm: [
        { i: '1', x: 0, y: 0, w: 6, h: 2 },
        { i: '2', x: 0, y: 2, w: 6, h: 2 },
        { i: '3', x: 0, y: 4, w: 6, h: 2 },
        { i: '4', x: 0, y: 6, w: 6, h: 2 },
        { i: '5', x: 0, y: 8, w: 6, h: 3 },
        { i: '6', x: 0, y: 11, w: 6, h: 3 }
      ]
    };
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    trends: {
      revenue: 0,
      orders: 0,
      products: 0,
      customers: 0
    },
    revenueData: [],
    salesDistribution: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/seller/dashboard/stats`, {
          withCredentials: true
        });
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching seller stats:', err);
        setError(err.response?.data?.error || 'Failed to fetch dashboard stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onLayoutChange = (layout, layouts) => {
    setLayouts(layouts);
    localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
  };

  const toggleLock = () => {
    const newLockedState = !isLocked;
    setIsLocked(newLockedState);
    localStorage.setItem('dashboardLocked', JSON.stringify(newLockedState));
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-red-500 text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading Dashboard</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

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
          <GreetingTab username={user?.first_name} role={user?.role} />
        </div>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={onLayoutChange}
          isDraggable={!isLocked}
          isResizable={!isLocked}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 10, sm: 6 }}
          rowHeight={100}
          margin={[16, 16]}
          preventCollision={true}
          compactType={null}
        >
          <div key="1" className="h-full">
            <StatCard 
              title="Total Revenue" 
              value={`₱${stats.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              trend={stats.trends.revenue}
              color="bg-indigo-500"
            />
          </div>
          
          <div key="2" className="h-full">
            <StatCard 
              title="Total Orders" 
              value={stats.totalOrders.toLocaleString()}
              icon={ShoppingCart}
              trend={stats.trends.orders}
              color="bg-blue-500"
            />
          </div>

          <div key="3" className="h-full">
            <StatCard 
              title="Total Products" 
              value={stats.totalProducts.toLocaleString()}
              icon={Package}
              trend={stats.trends.products}
              color="bg-green-500"
            />
          </div>

          <div key="4" className="h-full">
            <StatCard 
              title="Total Customers" 
              value={stats.totalCustomers.toLocaleString()}
              icon={Users}
              trend={stats.trends.customers}
              color="bg-purple-500"
            />
          </div>

          <div key="5" className="h-full">
            <RevenueChart data={stats.revenueData} />
          </div>

          <div key="6" className="h-full">
            <SalesChart data={stats.salesDistribution} />
          </div>
        </ResponsiveGridLayout>

        <div className="my-6 motion-preset-slide-up-lg">
          <NewSellerGuide />
        </div>
      </div>
    </div>
  );
}