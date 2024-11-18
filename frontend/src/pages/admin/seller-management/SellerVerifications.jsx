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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SellerDetailsDialog from '@/components/seller/SellerDetailsDialog';
import { CheckCircle, XCircle, Clock, Search, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/utils/AuthContext';
import { Separator } from '@/components/ui/separator';

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
  const [actionDialog, setActionDialog] = useState({ 
    type: null, // 'approve', 'reject', or 'suspend'
    sellerId: null, 
    open: false 
  });
  const [formData, setFormData] = useState({
    status: '',
    remarks: '',
    approved_by: user?.user_uuid,
    violation_type: ''
  });

  const violationTypes = [
    { value: 'counterfeit', label: 'Selling Counterfeit Products' },
    { value: 'misrepresentation', label: 'Product Misrepresentation' },
    { value: 'shipping', label: 'Shipping Violations' },
    { value: 'customer_service', label: 'Poor Customer Service' },
    { value: 'policy', label: 'Policy Violations' },
    { value: 'fraud', label: 'Fraudulent Activity' },
    { value: 'other', label: 'Other Violations' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleActionClick = (type, sellerId) => {
    setActionDialog({ 
      type, 
      sellerId, 
      open: true 
    });
    setFormData({
      status: type === 'approve' ? 'Approved' : type === 'reject' ? 'Rejected' : 'Suspended',
      remarks: '',
      approved_by: user?.user_uuid,
      violation_type: ''
    });
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setLoading(true);
      const response = await fetch(`http://localhost:5555/admin/seller/${actionDialog.sellerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update seller status');
      }

      const data = await response.json();
      // toast.success(data.message);
      
      // Reset form and close dialog
      setFormData({
        status: '',
        remarks: '',
        approved_by: user?.user_uuid,
        violation_type: ''
      });
      setActionDialog({ type: null, sellerId: null, open: false });
      
      // Refresh seller list
      fetchSellers();
      
    } catch (err) {
      setError('Failed to update status: ' + err.message);
      // toast.error('Failed to update seller status');
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    fetchSellers();
  }, []);

  const getStatusBadge = (status) => {
    const statusColors = {
      Pending: 'bg-yellow-500',
      Approved: 'bg-green-500',
      Rejected: 'bg-red-500',
      Suspended: 'bg-gray-500'
    };

    return (
      <Badge className={`${statusColors[status] || 'bg-gray-200'} text-white`}>
        {status || 'Unknown'}
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
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
                          {seller.status === 'Pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleActionClick('approve', seller.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleActionClick('reject', seller.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {seller.status === 'Approved' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleActionClick('suspend', seller.id)}
                            >
                              Suspend
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSeller(seller);
                              setIsDialogOpen(true);
                            }}
                          >
                            View Details
                          </Button>
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

      <Dialog open={actionDialog.open} onOpenChange={() => setActionDialog({ type: null, sellerId: null, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === 'approve' ? 'Approve Seller' :
               actionDialog.type === 'reject' ? 'Reject Seller' : 'Suspend Seller'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'suspend' && 'Select the violation type and provide detailed comments about the suspension.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActionSubmit}>
            <div className="space-y-4 py-4">
              {actionDialog.type === 'suspend' && (
                <div className="space-y-2">
                  <Label htmlFor="violation_type">Violation Type</Label>
                  <Select
                    value={formData.violation_type}
                    onValueChange={(value) => setFormData({ ...formData, violation_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select violation type" />
                    </SelectTrigger>
                    <SelectContent>
                      {violationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="remarks">Admin Comments</Label>
                <Textarea
                  id="remarks"
                  name="remarks"
                  placeholder={actionDialog.type === 'suspend' 
                    ? "Provide detailed explanation of the violation and suspension..." 
                    : "Enter your comments..."}
                  value={formData.remarks}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActionDialog({ type: null, sellerId: null, open: false })}
              >
                Cancel
              </Button>
              <Button 
                variant={actionDialog.type === 'approve' ? 'default' : 'destructive'} 
                type="submit" 
                disabled={loading || (actionDialog.type === 'suspend' && !formData.violation_type)}
              >
                {loading ? 'Processing...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerVerifications;