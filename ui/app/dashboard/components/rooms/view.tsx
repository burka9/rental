import { usePropertyStore } from "@/lib/store/property";
import { Room } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
  name: z.string(),
  floorNumber: z.string(), // Storing floor name as string
  buildingId: z.coerce.number().min(0, "Building is required"),
  sizeInSquareMeters: z.coerce.number().min(0, "Size in square meters is required"),
	purpose: z.string().optional(),
});

export default function ViewRoom() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const router = useRouter();
  const { fetchRoom, createRoom, updateRoom, deleteRoom, buildings, fetchBuildings } = usePropertyStore();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: room?.name ?? "",
      floorNumber: room?.floorNumber ?? "",
      buildingId: room?.buildingId ?? -1,
      sizeInSquareMeters: room?.sizeInSquareMeters,
			purpose: room?.purpose ?? "",
    },
  });

  
  const buildingId = form.watch("buildingId");
  
  const selectedBuilding = useMemo(() => {
    if (creating && buildingId !== null) return buildings.find(b => b.id === buildingId);
    
    if (!room?.buildingId || !buildings.length) return null;
    return buildings.find(b => b.id === room.buildingId);
  }, [room?.buildingId, buildings, creating, buildingId]);

  // Get floors for the selected building
  const selectedBuildingFloors = useMemo(() => {
    if (!buildingId || buildingId < 0 || !buildings.length) return [];
    const building = buildings.find(b => b.id === Number(buildingId));

    return building?.floors || [];
  }, [buildingId, buildings]);

  // Check if a building is selected
  const isBuildingSelected = useMemo(() => {
    return buildingId > 0; // Assuming -1 or 0 means no building selected
  }, [buildingId]);

  const searchParams = useSearchParams();

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
		buttonClicked()
  };

  const buttonClicked = () => {
    if (creating) {
      form.trigger()
        .then(data => {
          if (!data) throw new Error();
          return createRoom({
            ...form.getValues(),
            occupied: false,
          });
        })
        .then(data => {
          if (data) {
            router.push(`/dashboard/rooms?message=Room created successfully`);
          } else {
            console.log('error');
          }
        });
    } else if (editing) {
      if (!room) return;
      form.trigger()
        .then((data) => {
          if (!data) return;
          updateRoom({
            ...form.getValues(),
            id: room.id,
          })
            .then(data => {
              if (data == null) {
                toast.error("Failed to update room");
                return;
              }
              setRoom(() => ({
                id: room.id,
                ...form.getValues(),
                occupied: room.occupied,
              }));
              toast.success("Room updated successfully");
              setEditing(() => false);
            });
        })
        .catch(error => {
          console.log(error);
          toast.error("Failed to update room");
        });
    } else {
      setEditing(() => true);
    }
  };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDelete = () => {
    deleteRoom(room?.id ?? 0)
      .then(data => {
        if (data) {
          router.push(`/dashboard/rooms?message=Room deleted successfully`);
        } else {
          console.log('error');
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  useEffect(() => {
    const id = Number(searchParams.get("id"));
    const buildingId = Number(searchParams.get("buildingId"));

    if (!buildings.length) {
      fetchBuildings();
    }

    if (buildingId) {
      const building = buildings.find(b => b.id === buildingId);
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
        });
    }
  }, [fetchRoom, searchParams, router, form, buildings, fetchBuildings]);

	useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);
	
  useEffect(() => {
    if (!room) return;
    form.reset({
      name: room.name,
      floorNumber: room.floorNumber,
      buildingId: Number(room.buildingId),
      sizeInSquareMeters: room.sizeInSquareMeters,
    });
  }, [room, form]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  return !creating && !room ? <>Loading</> : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
          <Link href="/dashboard/rooms">
            <Button className="mr-2 p-1 px-2" size="sm"><ChevronLeftIcon size={3} /></Button>
          </Link>
          <Label className="text-xl font-bold">{creating ? "Create Room" : editing ? "Edit Room" : "View Room"}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Button size="default" onClick={buttonClicked}>
            {creating ? "Create" : editing ? "Save Changes" : "Edit"}
          </Button>
          <Button
            size="default"
            variant={creating ? "outline" : editing ? "outline" : "destructive"}
            onClick={() => {
              if (creating) {
                setCreating(() => false);
                router.back();
              } else if (editing) {
                setEditing(() => false);
                form.reset({
                  floorNumber: room?.floorNumber,
                  name: room?.name,
                  sizeInSquareMeters: room?.sizeInSquareMeters,
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
              <Button variant="destructive" onClick={handleDelete}>Yes</Button>
              <Button variant="outline" onClick={() => setOpenDeleteDialog(() => false)}>No</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-2 max-w-4xl w-full mx-auto"
          >
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Room Number"
                        readOnly={!creating && !editing}
                        className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buildingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Building</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={
                        creating
                        ? selectedBuilding?.id?.toString() ?? ""
                        : room?.buildingId?.toString() ?? ""
                      }
                      disabled={!creating && !editing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedBuilding?.name || "Select a building"} />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((building) => (
                          <SelectItem key={building.id} value={building.id.toString()}>
                            {building.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="floorNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Floor Number</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={(!creating && !editing) || !isBuildingSelected}
                    >
                      <SelectTrigger
                        className={
                          (editing || creating) && isBuildingSelected
                            ? "bg-white"
                            : "opacity-60 cursor-default"
                        }
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sizeInSquareMeters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size in Square Meters</FormLabel>
                    <FormControl>
                      <Input
												{...field}
												placeholder="Room Size"
												readOnly={!creating && !editing}
												className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
												type="number"
												min={0}
											/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

							<FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Purpose</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Room Purpose"
                        readOnly={!creating && !editing}
                        className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}