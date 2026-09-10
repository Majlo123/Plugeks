"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OdjavaDugme() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await fetch("/api/admin", { method: "DELETE" });
        router.replace("/admin");
        router.refresh();
      }}
    >
      <LogOut className="h-4 w-4" />
      Odjavi se
    </Button>
  );
}
