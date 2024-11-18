import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar,
  DollarSign,
  AlertTriangle,
  Eye
} from 'lucide-react';

const SellerDetailsDialog = ({ seller, isOpen, onClose }) => {
  if (!seller) return null;

  console.log(seller)

  const getStatusBadge = (status) => {
    const statusConfig = {
      Pending: { color: 'bg-yellow-500', text: 'text-yellow-950' },
      Approved: { color: 'bg-green-500', text: 'text-white' },
      Rejected: { color: 'bg-red-500', text: 'text-red-950' },
      Suspended: { color: 'bg-gray-500', text: 'text-gray-950' }
    };

    const config = statusConfig[status] || { color: 'bg-gray-200', text: 'text-gray-950' };

    return (
      <Badge className={`${config.color} ${config.text} px-3 py-1`}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleViewDocument = async (documentUrl) => {
    if (!documentUrl) return;
    
    try {
      // Open Cloudinary URL directly in a new tab
      window.open(documentUrl, '_blank');
    } catch (err) {
      console.error('Failed to view document:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Seller Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
          {/* Status Section */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">{seller.business_name}</h2>
              <p className="text-gray-500">Application Status: {getStatusBadge(seller.status)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Submission Date</p>
              <p className="font-medium">{formatDate(seller.submission_date)}</p>
            </div>
          </div>

          <Separator />

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Building2 className="h-5 w-5" />
              Business Information
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Business Owner</p>
                    <p className="font-medium">{seller.business_owner}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Business Email</p>
                    <p className="font-medium">{seller.business_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Business Phone</p>
                    <p className="font-medium">{seller.business_phone || 'N/A'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Business Type</p>
                    <p className="font-medium">{seller.business_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Tax ID</p>
                    <p className="font-medium">{seller.tax_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">BIR Certificate</p>
                    {seller.bir_certificate ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(seller.bir_certificate)}
                        className="flex items-center gap-2 px-0 font-medium"
                      >
                        <Eye className="h-4 w-4" />
                        View Document
                      </Button>
                    ) : (
                      <p className="font-medium">Not available</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Total Sales</p>
                    <p className="font-medium">₱{seller.total_sales?.toLocaleString() || '0.00'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              Business Address
            </h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                {seller.business_address}, {seller.business_city}
              </p>
              <p className="text-gray-600">
                {seller.business_province}, {seller.business_country}
              </p>
            </div>
          </div>

          <Separator />

          {/* Verification Details */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5" />
              Verification Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Approved By</p>
                <p className="font-medium">{seller.approved_by || 'Pending Approval'}</p>
              </div>
              {seller.approval_date && (
                <div>
                  <p className="text-sm text-gray-500">Approval Date</p>
                  <p className="font-medium">{formatDate(seller.approval_date)}</p>
                </div>
              )}
              {seller.violation_type && (
                <div>
                  <p className="text-sm text-gray-500">Violation Type</p>
                  <Badge variant="destructive" className="mt-1">
                    {seller.violation_type}
                  </Badge>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-1">Admin Remarks</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-700">{seller.remarks || 'No remarks available'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerDetailsDialog;
