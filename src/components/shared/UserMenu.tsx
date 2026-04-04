"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@prisma/client";
import { UserRound } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

export function UserMenu({
  email,
  role,
}: {
  email: string | null | undefined;
  role: Role;
}) {
  const dash =
    role === "CUSTOMER"
      ? "/customer/dashboard"
      : role === "VENDOR"
        ? "/vendor/dashboard"
        : "/admin/dashboard";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 max-w-[200px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-800 hover:border-accent"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface">
            <UserRound className="h-4 w-4" />
          </span>
          <span className="truncate">{email ?? "Account"}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href={dash}>Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-danger focus:text-danger"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
