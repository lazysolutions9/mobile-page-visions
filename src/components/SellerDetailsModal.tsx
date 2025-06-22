import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SellerDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  seller: any; // A more specific type should be used here
}

export function SellerDetailsModal({ isOpen, onOpenChange, seller }: SellerDetailsModalProps) {
  if (!seller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{seller.shopName}</DialogTitle>
          <DialogDescription>
            Seller Details
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h4 className="font-semibold">Shop Address</h4>
            <p className="text-sm text-muted-foreground">
              {seller.address || "123 Main St, Anytown, USA"}
            </p>
          </div>
          <div>
            <h4 className="font-semibold">Seller Notes</h4>
            <p className="text-sm text-muted-foreground">
              {seller.notes || "We provide fast and friendly service!"}
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