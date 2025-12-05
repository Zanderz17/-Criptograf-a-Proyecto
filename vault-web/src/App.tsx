import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import SetupMaster from "@/pages/SetupMaster";
import Unlock from "@/pages/Unlock";
import VaultList from "@/pages/VaultList";
import VaultCreate from "@/pages/VaultCreate";
import { useVault } from "@/state/useVault";

function RequireOpened({ children }: { children: React.ReactElement }) {
  const status = useVault((s) => s.status);
  if (status !== "opened") return <Navigate to="/unlock" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-svh grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/setup-master" element={<SetupMaster />} />
          <Route path="/unlock" element={<Unlock />} />

          {/* protegidas */}
          <Route
            path="/vault"
            element={
              <RequireOpened>
                <VaultList />
              </RequireOpened>
            }
          />
          <Route
            path="/vault/new"
            element={
              <RequireOpened>
                <VaultCreate />
              </RequireOpened>
            }
          />
        </Routes>
      </div>
    </div>
  );
}
