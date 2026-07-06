import { Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { generateTOTPSecret } from "../lib/passwordGenerator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import PasswordGenerator from "./PasswordGenerator";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { useVault } from "../context/VaultContext";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const empty = { title: "", url: "", username: "", password: "", totp_secret: "", notes: "" };

export default function EntryDialog({ open, onOpenChange, entry }) {
  const { addEntry, updateEntry, deleteEntry } = useVault();
  const [enable2FA, setEnable2FA] = useState(false);
  const [form, setForm] = useState(empty);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(entry);

  useEffect(() => {
    if (open) {
      const data = entry ? { ...empty, ...entry } : empty;

      setForm(data);
      setShowPw(false);
      setEnable2FA(Boolean(data.totp_secret));
    }
  }, [open, entry]);


  const handleToggle2FA = (checked) => {
    setEnable2FA(checked);

    if (checked && !form.totp_secret) {
      if (!form.totp_secret) {
        updateField("totp_secret", generateTOTPSecret());
      }
    } else {
      if (window.confirm("Disable 2FA for this entry?")) {
        updateField("totp_secret", "");
        setEnable2FA(false);
      }
    }
  };
  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        url: form.url.trim(),
        username: form.username.trim(),
        password: form.password,
        totp_secret: form.totp_secret.replace(/\s+/g, ""),
        notes: form.notes,
      };
      if (isEdit) {
        await updateEntry(entry.id, payload);
        toast.success("Entry updated");
      } else {
        await addEntry(payload);
        toast.success("Entry saved");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Could not save entry");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!window.confirm(`Delete "${entry.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await deleteEntry(entry.id);
      toast.success("Entry deleted");
      onOpenChange(false);
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-h-full">
      <DialogContent
        data-testid="entry-dialog"
        className="max-w-2xl rounded-sm border-border bg-card p-0"
      >
        <form onSubmit={handleSubmit} className="p-6">
          <DialogHeader className="mb-6">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
              {isEdit ? "edit entry" : "new entry"}
            </div>
            <DialogTitle className="font-mono text-2xl font-semibold tracking-tight">
              {isEdit ? entry.title : "Add credential"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field label="title *">
                <Input
                  data-testid="entry-title-input"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  className="h-10 rounded-sm bg-secondary border-border font-mono"
                  placeholder="GitHub"
                  autoFocus
                />
              </Field>
              <Field label="url">
                <Input
                  data-testid="entry-url-input"
                  value={form.url}
                  onChange={(e) => updateField("url", e.target.value)}
                  className="h-10 rounded-sm bg-secondary border-border font-mono"
                  placeholder="https://github.com"
                />
              </Field>
              <Field label="username / email">
                <Input
                  data-testid="entry-username-input"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  className="h-10 rounded-sm bg-secondary border-border font-mono"
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="password">
                <div className="relative">
                  <Input
                    data-testid="entry-password-input"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    className="h-10 rounded-sm bg-secondary border-border font-mono pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    data-testid="entry-password-toggle"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Password Protection">
                <div className="flex items-center justify-between rounded-sm border border-border bg-secondary px-3 py-3">
                  <div>
                    <p className="font-mono text-sm">
                      Enable 2FA for this password
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Require an authenticator code before viewing or editing.
                    </p>
                  </div>

                  <Switch
                    checked={enable2FA}
                    onCheckedChange={handleToggle2FA}
                  />
                </div>
              </Field>
              <Field label="notes">
                <Textarea
                  data-testid="entry-notes-input"
                  value={form.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="rounded-sm bg-secondary border-border font-mono min-h-[80px]"
                  placeholder="Recovery codes, hints, etc."
                />
              </Field>
            </div>

            <div>
              <PasswordGenerator onGenerate={(pw) => updateField("password", pw)} />
              {enable2FA && (
                <Field label="Authenticator Setup">
                  <div className="rounded-sm border border-border bg-secondary/30 p-5 space-y-2">
                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div className="rounded-sm border border-border bg-white p-3 shadow-sm">
                        <QRCodeSVG
                          value={`otpauth://totp/${encodeURIComponent(
                            form.username || form.title || "Vaultkey"
                          )}?secret=${form.totp_secret}&issuer=Vaultkey`}
                          size={120}
                        />
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-center space-y-1">
                      <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
                        Scan QR Code
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Open your authenticator app and scan this QR code to enable
                        two-factor authentication for this credential.
                      </p>
                    </div>

                    {/* Secret */}
                    <div className="space-y-2">
                      <Label className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                        Manual setup key
                      </Label>

                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={form.totp_secret}
                          className="font-mono text-xs"
                        />

                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            await navigator.clipboard.writeText(form.totp_secret);
                            toast.success("Secret copied");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        If you can't scan the QR code, enter this key manually in your
                        authenticator app.
                      </p>
                    </div>
                  </div>
                </Field>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 flex items-center justify-between sm:justify-between gap-3">
            {isEdit ? (
              <Button
                type="button"
                data-testid="entry-delete-btn"
                onClick={handleDelete}
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-sm font-mono uppercase text-xs tracking-widest"
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                data-testid="entry-cancel-btn"
                onClick={() => onOpenChange(false)}
                className="rounded-sm border-border font-mono uppercase text-xs tracking-widest"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-testid="entry-save-btn"
                disabled={busy}
                className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest"
              >
                {isEdit ? "Save changes" : "Add entry"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
        {label}
      </Label>
      <div className="mt-2">{children}</div>
    </div>
  );
}