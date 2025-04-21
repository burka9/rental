'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { usePropertyStore } from "@/lib/store/property";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function Buildings() {
  const searchParams = useSearchParams();
  const { fetchBuildings, buildings } = usePropertyStore();
  const router = useRouter();

  useEffect(() => {
    fetchBuildings()
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.log(error);
      });
  }, [fetchBuildings]);

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!);
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buildings</h1>
        <Button
          onClick={() => {
            router.push(`/dashboard/buildings/view?create=true`);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Add New Building
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {buildings.map(building => (
          <Card
            key={building.id}
            className={cn(
              "border-none shadow-sm cursor-pointer transition-all",
              "hover:bg-gray-50 hover:shadow-md"
            )}
            onClick={() => {
              router.push(`/dashboard/buildings/view?id=${building.id}`);
            }}
          >
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-500 truncate">
                {building.address || 'No address'}
              </CardDescription>
              <CardTitle className="text-lg font-semibold truncate">
                {building.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <Label className="text-sm text-gray-600">
                Rooms: {building.rooms?.length ?? 0}
              </Label>
              <Label className="text-sm text-gray-600">
                Floors: {building.noOfFloors}
              </Label>
              <Label className="text-sm text-gray-600">
                Tenants: {building.tenantCount ?? 0}
              </Label>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}