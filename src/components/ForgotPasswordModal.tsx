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

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onContinue: (username: string) => void;
}

export function ForgotPasswordModal({ isOpen, onOpenChange, onContinue }: ForgotPasswordModalProps) {
  const [username, setUsername] = useState("");

  const handleContinue = () => {
    onContinue(username);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Forgot Password</DialogTitle>
          <DialogDescription>
            Enter your username and we'll help you reset your password.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              className="col-span-3"
              placeholder="your_username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleContinue}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 