import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, Star, StarOff, Trash2 } from "lucide-react";
import { API_URL } from "@/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from 'react-hot-toast';

export default function BankAccounts() {
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [addAccountDialogOpen, setAddAccountDialogOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    branch: ''
  });

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/seller/bank-accounts`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      } else {
        toast.error('Failed to fetch bank accounts');
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to fetch bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/api/seller/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newAccount)
      });

      if (response.ok) {
        toast.success('Bank account added successfully');
        setAddAccountDialogOpen(false);
        setNewAccount({
          bank_name: '',
          account_name: '',
          account_number: '',
          branch: ''
        });
        fetchBankAccounts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add bank account');
      }
    } catch (error) {
      console.error('Error adding bank account:', error);
      toast.error('Failed to add bank account');
    }
  };

  const handleDeleteAccount = async (accountUuid) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/seller/bank-accounts/${accountUuid}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Bank account deleted successfully');
        fetchBankAccounts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete bank account');
      }
    } catch (error) {
      console.error('Error deleting bank account:', error);
      toast.error('Failed to delete bank account');
    }
  };

  const handleSetPrimary = async (accountUuid) => {
    try {
      const response = await fetch(`${API_URL}/api/seller/bank-accounts/${accountUuid}/set-primary`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Primary bank account updated');
        fetchBankAccounts();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update primary bank account');
      }
    } catch (error) {
      console.error('Error updating primary bank account:', error);
      toast.error('Failed to update primary bank account');
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
        <h1 className="text-3xl font-bold">Bank Accounts</h1>
        <Dialog open={addAccountDialogOpen} onOpenChange={setAddAccountDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add Bank Account</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={newAccount.bank_name}
                  onChange={(e) => setNewAccount({ ...newAccount, bank_name: e.target.value })}
                  placeholder="Enter bank name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  value={newAccount.account_name}
                  onChange={(e) => setNewAccount({ ...newAccount, account_name: e.target.value })}
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={newAccount.account_number}
                  onChange={(e) => setNewAccount({ ...newAccount, account_number: e.target.value })}
                  placeholder="Enter account number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="branch">Branch (Optional)</Label>
                <Input
                  id="branch"
                  value={newAccount.branch}
                  onChange={(e) => setNewAccount({ ...newAccount, branch: e.target.value })}
                  placeholder="Enter branch name"
                />
              </div>
              <Button type="submit" className="w-full">
                Add Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bank Name</TableHead>
                <TableHead>Account Name</TableHead>
                <TableHead>Account Number</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Added On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankAccounts.map((account) => (
                <TableRow key={account.account_uuid}>
                  <TableCell>{account.bank_name}</TableCell>
                  <TableCell>{account.account_name}</TableCell>
                  <TableCell>{account.account_number}</TableCell>
                  <TableCell>{account.branch || 'N/A'}</TableCell>
                  <TableCell>
                    {format(new Date(account.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      account.is_verified
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {account.is_verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetPrimary(account.account_uuid)}
                      disabled={account.is_primary}
                      title={account.is_primary ? 'Primary Account' : 'Set as Primary'}
                    >
                      {account.is_primary ? (
                        <Star className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAccount(account.account_uuid)}
                      disabled={account.is_primary}
                      title="Delete Account"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {bankAccounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No bank accounts found
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