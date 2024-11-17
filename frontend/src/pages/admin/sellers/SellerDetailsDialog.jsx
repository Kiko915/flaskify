import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import toast from "react-hot-toast";

const statusColors = {
  Pending: "bg-yellow-500",
  Approved: "bg-green-500",
  Rejected: "bg-red-500",
};

export default function SellerDetailsDialog({
  seller,
  isOpen,
  onClose,
  onStatusUpdate,
}) {
  const [remarks, setRemarks] = useState("");

  const updateStatus = async (newStatus) => {
    try {
      const response = await fetch(`/api/admin/seller/${seller.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          remarks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update seller status");
      }

      toast.success(`Seller status updated to ${newStatus}`);
      onStatusUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update seller status");
    }
  };

  if (!seller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Seller Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Business Owner</h3>
              <p className="text-sm text-muted-foreground">
                {seller.business_owner}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Business Type</h3>
              <p className="text-sm text-muted-foreground">
                {seller.business_type}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Email</h3>
              <p className="text-sm text-muted-foreground">
                {seller.business_email}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Tax ID</h3>
              <p className="text-sm text-muted-foreground">
                {seller.tax_id || "N/A"}
              </p>
            </div>
            <div>
              <h3 className="font-medium">Status</h3>
              <Badge
                className={`${statusColors[seller.status]} text-white hover:${
                  statusColors[seller.status]
                } mt-1`}
              >
                {seller.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium">Registration Date</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(seller.submission_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {seller.bir_certificate && (
            <div>
              <h3 className="font-medium mb-2">BIR Certificate</h3>
              <a
                href={seller.bir_certificate}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                View Certificate
              </a>
            </div>
          )}

          {seller.status === "Pending" && (
            <>
              <div>
                <h3 className="font-medium mb-2">Admin Remarks</h3>
                <Textarea
                  placeholder="Add remarks about this seller application..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => updateStatus("Approved")}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Approve Seller
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateStatus("Rejected")}
                >
                  Reject Seller
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
