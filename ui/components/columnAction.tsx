'use client'

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { 
  EyeIcon, 
  PencilIcon, 
  TrashIcon, 
  MoreHorizontal,
  Loader2
} from "lucide-react"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader,
  DialogTitle 
} from "./ui/dialog"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { ROLES } from "@/lib/types"

interface ColumnActionsProps<T> {
  item: {
    name: string
    item: T
    link: {
      view: string
      edit: string
    }
    role: {
      view: ROLES[]
      edit?: ROLES[]
      remove?: ROLES[]
    }
  }
  removeAction: (item: T) => Promise<boolean>
  className?: string
}

export function ColumnActions<T>({
  item,
  removeAction,
  className = ""
}: ColumnActionsProps<T>) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const success = await removeAction(item.item)
      if (success) {
        toast.success(`${item.name} deleted successfully`)
      } else {
        toast.error(`Failed to delete ${item.name}`)
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("An error occurred while deleting")
    } finally {
      setIsDeleting(false)
      setOpenDeleteDialog(false)
    }
  }

  const actionItems = [
    {
      id: 'view',
      label: 'View',
      icon: <EyeIcon className="h-4 w-4" />,
      href: item.link.view,
      roles: item.role.view,
      variant: 'ghost' as const,
      className: 'hover:bg-blue-50 text-blue-600 hover:text-blue-700',
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: <PencilIcon className="h-4 w-4" />,
      href: item.link.edit,
      roles: item.role.edit ?? [ROLES.SUPERADMIN, ROLES.ADMIN],
      variant: 'ghost' as const,
      className: 'hover:bg-amber-50 text-amber-600 hover:text-amber-700',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <TrashIcon className="h-4 w-4" />,
      onClick: () => setOpenDeleteDialog(true),
      roles: item.role.remove ?? [ROLES.SUPERADMIN],
      variant: 'ghost' as const,
      className: 'hover:bg-red-50 text-red-600 hover:text-red-700',
    },
  ]

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* Desktop View - Always Visible Buttons */}
      <div className="hidden md:flex items-center gap-1">
        {actionItems.map((action) => (
          <motion.div
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative"
          >
            {action.href ? (
              <Link href={action.href} className="block">
                <Button
                  variant={action.variant}
                  size="icon"
                  className={`h-8 w-8 rounded-full ${action.className}`}
                  title={action.label}
                  data-roles={action.roles}
                >
                  {action.icon}
                  <span className="sr-only">{action.label}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant={action.variant}
                size="icon"
                className={`h-8 w-8 rounded-full ${action.className}`}
                onClick={action.onClick}
                title={action.label}
                data-roles={action.roles}
              >
                {action.icon}
                <span className="sr-only">{action.label}</span>
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Mobile View - Dropdown Menu */}
      <div className="md:hidden">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {actionItems.map((action) => (
              <DropdownMenuItem
                key={action.id}
                className={`flex items-center gap-2 ${action.id === 'delete' ? 'text-red-600' : ''}`}
                onSelect={action.onClick || (() => {})}
                data-roles={action.roles}
              >
                {action.icon}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delete {item.name}?
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              This action cannot be undone. This will permanently delete {item.name}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpenDeleteDialog(false)}
              className="px-4"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}