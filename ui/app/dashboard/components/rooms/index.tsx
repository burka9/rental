'use client'
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePropertyStore } from "@/lib/store/property";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner"
import { DataTable } from "./rooms/data-table";
import { columns } from "./rooms/columns";
import Link from "next/link";


export default function Rooms() {
	const searchParams = useSearchParams()
	const { fetchRooms, rooms } = usePropertyStore()

	useEffect(() => {
		fetchRooms()
			.then(data => {
				console.log(data)
			})
			.catch(error => {
				console.log(error)
			})
	}, [fetchRooms])

	useEffect(() => {
		if (searchParams.get("message")) {
			toast.success(searchParams.get("message")!)
		}
	}, [searchParams])
	
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Label className="text-2xl font-bold mb-4">Rooms</Label>
				<Link href={`/dashboard/rooms/view?create=true`}>
					<Button>Add New Room</Button>
				</Link>
			</div>
			<div className="flex gap-4">
				<DataTable columns={columns} data={rooms} />
			</div>
		</div>
	);
}