"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { useSession } from "@/lib/auth-client";
import { signOutAction } from "../../app/auth/actions";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { name, email, image } = session.user;
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (email?.[0]?.toUpperCase() ?? "U");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="justify-start gap-2 h-9 text-muted-foreground hover:text-foreground"
        >
          {image ? (
            <Image
              src={image}
              alt={name ?? "User"}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center shrink-0">
              <span className="text-[10px] font-semibold">{initials}</span>
            </div>
          )}
          <span className="text-sm truncate flex-1 text-left">
            {name ?? email}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            {name && <span className="text-sm font-medium">{name}</span>}
            <span className="text-xs text-muted-foreground truncate">
              {email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="gap-2 text-sm cursor-pointer text-destructive focus:text-destructive"
          onClick={async () => await signOutAction()}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
