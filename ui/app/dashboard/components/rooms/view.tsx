'use client'
import { usePropertyStore } from "@/lib/store/property";
import { ROLES, Room } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  floorNumber: z.string().min(1, "Floor number is required"),
  buildingId: z.coerce.number().min(1, "Building is required"),
  sizeInSquareMeters: z.coerce.number().min(0, "Size in square meters is required"),
  purpose: z.string().optional(),
});

export default function ViewRoom() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchRoom, createRoom, updateRoom, deleteRoom, buildings, fetchBuildings } = usePropertyStore();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      floorNumber: "",
      buildingId: -1,
      sizeInSquareMeters: 0,
      purpose: "",
    },
  });

  const buildingId = form.watch("buildingId");

  const selectedBuilding = useMemo(() => {
    if (creating && buildingId !== null) return buildings.find((b) => b.id === buildingId);
    if (!room?.buildingId || !buildings.length) return null;
    return buildings.find((b) => b.id === room.buildingId);
  }, [room?.buildingId, buildings, creating, buildingId]);

  const selectedBuildingFloors = useMemo(() => {
    if (!buildingId || buildingId <= 0 || !buildings.length) return [];
    const building = buildings.find((b) => b.id === Number(buildingId));
    return building?.floors || [];
  }, [buildingId, buildings]);

  const isBuildingSelected = useMemo(() => {
    return buildingId > 0;
  }, [buildingId]);

  useEffect(() => {
    const id = Number(searchParams.get("id"));
    const buildingId = Number(searchParams.get("buildingId"));

    if (!buildings.length) {
      fetchBuildings();
    }

    if (buildingId) {
      const building = buildings.find((b) => b.id === buildingId);
      if (building) {
        form.setValue("buildingId", building.id);
      }
    }

    if (id) {
      fetchRoom(id)
        .then((data) => {
          if (data == null) {
            router.push(`/dashboard/rooms`);
          } else {
            setRoom(data);
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("Failed to fetch room");
        });
    }
  }, [fetchRoom, searchParams, router, form, buildings, fetchBuildings]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    if (!room) return;
    console.log(room)
    form.reset({
      name: room.name,
      floorNumber: room.floorNumber,
      buildingId: Number(room.buildingId),
      sizeInSquareMeters: room.sizeInSquareMeters,
      purpose: room.purpose ?? "",
    });
  }, [room, form]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (creating) {
      createRoom({
        ...values,
        occupied: false,
      })
        .then((data) => {
          if (data) {
            router.push(`/dashboard/rooms?message=Room created successfully`);
          } else {
            toast.error("Failed to create room");
          }
        })
        .catch((error) => {
          console.log(error);
          toast.error("Failed to create room");
        });
    } else if (editing && room) {
      updateRoom({
        ...values,
        id: room.id,
      })
        .then((data) => {
          if (data == null) {
            toast.error("Failed to update room");
            return;
          }
          setRoom({
            ...room,
            ...values,
            occupied: room.occupied,
          });
          toast.success("Room updated successfully");
          setEditing(false);
        })
        .catch((error) => {
          console.log(error);
          toast.error("Failed to update room");
        });
    }
  };

  const handleDelete = () => {
    if (!room?.id) return;
    deleteRoom(room.id)
      .then((data) => {
        if (data) {
          router.push(`/dashboard/rooms?message=Room deleted successfully`);
        } else {
          toast.error("Failed to delete room");
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error("Failed to delete room");
      });
  };

  return !creating && !room ? (
    <div className="container mx-auto py-8 text-center">
      <Label className="text-xl font-semibold text-gray-600">Loading...</Label>
    </div>
  ) : (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/rooms">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {creating ? "Create Room" : editing ? "Edit Room" : "View Room"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            onClick={() => {
              if (!creating && !editing) {
                setEditing(true);
              } else {
                form.handleSubmit(handleSubmit)();
              }
            }}
            className="bg-slate-800 hover:bg-slate-900"
          >
            {creating ? "Create" : editing ? "Save Changes" : "Edit"}
          </Button>
          <Button
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            variant={creating || editing ? "outline" : "destructive"}
            onClick={() => {
              if (creating) {
                router.push("/dashboard/rooms");
              } else if (editing) {
                setEditing(false);
                form.reset({
                  name: room?.name ?? "",
                  floorNumber: room?.floorNumber ?? "",
                  buildingId: room?.buildingId ?? -1,
                  sizeInSquareMeters: room?.sizeInSquareMeters ?? 0,
                  purpose: room?.purpose ?? "",
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
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>Are you sure you want to delete this room?</DialogDescription>
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
            <h2 className="text-xl font-semibold text-gray-900">Room Details</h2>
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
                      <FormLabel className="text-gray-700">Room Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter room name"
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
                  name="buildingId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Building</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          creating
                          ? selectedBuilding?.id?.toString() ?? ""
                          : room?.buildingId?.toString() ?? ""
                        }
                        disabled={!creating && !editing}
                      >
                        <SelectTrigger
                          className={cn(
                            !creating && !editing
                              ? "bg-gray-100 opacity-70 cursor-not-allowed"
                              : "border-gray-200"
                          )}
                        >
                          <SelectValue placeholder="Select a building" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildings.map((building) => (
                            <SelectItem key={building.id} value={building.id.toString()}>
                              {building.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="floorNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Floor Number</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={(!creating && !editing) || !isBuildingSelected}
                      >
                        <SelectTrigger
                          className={cn(
                            (!creating && !editing) || !isBuildingSelected
                              ? "bg-gray-100 opacity-70 cursor-not-allowed"
                              : "border-gray-200"
                          )}
                        >
                          <SelectValue placeholder="Select a floor" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedBuildingFloors.map((floor) => (
                            <SelectItem key={floor.order} value={floor.name}>
                              {floor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sizeInSquareMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Size (sqm)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter size in square meters"
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
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Purpose (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter room purpose"
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
      </div>
    </div>
  );
}