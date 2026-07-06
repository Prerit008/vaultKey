import { useState } from "react";
import { Copy, Eye, EyeOff, Pencil, Globe, User, ShieldAlert } from "lucide-react";
import TotpBadge from "./TotpBadge";
import { toast } from "sonner";
import { verifyTOTP } from "../lib/totp";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export default function EntryCard({ entry, onEdit }) {
  const [reveal, setReveal] = useState(false);
  const [unlocked2FA, setUnlocked2FA] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'reveal' | 'copy' | 'edit'
  const [totpInput, setTotpInput] = useState("");
  const [verifying, setVerifying] = useState(false);

  const copy = async (text, label) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`, { duration: 1200 });
  };

  const domain = (() => {
    try {
      return entry.url ? new URL(entry.url).host : null;
    } catch {
      return entry.url || null;
    }
  })();

  const needs2FA = Boolean(entry.totp_secret && !unlocked2FA);



  const handleProtectedAction = (action) => {
    if (needs2FA) {
      setPendingAction(action);
      setTotpInput("");
      setShowPrompt(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action) => {
    switch (action) {
      case "reveal":
        setReveal((r) => !r);
        break;

      case "copy":
        copy(entry.password, "Password");
        break;

      case "edit":
        onEdit(entry);
        break;

      default:
        break;
    }
  };
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!totpInput.trim()) return;
    setVerifying(true);
    try {
      const isValid = await verifyTOTP(entry.totp_secret, totpInput.replace(/\s+/g, ""));
      if (isValid) {
        setUnlocked2FA(true);
        setShowPrompt(false);
        toast.success("2FA verified");
        executeAction(pendingAction);
      } else {
        toast.error("Invalid 2FA code");
      }
    } catch (err) {
      toast.error("Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div
        data-testid={`entry-card-${entry.id}`}
        className="group border border-border bg-card hover:border-primary/60 transition-colors rounded-sm"
      >
        <div className="grid grid-cols-12 gap-4 items-center px-4 py-3">
          {/* Title / URL */}
          <div className="col-span-12 md:col-span-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 border border-border rounded-sm flex items-center justify-center bg-secondary shrink-0">
                <span className="font-mono text-primary text-sm">
                  {(entry.title || "?").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <div className="font-mono font-semibold truncate">{entry.title}</div>
                {domain && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">{domain}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="col-span-6 md:col-span-3 min-w-0">
            <button
              data-testid={`copy-username-${entry.id}`}
              type="button"
              onClick={() => copy(entry.username, "Username")}
              className="flex items-center gap-2 min-w-0 hover:text-primary transition-colors group/uc w-full text-left"
              title="Copy username"
            >
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-mono text-sm truncate">
                {entry.username || <span className="text-muted-foreground">—</span>}
              </span>
              <Copy className="w-3 h-3 opacity-0 group-hover/uc:opacity-100 text-muted-foreground ml-auto" />
            </button>
          </div>

          {/* Password */}
          <div className="col-span-6 md:col-span-3 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm truncate flex-1">
                {entry.password ? (
                  needs2FA ? (
                    <span className="text-primary/70 flex items-center gap-1 text-xs uppercase tracking-widest font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5" /> Locked
                    </span>
                  ) : reveal ? (
                    entry.password
                  ) : (
                    "•".repeat(Math.min(12, entry.password.length))
                  )
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
              <button
                type="button"
                data-testid={`reveal-password-${entry.id}`}
                onClick={() => handleProtectedAction("reveal")}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-sm"
                title={needs2FA ? "Unlock to Reveal" : reveal ? "Hide" : "Reveal"}
              >
                {needs2FA || !reveal ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                data-testid={`copy-password-${entry.id}`}
                onClick={() => handleProtectedAction("copy")}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-sm"
                title={needs2FA ? "Unlock to Copy" : "Copy password"}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TOTP */}
          <div className="col-span-8 md:col-span-2">
            {entry.totp_secret ? (
              <TotpBadge />
            ) : (
              <span className="font-mono text-xs text-muted-foreground/60 tracking-widest">
                no 2fa
              </span>
            )}
          </div>

          {/* Edit */}
          <div className="col-span-4 md:col-span-1 flex justify-end">
            <button
              type="button"
              data-testid={`edit-entry-${entry.id}`}
              onClick={() => handleProtectedAction("edit")}
              className="p-2 border border-border hover:border-primary hover:text-primary rounded-sm transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2FA Prompt Dialog */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-sm rounded-sm border-border bg-card p-6">
          <form onSubmit={handleVerify2FA}>
            <DialogHeader className="mb-6">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Security
              </div>
              <DialogTitle className="font-mono text-xl font-semibold tracking-tight">
                2FA Required
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground font-mono">
                Enter the 6-digit code from your authenticator app to unlock this password.
              </p>
              <div>
                <Input
                  autoFocus
                  data-testid="totp-prompt-input"
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value)}
                  className="h-12 rounded-sm bg-secondary border-border font-mono text-center text-xl tracking-[0.2em]"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPrompt(false)}
                className="rounded-sm border-border font-mono uppercase text-xs tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={verifying || totpInput.length < 6}
                className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest"
              >
                Verify
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}