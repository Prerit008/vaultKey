import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useVault } from "../context/VaultContext";
import { toast } from "sonner";
import { Download, Upload, KeyRound, Bookmark, Trash2 } from "lucide-react";

// eslint-disable-next-line no-script-url
const BOOKMARKLET = `javascript:(function(){var u=prompt('Username');if(u===null)return;var p=prompt('Password');if(p===null)return;var els=document.querySelectorAll('input');var uSet=false,pSet=false;els.forEach(function(el){var t=(el.type||'').toLowerCase();if(!uSet&&(t==='email'||t==='text'||el.name&&/user|email|login/i.test(el.name))){el.focus();el.value=u;el.dispatchEvent(new Event('input',{bubbles:true}));uSet=true;}else if(!pSet&&t==='password'){el.focus();el.value=p;el.dispatchEvent(new Event('input',{bubbles:true}));pSet=true;}});})();`;

export default function SettingsDialog({ open, onOpenChange }) {
  const { exportEncrypted, importEncrypted, changeMasterPassword, wipeVault, addEntries } = useVault();
  const [busy, setBusy] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [importPw, setImportPw] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  // Simple CSV parser supporting quoted strings
  const parseCSV = (text) => {
    const result = [];
    let row = [];
    let inQuotes = false;
    let currentVal = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal);
        currentVal = '';
      } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
        if (char === '\r') i++;
        row.push(currentVal);
        result.push(row);
        row = [];
        currentVal = '';
      } else {
        if (char !== '\r' || inQuotes) {
          currentVal += char;
        }
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal);
      result.push(row);
    }
    return result;
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const blob = await exportEncrypted();
      const filename = `vaultkey-${new Date().toISOString().slice(0, 10)}.vault`;
      const dataStr =
        "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blob, null, 2));
      const link = document.createElement("a");
      link.setAttribute("href", dataStr);
      link.setAttribute("download", filename);
      link.click();
      toast.success("Encrypted vault exported");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return toast.error("Choose a .vault file");
    if (!importPw) return toast.error("Enter the master password for the file");
    setBusy(true);
    try {
      const text = await importFile.text();
      const blob = JSON.parse(text);
      await importEncrypted(blob, importPw);
      toast.success("Vault imported. Unlock again with the new master password.");
      setImportFile(null);
      setImportPw("");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Import failed — wrong password or corrupt file");
    } finally {
      setBusy(false);
    }
  };

  const handleChangePw = async () => {
    if (newPw.length < 8) return toast.error("Password must be 8+ characters");
    if (newPw !== confirmPw) return toast.error("Passwords do not match");
    setBusy(true);
    try {
      await changeMasterPassword(newPw);
      setNewPw("");
      setConfirmPw("");
      toast.success("Master password changed");
    } catch (e) {
      toast.error("Change failed");
    } finally {
      setBusy(false);
    }
  };

  const handleWipe = async () => {
    if (
      !window.confirm(
        "PERMANENTLY erase the vault file on disk? This cannot be undone. Continue?",
      )
    )
      return;
    setBusy(true);
    try {
      await wipeVault();
      toast.success("Vault wiped");
      onOpenChange(false);
    } catch (e) {
      toast.error("Wipe failed");
    } finally {
      setBusy(false);
    }
  };

  // Re-write handleCsvImport without dynamic import
  const doCsvImport = async () => {
    if (!csvFile) return toast.error("Choose a .csv file");
    setBusy(true);
    try {
      const text = await csvFile.text();
      const rows = parseCSV(text);
      if (rows.length < 2) throw new Error("File empty or missing headers");

      const headers = rows[0].map(h => h.trim().toLowerCase());
      const entries = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < headers.length && row.length <= 1) continue; // skip empty rows

        let title = "";
        let url = "";
        let username = "";
        let password = "";
        let notes = "";

        headers.forEach((header, index) => {
          const val = row[index] || "";
          if (header === "name" || header === "title") title = val;
          else if (header === "url") url = val;
          else if (header === "username" || header === "login") username = val;
          else if (header === "password") password = val;
          else if (header === "note" || header === "notes") notes = val;
        });

        if (!title && url) {
          try {
            title = new URL(url).hostname.replace('www.', '');
          } catch {
            title = url;
          }
        }

        if (password) {
          entries.push({
            title: title || "Imported Entry",
            url,
            username,
            password,
            notes,
            totpSecret: ""
          });
        }
      }

      if (entries.length === 0) {
        toast.error("No valid passwords found in CSV");
        return;
      }

      await addEntries(entries);
      toast.success(`Successfully imported ${entries.length} passwords!`);
      setCsvFile(null);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("CSV import failed: " + e.message);
    } finally {
      setBusy(false);
    }
  };

  const copyBookmarklet = async () => {
    await navigator.clipboard.writeText(BOOKMARKLET);
    toast.success("Bookmarklet copied — paste into a new bookmark's URL", { duration: 3000 });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="settings-dialog"
        className="max-w-2xl rounded-sm border-border bg-card"
      >
        <DialogHeader>
          <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1">
            settings
          </div>
          <DialogTitle className="font-mono text-2xl font-semibold tracking-tight">
            Vault administration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Export/Import */}
          <Section title="backup" icon={<Download className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                data-testid="export-btn"
                onClick={handleExport}
                disabled={busy}
                className="h-10 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest"
              >
                <Download className="w-4 h-4 mr-2" /> Export encrypted (.vault)
              </Button>
              <div className="border border-border rounded-sm p-3 space-y-2">
                <input
                  data-testid="import-file-input"
                  type="file"
                  accept=".vault,.json,application/json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="text-xs font-mono w-full"
                />
                <Input
                  data-testid="import-password-input"
                  type="password"
                  placeholder="Master password of file"
                  value={importPw}
                  onChange={(e) => setImportPw(e.target.value)}
                  className="h-9 rounded-sm bg-secondary border-border font-mono"
                />
                <Button
                  data-testid="import-btn"
                  onClick={handleImport}
                  disabled={busy}
                  variant="outline"
                  className="w-full h-9 rounded-sm border-border font-mono uppercase text-xs tracking-widest"
                >
                  <Upload className="w-4 h-4 mr-2" /> Import & replace
                </Button>
              </div>
            </div>
          </Section>

          {/* Import CSV */}
          <Section title="import csv (chrome / brave)" icon={<Upload className="w-4 h-4" />}>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Import a CSV file exported from Chrome, Brave, Edge, or other password managers.
              Note: 2FA codes (TOTP) are usually not exported by browsers and must be added manually.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                data-testid="import-csv-input"
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="text-xs font-mono flex-1 w-full border border-border p-1.5 rounded-sm"
              />
              <Button
                data-testid="import-csv-btn"
                onClick={doCsvImport}
                disabled={busy || !csvFile}
                className="w-full sm:w-auto h-9 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest shrink-0"
              >
                <Upload className="w-4 h-4 mr-2" /> Import CSV
              </Button>
            </div>
          </Section>

          {/* Change master password */}
          <Section title="change master password" icon={<KeyRound className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                data-testid="new-master-pw-input"
                type="password"
                placeholder="New master password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="h-10 rounded-sm bg-secondary border-border font-mono"
              />
              <Input
                data-testid="new-master-pw-confirm"
                type="password"
                placeholder="Confirm new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="h-10 rounded-sm bg-secondary border-border font-mono"
              />
            </div>
            <Button
              data-testid="change-master-pw-btn"
              onClick={handleChangePw}
              disabled={busy}
              className="mt-3 h-9 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest"
            >
              Re-encrypt with new key
            </Button>
          </Section>

          {/* Bookmarklet */}
          <Section title="autofill bookmarklet" icon={<Bookmark className="w-4 h-4" />}>
            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
              Drag the button below to your bookmarks bar (or copy the code). On any login
              page, click the bookmark, then paste your username & password when prompted.
              Zero-knowledge: nothing touches the network.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                data-testid="bookmarklet-link"
                href={BOOKMARKLET}
                onClick={(e) => e.preventDefault()}
                className="inline-block px-4 py-2 border border-primary text-primary font-mono uppercase text-xs tracking-widest rounded-sm hover:bg-primary hover:text-primary-foreground transition-colors cursor-grab"
              >
                <Bookmark className="w-4 h-4 inline mr-2" />
                Vaultkey Autofill
              </a>
              <Button
                data-testid="copy-bookmarklet-btn"
                variant="outline"
                onClick={copyBookmarklet}
                className="h-9 rounded-sm border-border font-mono uppercase text-xs tracking-widest"
              >
                Copy code
              </Button>
            </div>
          </Section>

          {/* Danger zone */}
          <Section title="danger zone" icon={<Trash2 className="w-4 h-4 text-destructive" />}>
            <p className="text-sm text-muted-foreground mb-3">
              Delete the encrypted vault file from disk permanently.
            </p>
            <Button
              data-testid="wipe-vault-btn"
              onClick={handleWipe}
              disabled={busy}
              variant="outline"
              className="h-9 rounded-sm border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground font-mono uppercase text-xs tracking-widest"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Wipe vault file
            </Button>
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="border border-border rounded-sm p-4 bg-secondary/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-primary">{icon}</div>
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

