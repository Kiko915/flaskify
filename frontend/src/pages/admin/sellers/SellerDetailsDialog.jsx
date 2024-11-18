import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const statusColors = {
  Pending: "bg-yellow-500",
  Approved: "bg-green-500",
  Rejected: "bg-red-500",
};

export default function SellerDetailsDialog({ seller, isOpen, onClose }) {
  if (!seller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seller Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Business Owner</h4>
              <p>{seller.business_owner}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Business Type</h4>
              <p>{seller.business_type}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Business Email</h4>
              <p>{seller.business_email}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Tax ID</h4>
              <p>{seller.tax_id || "N/A"}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Status</h4>
              <Badge className={`${statusColors[seller.status]} text-white`}>
                {seller.status}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium mb-1">Registration Date</h4>
              <p>{new Date(seller.submission_date).toLocaleDateString()}</p>
            </div>
          </div>

          {seller.remarks && (
            <div>
              <h4 className="font-medium mb-1">Remarks</h4>
              <p className="text-muted-foreground">{seller.remarks}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
