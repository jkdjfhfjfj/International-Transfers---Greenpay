import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string, authenticatorCode?: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  requiresPin?: boolean;
  requiresAuthenticator?: boolean;
}

export function PINModal({
  isOpen,
  onClose,
  onSuccess,
  isLoading = false,
  title = "Enter PIN",
  description = "Enter your 4-digit PIN to complete this transaction",
  requiresPin = true,
  requiresAuthenticator = false,
}: PINModalProps) {
  const [pin, setPin] = useState("");
  const [authenticatorCode, setAuthenticatorCode] = useState("");
  const [method, setMethod] = useState<"pin" | "authenticator">(requiresPin ? "pin" : "authenticator");
  const { toast } = useToast();

  useEffect(() => {
    setMethod(requiresPin ? "pin" : "authenticator");
  }, [requiresPin, requiresAuthenticator]);

  const handleSubmit = () => {
    if (method === "pin" && pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    if (method === "pin" && !/^\d{4}$/.test(pin)) {
      toast({
        title: "Invalid PIN",
        description: "PIN must contain only numbers",
        variant: "destructive",
      });
      return;
    }

    if (method === "authenticator" && !/^\d{6}$/.test(authenticatorCode)) {
      toast({
        title: "Authenticator code required",
        description: "Enter the current 6-digit code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    onSuccess(method === "pin" ? pin : "", method === "authenticator" ? authenticatorCode : undefined);
    setPin("");
    setAuthenticatorCode("");
  };

  const handleClose = () => {
    setPin("");
    setAuthenticatorCode("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="z-[220] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>

          {requiresPin && requiresAuthenticator && (
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={method === "pin" ? "default" : "outline"} onClick={() => setMethod("pin")}>
                PIN
              </Button>
              <Button type="button" variant={method === "authenticator" ? "default" : "outline"} onClick={() => setMethod("authenticator")}>
                Authenticator
              </Button>
            </div>
          )}

          {method === "pin" && requiresPin && (
            <Input
              type="password"
              inputMode="numeric"
              placeholder="••••"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ""))}
              onPaste={(e) => {
                e.preventDefault();
                setPin(e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 4));
              }}
              className="text-center text-2xl tracking-widest"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
              autoFocus
            />
          )}

          {method === "authenticator" && requiresAuthenticator && (
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit authenticator code"
              maxLength={6}
              value={authenticatorCode}
              onChange={(e) => setAuthenticatorCode(e.target.value.replace(/[^0-9]/g, ""))}
              onPaste={(e) => {
                e.preventDefault();
                setAuthenticatorCode(e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6));
              }}
              className="text-center tracking-widest"
            />
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={(method === "pin" && pin.length !== 4) || (method === "authenticator" && authenticatorCode.length !== 6) || isLoading}
              className="flex-1"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
