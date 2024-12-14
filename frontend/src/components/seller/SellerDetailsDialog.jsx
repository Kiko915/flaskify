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
    if (!documentUrl) {
      console.error('No document URL provided');
      return;
    }
    
    try {
      // Open Cloudinary URL directly in a new tab
      window.open(documentUrl, '_blank');
    } catch (err) {
      console.error('Failed to view document:', err);
    }
  };

  const formatLocation = () => {
    const parts = [];
    
    if (seller.business_address) parts.push(seller.business_address);
    if (seller.business_city) parts.push(seller.business_city);
    if (seller.business_province) parts.push(seller.business_province);
    if (seller.business_region) parts.push(seller.business_region);
    if (seller.business_country) parts.push(seller.business_country);
    
    return parts.join(', ') || 'Location not provided';
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
              <h2 className="text-xl font-semibold">{seller.business_owner}</h2>
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
                    <p className="font-medium">Owner Name</p>
                    <p className="text-gray-600">{seller.business_owner}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Business Type</p>
                    <p className="text-gray-600">{seller.business_type}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Tax ID</p>
                    <p className="text-gray-600">{seller.tax_id || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-600">{seller.business_email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-600">{seller.business_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-gray-600">
                      {seller.business_address}<br />
                      {seller.business_city}, {seller.business_province}<br />
                      {seller.business_region}, {seller.business_country}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Documents */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              Documents
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <span>BIR Certificate</span>
                </div>
                {seller.bir_certificate ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(seller.bir_certificate)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                ) : (
                  <span className="text-gray-500">Not available</span>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          {(seller.remarks || seller.violation_type || seller.rejection_reason) && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5" />
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {seller.remarks && (
                    <div>
                      <p className="font-medium">Remarks</p>
                      <p className="text-gray-600">{seller.remarks}</p>
                    </div>
                  )}
                  {seller.violation_type && (
                    <div>
                      <p className="font-medium">Violation Type</p>
                      <p className="text-gray-600">{seller.violation_type}</p>
                    </div>
                  )}
                  {seller.rejection_reason && (
                    <div>
                      <p className="font-medium">Rejection Reason</p>
                      <p className="text-gray-600">{seller.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerDetailsDialog;
