import "./App.css";
import { Toaster } from "sonner";
import { VaultProvider, useVault } from "./context/VaultContext";
import UnlockScreen from "./pages/UnlockScreen";
import Dashboard from "./pages/Dashboard";
import { Loader2 } from "lucide-react";

function Shell() {
  const { status, unlocked } = useVault();

  if (status.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return unlocked ? <Dashboard /> : <UnlockScreen />;
}

export default function App() {
  return (
    <div className="App dark">
      <VaultProvider>
        <Shell />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: "hsl(0 0% 6%)",
              color: "hsl(0 0% 98%)",
              border: "1px solid hsl(0 0% 15%)",
              borderRadius: "2px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "12px",
            },
          }}
        />
      </VaultProvider>
    </div>
  );
}