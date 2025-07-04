'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Store
import { usePropertyStore } from "@/lib/store/property";
import { useStore } from "@/lib/store";
import { ROLES, Room } from "@/lib/types";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const formSchema = z.object({
  name: z.string().min(1, "Room name is required"),
  floorNumber: z.string().min(1, "Floor number is required"),
  buildingId: z.coerce.number().min(1, "Building is required"),
  sizeInSquareMeters: z.coerce.number().min(0, "Size in square meters is required"),
  purpose: z.string().optional(),
});

export default function ViewRoom() {
  // State
  const [room, setRoom] = useState<Room | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Hooks
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();
  const { 
    fetchRoom, 
    createRoom, 
    updateRoom, 
    deleteRoom, 
    buildings, 
    fetchBuildings,
  } = usePropertyStore();

  // Memoized values
  const isAdmin = useMemo(() => 
    [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user?.role as ROLES),
    [user?.role]
  );

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      floorNumber: "GF",
      buildingId: 0,
      sizeInSquareMeters: 0,
      purpose: "",
    },
  });

  // Generate floor options based on building
  const floorOptions = useMemo(() => {
    const floors = [];
    // Add basement floors (BS3, BS2, BS1)
    for (let i = 3; i >= 1; i--) {
      floors.push({ value: `BS${i}`, label: `Basement ${i} (BS${i})` });
    }
    // Add ground floor
    floors.push({ value: 'GF', label: 'Ground Floor (GF)' });
    // Add regular floors (F1-F10)
    for (let i = 1; i <= 10; i++) {
      floors.push({ value: `F${i}`, label: `Floor ${i} (F${i})` });
    }
    return floors;
  }, []);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        await fetchBuildings();
        
        // Check if we're creating a new room
        const isCreate = searchParams.get("create") === "true";
        const roomId = searchParams.get("id");
        const buildingId = searchParams.get("buildingId");
        
        if (isCreate) {
          setCreating(true);
          setEditing(true);
          
          // Set default values for new room
          const defaultValues = {
            name: "",
            floorNumber: "GF",
            buildingId: buildingId ? Number(buildingId) : 0,
            sizeInSquareMeters: 0,
            purpose: "",
          };
          
          form.reset(defaultValues);
          return;
        }
        
        // Load room data if editing
        if (roomId) {
          const roomData = await fetchRoom(Number(roomId));
          if (roomData) {
            setRoom(roomData);
            form.reset({
              name: roomData.name,
              floorNumber: roomData.floorNumber,
              buildingId: Number(roomData.buildingId),
              sizeInSquareMeters: roomData.sizeInSquareMeters,
              purpose: roomData.purpose || "",
            });
          } else {
            throw new Error("Room not found");
          }
        }
      } catch (error) {
        console.error("Error loading room:", error);
        toast.error("Failed to load room data");
        router.push("/dashboard/rooms");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, searchParams, fetchRoom, fetchBuildings, form, router]);

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isAdmin) {
      toast.error("You don't have permission to perform this action");
      return;
    }
    
    try {
      setSaving(true);
      
      if (creating) {
        const newRoom = await createRoom({
          ...values,
          occupied: false,
        });
        
        if (newRoom) {
          toast.success("Room created successfully");
          router.push(`/dashboard/rooms`);
        }
      } else if (room) {
        const updatedRoom = await updateRoom({
          ...values,
          id: room.id,
        });
        
        if (updatedRoom) {
          toast.success("Room updated successfully");
          setRoom(updatedRoom);
          setEditing(false);
        }
      }
    } catch (error) {
      console.error("Error saving room:", error);
      toast.error("Failed to save room");
    } finally {
      setSaving(false);
    }
  };

  // Handle room deletion
  const handleDelete = async () => {
    if (!isAdmin || !room) return;
    
    try {
      setDeleting(true);
      const success = await deleteRoom(room.id);
      
      if (success) {
        toast.success("Room deleted successfully");
        router.push("/dashboard/rooms");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    } finally {
      setDeleting(false);
      setOpenDeleteDialog(false);
    }
  };

  // Close delete dialog when component unmounts or room changes
  useEffect(() => {
    return () => {
      setOpenDeleteDialog(false);
    };
  }, [room]);

  // Loading state
  if (!user || loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-24" />
        </div>

        {/* Header skeleton */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Form skeleton */}
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>

        {/* Form actions skeleton */}
        <div className="flex justify-end gap-2 mt-6">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/rooms">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Rooms
            </Button>
          </Link>
        </div>

        <div data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]} className="flex items-center gap-2">
          {!creating && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setOpenDeleteDialog(true)}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete
            </Button>
          )}
          
          {!editing ? (
            <Button onClick={() => setEditing(true)} size="sm">
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (room) {
                    form.reset({
                      name: room.name,
                      floorNumber: room.floorNumber,
                      buildingId: Number(room.buildingId),
                      sizeInSquareMeters: room.sizeInSquareMeters,
                      purpose: room.purpose || "",
                    });
                  }
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="room-form"
                size="sm"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Room</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this room? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-8">
        <Card className="border-none shadow-md rounded-lg">
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">
              {creating ? "Create New Room" : room?.name || "Room Details"}
            </h2>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                id="room-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter room name"
                            disabled={!editing}
                            {...field}
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
                          value={field.value?.toString() || ""}
                          disabled={!editing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a building" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem
                                key={building.id}
                                value={building.id.toString()}
                              >
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
                          value={field.value}
                          disabled={!editing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select floor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {floorOptions.map((floor) => (
                              <SelectItem key={floor.value} value={floor.value}>
                                {floor.label}
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
                        <FormLabel>Size (m²)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Enter size"
                            disabled={!editing}
                            {...field}
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>Purpose (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter purpose"
                            disabled={!editing}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}