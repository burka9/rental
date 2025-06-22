'use client'
import { usePropertyStore } from "@/lib/store/property";
import { Building2, Plus, Home, Pencil, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, ROLES } from "@/lib/types";
import { DataTable } from "./rooms/data-table";
import { columns } from "./rooms/columns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import Link from "next/link";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
  noOfFloors: z.coerce.number().min(1, "Number of floors is required"),
  noOfBasements: z.coerce.number().min(0, "Number of basements is required"),
});

export default function ViewBuilding() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [, setCreating] = useState(false);
  const [building, setBuilding] = useState<Building | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isLoadingRooms] = useState(false);  // Will be used when implementing room loading
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();
  const { fetchBuilding, createBuilding, updateBuilding, deleteBuilding } = usePropertyStore();
  
  const isAdmin = [ROLES.ADMIN, ROLES.SUPERADMIN].includes(user?.role as ROLES);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      noOfFloors: 1,
      noOfBasements: 0,
    },
  });

  // Load building data
  useEffect(() => {
    const loadBuilding = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const id = searchParams.get("id");
        const isCreate = searchParams.get("create") === "true";
        
        if (id) {
          const buildingData = await fetchBuilding(Number(id));
          if (buildingData) {
            setBuilding(buildingData);
            // Set form values when building data is loaded
            form.reset({
              name: buildingData.name || "",
              address: buildingData.address || "",
              noOfFloors: buildingData.noOfFloors || 1,
              noOfBasements: buildingData.noOfBasements || 0,
            });
          }
        } else if (isCreate) {
          setCreating(true);
          setEditing(true);
        }
      } catch (error) {
        console.error("Failed to load building:", error);
        toast.error("Failed to load building data");
      } finally {
        setLoading(false);
      }
    };
    
    loadBuilding();
  }, [user, searchParams, fetchBuilding, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setSaving(true);
      if (building) {
        const updatedBuilding = await updateBuilding({ ...building, ...values });
        if (updatedBuilding) {
          setBuilding(updatedBuilding);
          toast.success("Building updated successfully");
          setEditing(false);
        }
      } else {
        const newBuilding = await createBuilding(values);
        if (newBuilding) {
          toast.success("Building created successfully");
          router.push("/dashboard/buildings");
        }
      }
    } catch (error) {
      console.error("Failed to save building:", error);
      toast.error("Failed to save building");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!building) return;
    
    try {
      setDeleting(true);
      const success = await deleteBuilding(building.id);
      if (success) {
        toast.success("Building deleted successfully");
        router.push("/dashboard/buildings");
      }
    } catch (error) {
      console.error("Failed to delete building:", error);
      toast.error("Failed to delete building");
    } finally {
      setOpenDeleteDialog(false);
      setDeleting(false);
    }
  };

  useEffect(() => {
    const loadBuilding = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const id = searchParams.get("id");
        if (id) {
          const buildingData = await fetchBuilding(Number(id));
          if (buildingData) {
            setBuilding(buildingData);
          }
        } else {
          setEditing(true);
        }
      } catch (error) {
        console.error("Failed to load building:", error);
        toast.error("Failed to load building data");
      } finally {
        setLoading(false);
      }
    };
    
    loadBuilding();
  }, [user, searchParams, fetchBuilding]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb skeleton */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        
        {/* Form skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardContent>
        </Card>
        
        {/* Rooms section skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-9 w-28" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-primary flex items-center">
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/dashboard/buildings" className="hover:text-primary">
          Buildings
        </Link>
        {building && (
          <>
            <span>/</span>
            <span className="text-foreground font-medium">{building.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {building ? building.name : 'New Building'}
          </h1>
          <p className="text-muted-foreground">
            {building ? 'Manage building details and rooms' : 'Create a new building'}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-2">
            {building ? (
              <>
                <Button
                  variant={editing ? 'outline' : 'default'}
                  onClick={() => setEditing(!editing)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setOpenDeleteDialog(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/buildings')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Buildings
              </Button>
            )}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Building Details</CardTitle>
          <CardDescription>
            {editing 
              ? 'Update the building information below.' 
              : 'View the building details.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Building Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter building name" 
                          {...field} 
                          disabled={!editing} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full address" 
                          {...field} 
                          disabled={!editing} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="noOfFloors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Floors</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={1}
                          placeholder="Enter number of floors"
                          {...field}
                          disabled={!editing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="noOfBasements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Basements</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={0}
                          placeholder="Enter number of basements"
                          {...field}
                          disabled={!editing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (building) {
                      form.reset({
                        name: building.name || "",
                        address: building.address || "",
                        noOfFloors: building.noOfFloors || 1,
                        noOfBasements: building.noOfBasements || 0,
                      });
                      setEditing(false);
                    } else {
                      router.push("/dashboard/buildings");
                    }
                  }}
                  disabled={saving}
                >
                  {building ? 'Cancel' : 'Back'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={!form.formState.isDirty || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : building ? (
                    'Save Changes'
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Building
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {building && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Rooms</h3>
              <p className="text-sm text-muted-foreground">
                {isLoadingRooms ? 'Loading rooms...' : `Total ${building.rooms?.length || 0} rooms`}
              </p>
            </div>
            {/* {isAdmin && (
              <Button asChild>
                <Link href={`/dashboard/rooms/view?create=true&buildingId=${building.id}`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room
                </Link>
              </Button>
            )} */}
          </div>
          
          {isLoadingRooms ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : building.rooms && building.rooms.length > 0 ? (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Rooms</CardTitle>
                    <CardDescription>
                      Manage rooms in {building.name}
                    </CardDescription>
                  </div>
                  {isAdmin && (
                    <Button asChild>
                      <Link href={`/dashboard/rooms/view?create=true&buildingId=${building.id}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Room
                      </Link>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={building.rooms}
                  buildingId={building.id}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-sm font-medium">No rooms yet</h3>
              <p className="mt-1 text-sm text-muted-foreground mb-4">
                Get started by adding a room to this building.
              </p>
              {isAdmin && (
                <Button asChild>
                  <Link href={`/dashboard/rooms/view?create=true&buildingId=${building.id}`}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Room
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="rounded-full bg-destructive/10 p-3 w-fit mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">Delete Building</DialogTitle>
            <DialogDescription className="text-center">
              Are you sure you want to delete <span className="font-semibold">{building?.name}</span>? 
              This action cannot be undone and will permanently delete all associated rooms and data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-3 sm:gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpenDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
              className="w-full sm:w-auto"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Building'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
     