'use client'
import { Button } from "@/components/ui/button";
import { usePropertyStore } from "@/lib/store/property";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "./rooms/data-table";
import { columns } from "./rooms/columns";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLES } from "@/lib/types";
import { Building, Home, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";


export default function Rooms() {
  const searchParams = useSearchParams();
  const { fetchRooms, rooms } = usePropertyStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [vacant, setVacant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        await fetchRooms();
      } catch (error) {
        console.error("Failed to fetch rooms:", error);
        toast.error("Failed to load rooms");
      } finally {
        setLoading(false);
      }
    };
    
    loadRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!);
      // Clear the message from the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("message");
      window.history.replaceState({}, '', url);
    }

    if (searchParams.get("vacant")) {
      setVacant(true);
    }
  }, [searchParams]);

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return rooms.filter(room => {
      return (
        room.name.toLowerCase().includes(searchLower) ||
        room.building?.name.toLowerCase().includes(searchLower) ||
        room.floorNumber.toString().includes(searchLower)
      ) && (!vacant || !room.occupied);
    });
  }, [rooms, searchQuery, vacant]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home className="h-6 w-6 text-blue-600" />
            Rooms
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} in total
            {vacant && ' • Showing only vacant rooms'}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search rooms..."
              className="pl-9 w-full bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Link
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            href="/dashboard/rooms/view?create=true" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </Link>
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">
              {searchQuery ? 'No matching rooms found' : 'No rooms yet'}
            </h3>
            <p className="text-muted-foreground mt-2 mb-6 max-w-md">
              {searchQuery 
                ? 'Try adjusting your search or filter to find what you\'re looking for.'
                : 'Get started by adding a new room to your building.'}
            </p>
            <Link data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]} href="/dashboard/rooms/view?create=true">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Room
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Rooms</CardTitle>
                <CardDescription>
                  {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} found
                  {searchQuery && ` matching "${searchQuery}"`}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">

                <Badge 
                  variant={vacant ? 'default' : 'outline'} 
                  className="cursor-pointer ml-2" 
                  onClick={() => setVacant(!vacant)}
                >
                  {vacant ? 'Showing Vacant' : 'Show Vacant'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={vacant ? filteredRooms.filter(room => !room.occupied) : filteredRooms} 
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}