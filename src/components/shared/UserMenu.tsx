"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Role } from "@prisma/client";
import { UserRound } from "lucide-react";
import { signOut } from "next-auth/react";

export function UserMenu({
  email,
  role,
  triggerVariant = "card",
}: {
  email: string | null | undefined;
  role: Role;
  /** `toolbar`: icon on colored header (matches admin Settings control). `card`: bordered pill on white headers. */
  triggerVariant?: "card" | "toolbar";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className={cn(
            triggerVariant === "toolbar" &&
              "rounded p-1 transition-colors hover:bg-white/15 hover:text-white outline-none",
            triggerVariant === "card" &&
              "inline-flex h-10 max-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 hover:border-accent outline-none",
          )}
        >
          {triggerVariant === "toolbar" ? (
            <UserRound className="h-5 w-5 stroke-[2.5] text-white" />
          ) : (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface">
              <UserRound className="h-4 w-4" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <span className="flex flex-col items-start gap-0.5">
          <span className="text-md font-bold uppercase tracking-wide text-primary">
              {role.replace(/_/g, " ")}
            </span>
            <span className="text-sm font-medium text-slate-500">{email ?? "Account"}</span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-danger focus:text-danger flex items-center gap-2"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
