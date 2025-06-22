import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface SellerRequestDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  request: any; // A more specific type should be used here
}

export function SellerRequestDetailsModal({ isOpen, onOpenChange, request }: SellerRequestDetailsModalProps) {
  if (!request) return null;

  const isIncoming = request.status === 'incoming';

  const handleAction = (action: 'accept' | 'reject') => {
    console.log(`Request ${request.id} has been ${action}ed.`);
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>
            {request.type} from {request.customer}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h4 className="font-semibold">Notes</h4>
            <p className="text-sm text-muted-foreground">
              {request.notes || "No notes provided."}
            </p>
          </div>
          {
            !isIncoming && (
              <>
                <div>
                  <h4 className="font-semibold">Date</h4>
                  <p className="text-sm text-muted-foreground">{request.date}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Time</h4>
                  <p className="text-sm text-muted-foreground">{request.time}</p>
                </div>
              </>
            )
          }
        </div>
        <DialogFooter>
          {isIncoming ? (
            <>
              <Button variant="outline" onClick={() => handleAction('reject')}>Reject</Button>
              <Button onClick={() => handleAction('accept')}>Accept</Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 