import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const SellerDetailsDialog = ({ seller, isOpen, onClose }) => {
  if (!seller) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seller Details</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <h3 className="font-semibold">Business Information</h3>
            <div className="space-y-2 mt-2">
              <p><span className="font-medium">Owner:</span> {seller.business_owner}</p>
              <p><span className="font-medium">Email:</span> {seller.business_email}</p>
              <p><span className="font-medium">Type:</span> {seller.business_type}</p>
              <p><span className="font-medium">Status:</span> {getStatusBadge(seller.status)}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold">Verification Details</h3>
            <div className="space-y-2 mt-2">
              <p><span className="font-medium">Approved By:</span> {seller.approved_by || 'N/A'}</p>
              <p><span className="font-medium">Admin Remarks:</span></p>
              <p className="text-sm text-gray-600">{seller.remarks || 'No remarks available'}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SellerDetailsDialog;
