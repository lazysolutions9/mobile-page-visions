import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";

interface SellerDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  seller: any; // A more specific type should be used here
}

export function SellerDetailsModal({ isOpen, onOpenChange, seller }: SellerDetailsModalProps) {
  const [sellerDetails, setSellerDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSellerDetails = async () => {
      if (!seller?.userId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('sellerDetails')
        .select('pincode')
        .eq('userId', seller.userId)
        .single();
      setSellerDetails(data);
      setLoading(false);
    };
    if (isOpen && seller?.userId) {
      fetchSellerDetails();
    }
  }, [isOpen, seller]);

  if (!seller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Shop Name</DialogTitle>
          <DialogDescription>
            {seller.shopName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h4 className="font-semibold">Shop Address</h4>
            <p className="text-sm text-muted-foreground">
              {seller.shopAddress || "No address provided."}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Pincode</h4>
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : (sellerDetails?.pincode ?? "No pincode provided.")}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Description</h4>
            <p className="text-sm text-muted-foreground">
              {seller.notes || "No notes provided."}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 