'use client'

import { Badge } from "@/components/ui/badge"
import { ColumnActions } from "@/components/columnAction"
import { ColumnDef } from "@tanstack/react-table"
import { ROLES, User } from "@/lib/types"
import { useUserStore } from "@/lib/store/users"

const UserActions = ({ user }: { user: User }) => {
  const { deleteUser } = useUserStore()

  const handleDelete = async () => {
    try {
      await deleteUser(user.id)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="flex justify-end">
      <ColumnActions
        removeAction={handleDelete}
        item={{
          item: user,
          name: "User",
          link: {
            view: `/dashboard/users/view?id=${user.id}`,
            edit: `/dashboard/users/view?id=${user.id}&edit=true`,
          },
          role: {
            view: Object.values(ROLES),
            edit: [ROLES.SUPERADMIN, ROLES.ADMIN],
            remove: [ROLES.SUPERADMIN],
          }
        }}
      />
    </div>
  )
}

const getRoleBadge = (role: ROLES) => {
  const roleColors = {
    [ROLES.SUPERADMIN]: "bg-purple-100 text-purple-800",
    [ROLES.ADMIN]: "bg-blue-100 text-blue-800",
    [ROLES.BUILDING_ADMIN]: "bg-green-100 text-green-800",
    [ROLES.FINANCE_ADMIN]: "bg-yellow-100 text-yellow-800",
    [ROLES.BOARD_MEMBER]: "bg-indigo-100 text-indigo-800",
    [ROLES.TENANT]: "bg-gray-100 text-gray-800",
    [ROLES.EMPTY]: "bg-gray-100 text-gray-800",
  };

  return (
    <Badge className={`${roleColors[role] || "bg-gray-100"} capitalize`}>
      {role.toLowerCase().replace(/_/g, " ")}
    </Badge>
  );
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => row.original.name,
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => getRoleBadge(row.original.role),
  },
  {
    id: "actions",
    cell: ({ row }) => <UserActions user={row.original} />,
  },
]