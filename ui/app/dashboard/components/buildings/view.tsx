'use client'
import { usePropertyStore } from "@/lib/store/property";
import { Building, ROLES } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { DataTable } from "./rooms/data-table";
import { columns } from "./rooms/columns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useStore } from "@/lib/store";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string(),
  noOfFloors: z.coerce.number().min(1, "Number of floors is required"),
  noOfBasements: z.coerce.number().min(0, "Number of basements is required"),
});

export default function ViewBuilding() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [building, setBuilding] = useState<Building | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchBuilding, createBuilding, updateBuilding, deleteBuilding } = usePropertyStore();

  const { user } = useStore()

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      noOfFloors: 1,
      noOfBasements: 0,
    },
  });

  useEffect(() => {
    if (!user) return
    
    const id = Number(searchParams.get("id"));
    if (!id) {
      if (searchParams.get("create") === "true") {
        setCreating(true);
      }
      return;
    }

    fetchBuilding(id)
      .then((data) => {
        if (data == null) {
          router.push(`/dashboard/buildings`);
        } else {
          setBuilding(data);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error("Failed to fetch building");
      });
  }, [fetchBuilding, searchParams, router, user]);

  useEffect(() => {
    if (!building) return;

    form.reset({
      name: building.name,
      address: building.address ?? "",
      noOfFloors: building.noOfFloors,
      noOfBasements: building.noOfBasements,
    });
  }, [building, form]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (creating) {
      createBuilding(values)
        .then((data) => {
          if (data) {
            router.push(`/dashboard/buildings?message=Building created successfully`);
          } else {
            toast.error("Failed to create building");
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("Failed to create building");
        });
    } else if (editing && building) {
      updateBuilding({ ...values, id: building.id })
        .then((data) => {
          if (data == null) {
            toast.error("Failed to update building");
            return;
          }
          setBuilding({ ...building, ...values });
          toast.success("Building updated successfully");
          setEditing(false);
        })
        .catch((error) => {
          console.log(error);
          toast.error("Failed to update building");
        });
    }
  };

  const handleDelete = () => {
    if (!building?.id) return;
    deleteBuilding(building.id)
      .then((data) => {
        if (data) {
          router.push(`/dashboard/buildings?message=Building deleted successfully`);
        } else {
          toast.error("Failed to delete building");
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error("Failed to delete building");
      });
  };

  return !creating && !building ? (
    <div className="container mx-auto py-8 text-center">
      <Label className="text-xl font-semibold text-gray-600">Loading...</Label>
    </div>
  ) : (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/buildings">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {creating ? "Create Building" : editing ? "Edit Building" : "View Building"}
          </h1>
        </div>
        <div className="flex items-center gap-2" data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}>
          <Button
            onClick={() => {
              if (!creating && !editing) {
                setEditing(true);
              } else {
                form.handleSubmit(handleSubmit)();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? "Create" : editing ? "Save Changes" : "Edit"}
          </Button>
          <Button
            variant={creating || editing ? "outline" : "destructive"}
            onClick={() => {
              if (creating) {
                router.push("/dashboard/buildings");
              } else if (editing) {
                setEditing(false);
                form.reset({
                  name: building?.name ?? "",
                  address: building?.address ?? "",
                  noOfFloors: building?.noOfFloors ?? 1,
                  noOfBasements: building?.noOfBasements ?? 0,
                });
              } else {
                setOpenDeleteDialog(true);
              }
            }}
          >
            {creating ? "Cancel" : editing ? "Cancel" : "Delete"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent>
            <DialogTitle>Delete Building</DialogTitle>
            <DialogDescription>Are you sure you want to delete this building?</DialogDescription>
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

        <Card className="border-none shadow-md rounded-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Building Details</h2>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Building Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter building name"
                          readOnly={!creating && !editing}
                          className={cn(
                            "border-gray-200 rounded-md shadow-sm transition-all",
                            !creating && !editing
                              ? "bg-gray-100 opacity-70 cursor-not-allowed"
                              : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter address"
                          readOnly={!creating && !editing}
                          className={cn(
                            "border-gray-200 rounded-md shadow-sm transition-all",
                            !creating && !editing
                              ? "bg-gray-100 opacity-70 cursor-not-allowed"
                              : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noOfFloors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Number of Floors</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter number of floors"
                          readOnly={!creating && !editing}
                          className={cn(
                            "border-gray-200 rounded-md shadow-sm transition-all",
                            !creating && !editing
                              ? "bg-gray-100 opacity-70 cursor-not-allowed"
                              : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="noOfBasements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Number of Basements</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter number of basements"
                          readOnly={!creating && !editing}
                          className={cn(
                            "border-gray-200 rounded-md shadow-sm transition-all",
                            !creating && !editing
                              ? "bg-gray-100 opacity-70 cursor-not-allowed"
                              : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          )}
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </CardContent>
        </Card>

        {!creating && building && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Rooms</h2>
              <Link href={`/dashboard/rooms/view?create=true&buildingId=${building.id}`}>
                <Button data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]} className="bg-blue-600 hover:bg-blue-700">Add Room</Button>
              </Link>
            </div>
            <Card className="border-none shadow-md rounded-lg">
              <CardContent className="pt-6">
                <DataTable columns={columns} data={building.rooms || []} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}