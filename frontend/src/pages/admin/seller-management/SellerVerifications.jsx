import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/utils/AuthContext';

const SellerVerifications = () => {
  const { user } = useAuth();
  const [sellers, setSellers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [handleAccept, setHandleAccept] = useState({ id: null, open: false });
  const [handleReject, setHandleReject] = useState({ id: null, open: false });
  const [formData, setFormData] = useState({
    status: 'Approved',
    remarks: '',
    approved_by: user?.user_uuid
  });
  const [formData2, setFormData2] = useState({
    status: 'Rejected',
    remarks: '',
    approved_by: user?.user_uuid
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    setFormData2({ ...formData2, [name]: value });
  };

  


  // Fetch all sellers
  const fetchSellers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5555/sellers', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sellers');
      }

      const data = await response.json();
      setSellers(data);
    } catch (err) {
      setError('Failed to load sellers: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch seller details
  const fetchSellerDetails = async (sellerId) => {
    setDetailsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5555/seller/${sellerId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch seller details');
      }

      const data = await response.json();
      setSelectedSeller(data);
      setIsDialogOpen(true);
    } catch (err) {
      setError('Failed to load seller details: ' + err.message);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApproval = async (e) => {
    e.preventDefault();
    try {
      // Implement your status update API call here
      setError(null);
      setLoading(true);
      const response = await fetch(`http://localhost:5555//admin/seller/${handleAccept.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      if (response.ok) {
        setHandleAccept(true);
        setFormData({
          status: 'Approved',
          remarks: '',
          approved_by: user?.user_uuid
        });
        setLoading(false);
        setIsDialogOpen(false);
        setSelectedSeller(null);
        fetchSellers();
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      setError('Failed to update status: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update seller status
  const handleUpdateStatus = async (sellerId, newStatus) => {
    try {
      // Implement your status update API call here
      setError(null);
      // After successful update, refresh the sellers list
      await fetchSellers();
    } catch (err) {
      setError('Failed to update status: ' + err.message);
    }
  };

  // Fetch sellers on component mount
  useEffect(() => {
    fetchSellers();
  }, []);

  const getStatusBadge = (status) => {
    // Handle null or undefined status
    if (!status) {
      return (
        <Badge className="bg-gray-200 text-gray-700">
          Unknown
        </Badge>
      );
    }

    // Normalize status to lowercase for consistent matching
    const normalizedStatus = status.toLowerCase();

    const statusConfig = {
      pending: {
        component: Clock,
        className: "bg-yellow-200 text-yellow-700"
      },
      approved: {
        component: CheckCircle,
        className: "bg-green-200 text-green-700"
      },
      rejected: {
        component: XCircle,
        className: "bg-red-200 text-red-700"
      },
      'under review': {
        component: Clock,
        className: "bg-blue-200 text-blue-700"
      },
      suspended: {
        component: XCircle,
        className: "bg-orange-200 text-orange-700"
      },
      inactive: {
        component: XCircle,
        className: "bg-gray-200 text-gray-700"
      },
      active: {
        component: CheckCircle,
        className: "bg-green-200 text-green-700"
      },
    };

    // If status isn't in our config, return a default badge
    if (!statusConfig[normalizedStatus]) {
      return (
        <Badge className="bg-gray-200 text-gray-700">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    }

    const StatusIcon = statusConfig[normalizedStatus].component;

    return (
      <Badge className={statusConfig[normalizedStatus].className}>
        <StatusIcon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const SellerDetailsView = ({ seller }) => {
    if (!seller) return null;

    const detailFields = [
      { label: "Business Owner", value: seller.business_owner },
      { label: "Business Type", value: seller.business_type },
      { label: "Tax ID", value: seller.tax_id },
      { label: "BIR Certificate", value: seller.tax_certificate_doc },
      { label: "Business Email", value: seller.business_email },
      { label: "Business Phone", value: seller.business_phone },
      { label: "Country", value: seller.business_country },
      { label: "Province/State", value: seller.business_province },
      { label: "City", value: seller.business_city },
      { label: "Address", value: seller.business_address },
      { label: "Total Sales", value: seller.total_sales },
      { label: "Approval Date", value: seller.approval_date },
    ];

    return (
      <div className="grid grid-cols-2 gap-4">
        {detailFields.map((field, index) => (
          <div key={index} className="space-y-1">
            <p className="text-sm font-medium text-gray-500">{field.label}</p>
            <p className="text-sm">{field.value || 'N/A'}</p>
          </div>
        ))}
        <div className="col-span-2">
          <p className="text-sm font-medium text-gray-500">Admin Notes</p>
          <p className="text-sm whitespace-pre-wrap">{seller.admin_notes || 'No notes available'}</p>
        </div>
      </div>
    );
  };

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch =
      seller.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.business_owner?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || seller.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seller Verifications</CardTitle>
          <CardDescription>
            Manage and review seller verification requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by business or owner name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead>BIR Certificate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registered Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500">
                      No sellers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSellers.map((seller) => (
                    <TableRow key={seller.id}>
                      <TableCell>{seller.business_owner}</TableCell>
                      <TableCell>{seller.business_type}</TableCell>
                      <TableCell>{seller.tax_id ? seller.tax_id : "N/A"}</TableCell>
                      <TableCell>{seller.tax_certificate_doc ? seller.tax_certificate_doc : "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(seller.status)}</TableCell>
                      <TableCell className="text-sm">
                        {seller.submission_date
                          ? new Date(seller.submission_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchSellerDetails(seller.id)}
                            disabled={detailsLoading}
                          >
                            View Details
                          </Button>
                          {seller.status === 'Pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => setHandleAccept({  id: seller.id, open: true })}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setHandleReject(true)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Seller Details</DialogTitle>
            <DialogDescription>
              Complete information about the seller
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : (
            selectedSeller && <SellerDetailsView seller={selectedSeller} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={handleAccept.open} onOpenChange={handleAccept.open}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Do you want to approve this seller?</DialogTitle>
            <DialogDescription>
              Add additional information about the approval action
            </DialogDescription>
          </DialogHeader>
          <form className='space-y-4' onSubmit={handleApproval} >
            <div className='space-y-2'>
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea id="admin_notes" name="remarks" placeholder="Enter admin notes" maxLength={250} onChange={(e) => handleInputChange(e)} value={formData.remarks} />
              <p className="text-sm text-muted-foreground text-right">
                {formData.remarks?.length || 0} / 250 characters
              </p>
            </div>
            <div className='space-y-2'>
              <Label htmlFor="approved_by">Approved By</Label>
              <Input id="approved_by" name="approved_by" placeholder="Approved By" required value={user?.username + " - " + user?.role} disabled />
            </div>
          
          <Separator className="mt-4" />
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setHandleAccept(false)}>Cancel</Button>
            <Button type="submit" variant="default" className="bg-green-600 hover:bg-green-700">Approve</Button>
          </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={handleReject} onOpenChange={setHandleReject}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Do you want to reject this seller?</DialogTitle>
            <DialogDescription>
              Add additional information about the rejection action
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setHandleReject(false)}>Cancel</Button>
            <Button variant="default" className="bg-red-600 hover:bg-red-700" onClick={() => setHandleReject(false)}>Reject</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerVerifications;