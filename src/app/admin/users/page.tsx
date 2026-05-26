import { requireAdmin } from "@/app/actions/auth";
import { listUsers } from "@/lib/repo";
import { ToggleAdminButton } from "@/components/toggle-admin-button";
import { DeleteUserButton } from "@/components/delete-user-button";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await requireAdmin();
  const users = await listUsers();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin · Users</h1>
      <ul className="divide-y divide-zinc-800 border border-zinc-800 rounded-lg">
        {users.map((u) => (
          <li
            key={u.id}
            className="px-3 py-2 flex items-center justify-between text-sm"
          >
            <div>
              <div className="font-medium">
                {u.name}
                {u.isAdmin && (
                  <span className="ml-2 text-xs text-fuchsia-300">admin</span>
                )}
              </div>
              <div className="text-xs text-zinc-500">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <ToggleAdminButton
                userId={u.id}
                isAdmin={u.isAdmin}
                disabled={u.id === me.id}
              />
              <DeleteUserButton
                userId={u.id}
                userName={u.name}
                disabled={u.id === me.id}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
