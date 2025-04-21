/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "./ui/dialog";

export function ColumnActions<T>({
  item,
  removeAction,
}: {
  item: {
		name: string
		item: T
		link: {
			view: string
			edit: string
		}
	}
  removeAction: (...args: any) => Promise<boolean>
}) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDelete = () => {
    removeAction(item)
      .then((success) => {
        if (success) {
          toast.success(`${item.name} deleted successfully`);
        } else {
          toast.error(`Failed to delete ${item.name}`);
        }
        setOpenDeleteDialog(false);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Failed to delete");
        setOpenDeleteDialog(false);
      });
  };

  return (
    <div className="flex gap-2 px-4 w-auto">
      <Link href={item.link.view}>
        <Button
          variant="outline"
          size="sm"
          className="text-xs px-3 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600"
        >
          <EyeIcon className="h-4 w-4 mr-1" /> View
        </Button>
      </Link>
      <Link href={item.link.edit}>
        <Button
          variant="outline"
          size="sm"
          className="text-xs px-3 text-gray-600 hover:bg-blue-600 hover:text-white hover:border-blue-600"
        >
          <PencilIcon className="h-4 w-4 mr-1" /> Edit
        </Button>
      </Link>
      <Button
        variant="outline"
        size="sm"
        className="text-xs px-3 text-gray-600 hover:bg-red-600 hover:text-white hover:border-red-600"
        onClick={() => setOpenDeleteDialog(true)}
      >
        <TrashIcon className="h-4 w-4 mr-1" /> Delete
      </Button>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogTitle>Delete {item.name}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {item.name}?
          </DialogDescription>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete}>
              Yes
            </Button>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              No
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};