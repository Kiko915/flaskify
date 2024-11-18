import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import SellerDetailsDialog from "./SellerDetailsDialog";

const statusColors = {
  Pending: "bg-yellow-500",
  Approved: "bg-green-500",
  Rejected: "bg-red-500",
};

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSeller, setSelectedSeller] = useState(null);

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const response = await fetch("http://localhost:5555/sellers", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch sellers");
      }
      const data = await response.json();
      setSellers(data);
    } catch (error) {
      toast.error("Failed to fetch sellers");
    } finally {
      setLoading(false);
    }
  };

  const filteredSellers = sellers.filter((seller) => {
    const matchesSearch =
      seller.business_owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.business_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (seller.tax_id && seller.tax_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || seller.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Seller Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search sellers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Tax ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSellers.map((seller) => (
                  <TableRow
                    key={seller.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedSeller(seller)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage 
                            src={seller.profile_image_url} 
                            alt={seller.business_owner} 
                          />
                          <AvatarFallback>
                            {getInitials(seller.business_owner)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{seller.business_owner}</div>
                          <div className="text-sm text-muted-foreground">
                            {seller.business_email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{seller.business_type}</TableCell>
                    <TableCell>{seller.tax_id || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          statusColors[seller.status]
                        } text-white hover:${statusColors[seller.status]}`}
                      >
                        {seller.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(seller.submission_date).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <SellerDetailsDialog
        seller={selectedSeller}
        isOpen={!!selectedSeller}
        onClose={() => setSelectedSeller(null)}
      />
    </>
  );
}
