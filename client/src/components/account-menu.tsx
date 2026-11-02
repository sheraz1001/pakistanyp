import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Globe, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

async function logout() {
  try {
    const response = await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = response.ok ? "/" : "/api/logout";
  } catch {
    window.location.href = "/api/logout";
  }
}

function initialsOf(user: any) {
  const s = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;
  return (s || user?.email?.[0] || "U").toUpperCase();
}

/** Avatar button with the account menu, used in the owner and admin top bars. */
export function AccountMenu({ tone = "green" }: { tone?: "green" | "tint" }) {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open account menu"
          title={user?.email || undefined}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-full text-sm font-semibold",
            tone === "green" ? "bg-[#0B6B2E] text-white" : "bg-[#E8F4EC] text-[#05501F]",
          )}
        >
          {initialsOf(user)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {(name || user?.email) && (
          <div className="flex flex-col gap-1 p-2">
            {name && <p className="font-semibold text-[#0A0A0A]">{name}</p>}
            {user?.email && <p className="truncate text-sm text-[#5B6475]">{user.email}</p>}
          </div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          <Building2 className="me-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/admin-enhanced")}>
          <Shield className="me-2 h-4 w-4" />
          Admin Panel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/")}>
          <Globe className="me-2 h-4 w-4" />
          View site
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="me-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AccountMenu;
