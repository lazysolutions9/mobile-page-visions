import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/use-toast";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: any; // We need the user to know whose password to update
}

export function ChangePasswordModal({ isOpen, onOpenChange, user }: ChangePasswordModalProps) {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (!newPassword) {
      toast({ title: "Error", description: "Password cannot be empty.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Error", description: "User not found. Please log in again.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('user')
      .update({ password: newPassword })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating password:', error);
      toast({ title: "Error", description: "Could not update password. Please try again.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Your password has been changed." });
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your new password below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-password" className="text-right">
              New Password
            </Label>
            <Input id="new-password" type="password" className="col-span-3" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-right">
              Confirm
            </Label>
            <Input id="confirm-password" type="password" className="col-span-3" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleUpdatePassword}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 