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
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useEffect, useState } from "react";
import { useToast } from "./ui/use-toast";
import { supabase } from "@/lib/supabase";

interface SellerRequestDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  request: any; // A more specific type should be used here
  onAccept: () => void;
  user: any;
}

export function SellerRequestDetailsModal({ isOpen, onOpenChange, request, onAccept, user }: SellerRequestDetailsModalProps) {
  if (!request) return null;

  const { toast } = useToast();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (request?.notes) {
      setNotes(request.notes);
    } else {
      setNotes("");
    }
  }, [request]);

  const isIncoming = request.status === 'incoming';
  const isAccepted = request.status === 'accepted';

  const handleAction = async (action: 'accept' | 'update') => {
    if (!user) {
      toast({ title: "Authentication Error", description: "Could not authenticate user.", variant: "destructive" });
      return;
    }

    if (action === 'accept') {
      const { error } = await supabase.from('sellerResponse').insert([
        { orderId: request.id, userId: user.id, notes: notes }
      ]);

      if (error) {
        toast({ title: "Error", description: "Could not accept the request.", variant: "destructive" });
      } else {
        await supabase.from('order').update({ status: 'accepted' }).eq('id', request.id);
        toast({ title: "Request Accepted", description: `Request for "${request.itemName}" has been accepted.` });
        onAccept();
      }
    } else if (action === 'update') {
      const { error } = await supabase.from('sellerResponse').update({ notes }).eq('orderId', request.id).eq('userId', user.id);

      if (error) {
        toast({ title: "Error", description: "Could not update the request.", variant: "destructive" });
      } else {
        toast({ title: "Request Updated", description: `Request for "${request.itemName}" has been updated.` });
      }
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{request.itemName}</DialogTitle>
          <DialogDescription>
            {request.type} from {request.customer}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="notes">Notes</Label>
            {isIncoming || isAccepted ? (
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a note for the buyer..."
              />
            ) : (
              <p className="text-sm text-muted-foreground pt-2">
                {notes || "No notes provided."}
              </p>
            )}
          </div>
          <div>
            <h4 className="font-semibold">Date</h4>
            <p className="text-sm text-muted-foreground">{new Date(request.created_at || request.date).toLocaleDateString()}</p>
          </div>
          <div>
            <h4 className="font-semibold">Time</h4>
            <p className="text-sm text-muted-foreground">{new Date(request.created_at || request.date).toLocaleTimeString()}</p>
          </div>
          <div>
            <h4 className="font-semibold">Pincode</h4>
            <p className="text-sm text-muted-foreground">{request.pincode || "N/A"}</p>
          </div>
        </div>
        <DialogFooter>
          {isIncoming ? (
            <Button onClick={() => handleAction('accept')}>Accept</Button>
          ) : isAccepted ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => handleAction('update' as 'accept' | 'update')}>Update</Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 