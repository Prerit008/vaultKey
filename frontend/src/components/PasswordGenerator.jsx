import { useState } from "react";
import { Slider } from "./ui/slider";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { generatePassword } from "../lib/passwordGenerator";
import { RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

export default function PasswordGenerator({ onGenerate }) {
  const [length, setLength] = useState(20);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [preview, setPreview] = useState(() =>
    generatePassword({ length: 20, upper: true, lower: true, numbers: true, symbols: true }),
  );

  const regen = () => {
    const p = generatePassword({ length, upper, lower, numbers, symbols });
    setPreview(p);
    return p;
  };

  return (
    <div className="border border-border bg-secondary/40 p-4 rounded-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          password generator
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="pwgen-copy-btn"
            onClick={async () => {
              await navigator.clipboard.writeText(preview);
              toast.success("Password copied", { duration: 1500 });
            }}
            className="p-1.5 border border-border rounded-sm hover:border-primary hover:text-primary transition-colors"
            title="Copy"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            data-testid="pwgen-refresh-btn"
            onClick={regen}
            className="p-1.5 border border-border rounded-sm hover:border-primary hover:text-primary transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="font-mono text-primary text-sm break-all bg-background px-3 py-2 border border-border rounded-sm">
        {preview}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            length
          </span>
          <span className="font-mono text-primary text-sm">{length}</span>
        </div>
        <Slider
          data-testid="pwgen-length-slider"
          value={[length]}
          onValueChange={(v) => setLength(v[0])}
          min={8}
          max={64}
          step={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          ["uppercase", upper, setUpper, "pwgen-upper"],
          ["lowercase", lower, setLower, "pwgen-lower"],
          ["numbers", numbers, setNumbers, "pwgen-numbers"],
          ["symbols", symbols, setSymbols, "pwgen-symbols"],
        ].map(([label, val, set, tid]) => (
          <div
            key={label}
            className="flex items-center justify-between border border-border rounded-sm px-3 py-2"
          >
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
            <Switch data-testid={tid} checked={val} onCheckedChange={set} />
          </div>
        ))}
      </div>

      <Button
        type="button"
        data-testid="pwgen-use-btn"
        onClick={() => {
          const p = regen();
          onGenerate(p);
          toast.success("Password inserted", { duration: 1200 });
        }}
        className="w-full h-9 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 font-mono tracking-widest uppercase text-xs"
      >
        Use this password
      </Button>
    </div>
  );
}