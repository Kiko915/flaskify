import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GreetingTab from "@/components/misc/GreetingTab";
import { useAuth } from "@/utils/AuthContext";
import {
    Users,
    Store,
    Package,
    DollarSign,
    TrendingUp,
    ShoppingCart,
    AlertTriangle,
    Clock,
    RotateCw
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend
} from 'recharts';

export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        buyers: 0,
        sellers: 0,
        approvedSellers: 0,
        pendingSellers: 0,
        totalProducts: 0,
        totalRevenue: 0,
        totalOrders: 0,
        pendingOrders: 0,
        activeShops: 0,
        pendingShops: 0
    });

    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            setIsRefreshing(true);
            // Fetch dashboard statistics
            const response = await fetch('http://localhost:5555/admin/dashboard/stats', {
                credentials: 'include'
            });
            const data = await response.json();
            setStats(data);

            // Fetch sales data for charts
            const salesResponse = await fetch('http://localhost:5555/admin/dashboard/sales', {
                credentials: 'include'
            });
            const salesData = await salesResponse.json();
            setSalesData(salesData);
            
            // Update last updated time
            setLastUpdated(new Date().toLocaleTimeString());
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Total Users",
            subtitle: "Buyers & Sellers",
            value: stats.buyers + stats.sellers,
            icon: Users,
            color: "text-blue-600",
            bgColor: "bg-blue-100"
        },
        {
            title: "Active Sellers",
            subtitle: "Approved Sellers",
            value: stats.approvedSellers,
            icon: Store,
            color: "text-green-600",
            bgColor: "bg-green-100"
        },
        {
            title: "Total Products",
            value: stats.totalProducts,
            icon: Package,
            color: "text-purple-600",
            bgColor: "bg-purple-100"
        },
        {
            title: "Total Revenue",
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: "text-yellow-600",
            bgColor: "bg-yellow-100"
        }
    ];

    return (
        <div className="space-y-6 motion-preset-fade-lg">
            <GreetingTab username={user?.username || 'Admin'} role="admin" />
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        disabled={isRefreshing}
                    >
                        <Clock className="h-4 w-4" />
                        Last updated: {lastUpdated}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchDashboardData}
                        disabled={isRefreshing}
                    >
                        <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <Card key={index} className="p-6 motion-preset-slide-up delay-75">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">{stat.title}</p>
                                {stat.subtitle && (
                                    <p className="text-xs text-gray-400">{stat.subtitle}</p>
                                )}
                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                            </div>
                            <div className={`p-3 rounded-full ${stat.bgColor}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 motion-preset-slide-up motion-delay-100">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-orange-100">
                            <ShoppingCart className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Orders</p>
                            <p className="text-xl font-bold">{stats.pendingOrders}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-red-100">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Approval Sellers</p>
                            <p className="text-xl font-bold">{stats.pendingSellers}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-emerald-100">
                            <Store className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Shops</p>
                            <p className="text-xl font-bold">{stats.activeShops}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-indigo-100">
                            <TrendingUp className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-xl font-bold">{stats.totalOrders}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 motion-preset-slide-up motion-delay-200">
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="sales" fill="#4f46e5" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Growth Trends</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line 
                                    type="monotone" 
                                    dataKey="users" 
                                    stroke="#2563eb" 
                                    strokeWidth={2} 
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="orders" 
                                    stroke="#16a34a" 
                                    strokeWidth={2} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
