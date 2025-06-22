'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePropertyStore } from "@/lib/store/property";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { ROLES } from "@/lib/types";
import { Search, Building2, Plus, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Buildings() {
  const searchParams = useSearchParams();
  const { fetchBuildings, buildings } = usePropertyStore();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const loadBuildings = async () => {
      try {
        setLoading(true);
        await fetchBuildings();
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
        toast.error("Failed to load buildings. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    loadBuildings();
  }, [fetchBuildings, user, setLoading]);

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!);
    }
  }, [searchParams]);

  const filteredBuildings = buildings.filter(building => 
    building.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    building.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const BuildingCardSkeleton = () => (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full rounded-t-lg" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Buildings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {buildings.length} {buildings.length === 1 ? 'building' : 'buildings'} in total
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search buildings..."
              className="pl-9 w-full bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            onClick={() => router.push('/dashboard/buildings/view?create=true')}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Building
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <BuildingCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBuildings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBuildings.map((building) => (
            <Card
              key={building.id}
              className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 h-full flex flex-col cursor-pointer"
              onClick={() => router.push(`/dashboard/buildings/view?id=${building.id}`)}
            >
              <div className="relative h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                <Building2 className="h-16 w-16 text-blue-300" />
                <Badge 
                  variant="outline" 
                  className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm"
                >
                  {building.tenantCount ?? 0} {building.tenantCount === 1 ? 'tenant' : 'tenants'}
                </Badge>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                      {building.name}
                    </CardTitle>
                  </div>
                  <div className="text-sm text-gray-500 line-clamp-2 mb-4">
                    {building.address || 'No address provided'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Rooms</span>
                    <span className="font-medium">{building.rooms?.length ?? 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Floors</span>
                    <span className="font-medium">{building.noOfFloors || '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchQuery ? 'No matching buildings found' : 'No buildings yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery 
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'Get started by adding a new building.'}
          </p>
          <div className="mt-6">
            <Button
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery('');
                } else {
                  router.push('/dashboard/buildings/view?create=true');
                }
              }}
              className="inline-flex items-center gap-2"
            >
              {searchQuery ? (
                <>
                  <span>Clear search</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Add Building</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}