import { useMemo, useState } from "react";
import { useVault } from "../context/VaultContext";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import EntryCard from "../components/EntryCard";
import EntryDialog from "../components/EntryDialog";
import SettingsDialog from "../components/SettingsDialog";
import {
  Search,
  Plus,
  Lock,
  Settings2,
  ShieldCheck,
  Database,
} from "lucide-react";

export default function Dashboard() {
  const { vault, lock, status } = useVault();
  const [query, setQuery] = useState("");
  const [entryOpen, setEntryOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const filtered = useMemo(() => {
    const entries = vault?.entries ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.title, e.url, e.username, e.notes].some((f) =>
        (f || "").toLowerCase().includes(q),
      ),
    );
  }, [vault?.entries, query]);

  const openNew = () => {
    setEditing(null);
    setEntryOpen(true);
  };
  const openEdit = (e) => {
    setEditing(e);
    setEntryOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border sticky top-0 z-30 backdrop-blur-md bg-background/80">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-primary flex items-center justify-center rounded-sm">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-mono text-primary tracking-[0.3em] text-xs uppercase">
                vaultkey
              </div>
              <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                unlocked · zero-knowledge
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              data-testid="open-settings-btn"
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="rounded-sm border-border font-mono uppercase text-xs tracking-widest"
            >
              <Settings2 className="w-4 h-4 mr-2" /> Settings
            </Button>
            <Button
              data-testid="lock-btn"
              variant="outline"
              size="sm"
              onClick={lock}
              className="rounded-sm border-border font-mono uppercase text-xs tracking-widest"
            >
              <Lock className="w-4 h-4 mr-2" /> Lock
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">
              02 · your vault
            </div>
            <h1 className="font-mono text-4xl sm:text-5xl font-semibold tracking-tight">
              {vault?.entries.length} <span className="text-muted-foreground">credentials</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                data-testid="search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search title, user, url…"
                className="pl-9 h-10 rounded-sm bg-secondary border-border font-mono text-sm"
              />
            </div>
            <Button
              data-testid="add-entry-btn"
              onClick={openNew}
              className="h-10 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest"
            >
              <Plus className="w-4 h-4 mr-2" /> New
            </Button>
          </div>
        </div>

        {/* Grid header row (desktop) */}
        {filtered.length > 0 && (
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 border-b border-border font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            <div className="col-span-3">service</div>
            <div className="col-span-3">username</div>
            <div className="col-span-3">password</div>
            <div className="col-span-2">2fa</div>
            <div className="col-span-1 text-right">edit</div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState hasQuery={Boolean(query)} onAdd={openNew} />
        ) : (
          <div className="mt-2 space-y-2">
            {filtered.map((e) => (
              <EntryCard key={e.id} entry={e} onEdit={openEdit} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span>flat file · {status.size_bytes || 0} bytes on disk</span>
          </div>
          <div>aes-256-gcm · pbkdf2-sha256 · 310k rounds</div>
        </div>
      </main>

      <EntryDialog open={entryOpen} onOpenChange={setEntryOpen} entry={editing} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

function EmptyState({ hasQuery, onAdd }) {
  return (
    <div className="border border-dashed border-border rounded-sm py-20 text-center">
      <div className="font-mono text-primary text-xs tracking-[0.3em] uppercase mb-3">
        {hasQuery ? "no matches" : "empty vault"}
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        {hasQuery
          ? "Nothing matches your search."
          : "Add your first credential to get started."}
      </p>
      {!hasQuery && (
        <Button
          data-testid="empty-add-entry-btn"
          onClick={onAdd}
          className="rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono uppercase text-xs tracking-widest"
        >
          <Plus className="w-4 h-4 mr-2" /> Add entry
        </Button>
      )}
    </div>
  );
}