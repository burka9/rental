'use client'
import { Button } from "@/components/ui/button";
import { usePropertyStore } from "@/lib/store/property";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { DataTable } from "./rooms/data-table";
import { columns } from "./rooms/columns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ROLES } from "@/lib/types";

export default function Rooms() {
  const searchParams = useSearchParams();
  const { fetchRooms, rooms } = usePropertyStore();
	const [vacant, setVacant] = useState(false)

  useEffect(() => {
    fetchRooms()
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Failed to fetch rooms");
      });
  }, [fetchRooms]);

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!);
    }

		if (searchParams.get("vacant")) {
			setVacant(true)
		}
  }, [searchParams]);

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
        <Link href={`/dashboard/rooms/view?create=true`}>
          <Button data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]} className="bg-slate-800 hover:bg-slate-900">Add New Room</Button>
        </Link>
      </div>
      <Card className="border-none shadow-md rounded-lg">
        <CardContent className="pt-6">
          <DataTable columns={columns} data={rooms} vacant={vacant} />
        </CardContent>
      </Card>
    </div>
  );
}