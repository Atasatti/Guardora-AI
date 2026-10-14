"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Crown, Loader2, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AdminSummary } from "@/models";
import { addAdmin, listAdmins, removeAdmin } from "@/lib/actions/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Everyone with administrator access. The owner comes from the backend's
// SUPER_ADMIN_EMAIL and is the only one who can add or remove the others.
export default function AdminsPanel({ isOwner }: { isOwner: boolean }) {
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<AdminSummary | null>(
    null
  );
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    const result = await listAdmins();
    if (result.success) {
      setAdmins(result.admins);
      setOwnerEmail(result.ownerEmail);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setAdding(true);
    const result = await addAdmin({ email, name: name || undefined });
    if (result.success) {
      toast.success(result.message);
      setEmail("");
      setName("");
      await load();
    } else {
      toast.error(result.message);
    }
    setAdding(false);
  };

  const handleRemove = async () => {
    if (!pendingRemoval) return;
    setRemoving(true);
    const result = await removeAdmin(pendingRemoval._id);
    if (result.success) {
      toast.success(result.message);
      await load();
    } else {
      toast.error(result.message);
    }
    setRemoving(false);
    setPendingRemoval(null);
  };

  const ownerHasSignedIn = admins.some((admin) => admin.isSuperAdmin);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Administrators</CardTitle>
        <CardDescription>
          Administrators sign in with Google. The owner is set on the server
          and cannot be changed here.
          {!isOwner && " Only the owner can add or remove administrators."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="divide-y rounded-lg border">
            {ownerEmail && !ownerHasSignedIn && (
              <li className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ownerEmail}</p>
                  <p className="text-xs text-muted-foreground">
                    Has not signed in yet
                  </p>
                </div>
                <Badge variant="secondary">
                  <Crown /> Owner
                </Badge>
              </li>
            )}
            {admins.map((admin) => (
              <li key={admin._id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{admin.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {admin.email}
                    {admin.authProvider === "PASSWORD" &&
                      " · also signs in with a password"}
                  </p>
                </div>
                {admin.accountStatus !== "ACTIVE" && (
                  <Badge variant="outline">
                    {admin.accountStatus.toLowerCase()}
                  </Badge>
                )}
                {admin.isSuperAdmin ? (
                  <Badge variant="secondary">
                    <Crown /> Owner
                  </Badge>
                ) : (
                  isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${admin.name} as administrator`}
                      onClick={() => setPendingRemoval(admin)}
                    >
                      <Trash2 />
                    </Button>
                  )
                )}
              </li>
            ))}
            {!ownerEmail && admins.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">
                No administrators yet.
              </li>
            )}
          </ul>
        )}

        {isOwner && (
          <form
            onSubmit={handleAdd}
            className="grid gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="admin-email">Google account email</Label>
              <Input
                id="admin-email"
                type="email"
                required
                placeholder="name@gmail.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={adding}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name (optional)</Label>
              <Input
                id="admin-name"
                placeholder="Used until they first sign in"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={adding}
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? <Loader2 className="animate-spin" /> : <UserPlus />}
              Add administrator
            </Button>
          </form>
        )}
      </CardContent>

      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => !open && setPendingRemoval(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove administrator access?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval?.authProvider === "GOOGLE"
                ? `${pendingRemoval?.name}'s account exists only for administrator access, so it will be deactivated.`
                : `${pendingRemoval?.name} will keep their account as a resident.`}{" "}
              You can add them again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
