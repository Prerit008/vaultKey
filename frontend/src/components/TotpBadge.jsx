import { Lock } from "lucide-react";

export default function TotpBadge() {
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 bg-secondary text-primary rounded-sm w-fit border border-primary/20"
      title="2FA Protected"
    >
      <Lock className="w-3.5 h-3.5" />
      <span className="font-mono text-[10px] tracking-wider uppercase font-semibold">
        2FA Protected
      </span>
    </div>
  );
}