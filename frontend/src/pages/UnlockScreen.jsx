import { useState } from "react";
import { useVault } from "../context/VaultContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import { Lock, ShieldCheck, KeyRound, Loader2 } from "lucide-react";

export default function UnlockScreen() {
  const { status, unlock, createVault } = useVault();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const isFirstRun = !status.initialized;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!password) return toast.error("Enter your master password");
    setBusy(true);
    try {
      if (isFirstRun) {
        if (password.length < 8) {
          toast.error("Master password must be at least 8 characters");
          setBusy(false);
          return;
        }
        if (password !== confirm) {
          toast.error("Passwords do not match");
          setBusy(false);
          return;
        }
        await createVault(password);
        toast.success("Vault initialized");
      } else {
        await unlock(password);
        toast.success("Vault unlocked");
      }
    } catch (err) {
      console.error(err);
      toast.error(isFirstRun ? "Could not create vault" : "Wrong master password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 grain">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, hsl(41 100% 50% / 0.05), transparent 60%), radial-gradient(circle at 80% 90%, hsl(41 100% 50% / 0.04), transparent 60%), hsl(0 0% 3%)",
        }}
      />

      <div className="w-full max-w-md">
        {/* Brand strip */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 border border-primary flex items-center justify-center rounded-sm">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-mono text-primary tracking-[0.3em] text-xs uppercase">
              vaultkey
            </div>
            <div className="text-muted-foreground text-xs">
              zero-knowledge · local · encrypted
            </div>
          </div>
        </div>

        <div className="border border-border bg-card p-8 rounded-sm">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
                {isFirstRun ? "01 · initialize vault" : "01 · unlock vault"}
              </div>
              <h1 className="font-mono text-3xl font-semibold tracking-tight">
                {isFirstRun ? "Set master key" : "Enter master key"}
                <span className="blink-caret" />
              </h1>
              <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                {isFirstRun
                  ? "This is the only password you will ever memorize. It never leaves your browser. Lose it — lose the vault."
                  : "Decrypt your local vault. Your master password never touches the server."}
              </p>
            </div>
            <Lock className="w-5 h-5 text-primary shrink-0 mt-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label
                htmlFor="master-pw"
                className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
              >
                master password
              </Label>
              <Input
                id="master-pw"
                data-testid="master-password-input"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 h-11 rounded-sm bg-secondary border-border font-mono"
                placeholder="••••••••••••"
              />
            </div>

            {isFirstRun && (
              <div>
                <Label
                  htmlFor="master-pw-confirm"
                  className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground"
                >
                  confirm master password
                </Label>
                <Input
                  id="master-pw-confirm"
                  data-testid="master-password-confirm-input"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-2 h-11 rounded-sm bg-secondary border-border font-mono"
                  placeholder="••••••••••••"
                />
              </div>
            )}

            <Button
              data-testid="unlock-btn"
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono tracking-widest uppercase text-xs"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFirstRun ? (
                <>
                  <KeyRound className="w-4 h-4 mr-2" /> Initialize vault
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 mr-2" /> Unlock
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <div>
                <div className="text-primary mb-1">AES-256</div>
                <div>GCM cipher</div>
              </div>
              <div>
                <div className="text-primary mb-1">PBKDF2</div>
                <div>310k rounds</div>
              </div>
              <div>
                <div className="text-primary mb-1">Local</div>
                <div>flat file</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/70">
          {status.initialized
            ? `vault · ${status.size_bytes || 0} bytes on disk`
            : "no vault detected · create one to begin"}
        </div>
      </div>
    </div>
  );
}