import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, TrendingUp, ShoppingBag, CreditCard, DollarSign } from "lucide-react";
import { API_URL } from "@/config";
import toast from 'react-hot-toast';

export default function MyIncome() {
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState({
    total_revenue: 0,
    monthly_revenue: 0,
    total_orders: 0,
    monthly_orders: 0,
    recent_transactions: [],
    revenue_stats: {
      total: 0,
      monthly: 0,
      average_order_value: 0
    }
  });

  useEffect(() => {
    const fetchIncome = async () => {
      try {
        const response = await fetch(`${API_URL}/api/seller/income`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          data.revenue_stats = data.revenue_stats || {
            total: data.total_revenue || 0,
            monthly: data.monthly_revenue || 0,
            average_order_value: data.total_orders > 0 ? (data.total_revenue / data.total_orders) : 0
          };
          setIncome(data);
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to fetch income data');
        }
      } catch (error) {
        console.error('Error fetching income:', error);
        toast.error('Failed to fetch income data');
      } finally {
        setLoading(false);
      }
    };

    fetchIncome();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const averageOrderValue = income?.revenue_stats?.average_order_value || 0;
  const totalRevenue = income?.total_revenue || 0;
  const monthlyRevenue = income?.monthly_revenue || 0;
  const totalOrders = income?.total_orders || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Income</h1>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per order</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(income.recent_transactions || []).map((transaction) => (
                <TableRow key={transaction.transaction_uuid}>
                  <TableCell>
                    {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      transaction.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </TableCell>
                  <TableCell className={`text-right ${
                    transaction.type === 'withdrawal' ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </TableCell>
                </TableRow>
              ))}
              {(!income.recent_transactions || income.recent_transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 