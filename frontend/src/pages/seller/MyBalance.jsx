import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';
import { TrendingUp, ShoppingBag, CreditCard, DollarSign, Wallet } from "lucide-react";

export default function MyBalance() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState({
    total_revenue: 0,
    available_balance: 0,
    total_withdrawals: 0,
    pending_withdrawals: [],
    processing_withdrawals: [],
    balance_stats: {
      total_revenue: 0,
      total_withdrawn: 0,
      pending_withdrawals: 0,
      available_for_withdrawal: 0
    }
  });
  const [bankAccounts, setBankAccounts] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [balanceResponse, accountsResponse] = await Promise.all([
          fetch(`${API_URL}/api/seller/balance`, { credentials: 'include' }),
          fetch(`${API_URL}/api/seller/bank-accounts`, { credentials: 'include' })
        ]);

        if (balanceResponse.ok && accountsResponse.ok) {
          const [balanceData, accountsData] = await Promise.all([
            balanceResponse.json(),
            accountsResponse.json()
          ]);
          setBalance(balanceData);
          setBankAccounts(accountsData);
        } else {
          toast.error('Failed to fetch balance data');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch balance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!selectedAccount) {
      toast.error('Please select a bank account');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > balance.available_balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/seller/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount,
          bank_account_uuid: selectedAccount
        })
      });

      if (response.ok) {
        toast.success('Withdrawal request submitted successfully');
        setWithdrawalDialogOpen(false);
        
        // Refresh balance data
        const balanceResponse = await fetch(`${API_URL}/api/seller/balance`, {
          credentials: 'include'
        });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setBalance(balanceData);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Balance</h1>
        <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
          <DialogTrigger asChild>
            <Button>Withdraw Funds</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleWithdrawal} className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label htmlFor="bank-account">Bank Account</Label>
                <select
                  id="bank-account"
                  className="w-full p-2 border rounded-md"
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  <option value="">Select a bank account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.account_uuid} value={account.account_uuid}>
                      {account.bank_name} - {account.account_number}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">
                Submit Withdrawal
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.available_balance)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.balance_stats.total_withdrawn)}</div>
            <p className="text-xs text-muted-foreground">Successfully withdrawn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Withdrawals</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(balance.balance_stats.pending_withdrawals)}</div>
            <p className="text-xs text-muted-foreground">In process</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...balance.pending_withdrawals, ...balance.processing_withdrawals].map((withdrawal) => (
                <TableRow key={withdrawal.withdrawal_uuid}>
                  <TableCell>
                    {format(new Date(withdrawal.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    {withdrawal.bank_account.bank_name} - {withdrawal.bank_account.account_number}
                  </TableCell>
                  <TableCell>{withdrawal.reference_number || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      withdrawal.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : withdrawal.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : withdrawal.status === 'processing'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(withdrawal.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {balance.pending_withdrawals.length === 0 && balance.processing_withdrawals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    No pending withdrawals
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