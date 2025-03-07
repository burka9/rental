'use client'
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { usePropertyStore } from "@/lib/store/property";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner"
import { DataTable } from "./data-table";
import { columns } from "./columns";
import Link from "next/link";


export default function Partitions() {
	const searchParams = useSearchParams()
	const { fetchPartitions, partitions } = usePropertyStore()

	useEffect(() => {
		fetchPartitions()
			.then(data => {
				console.log(data)
			})
			.catch(error => {
				console.log(error)
			})
	}, [fetchPartitions])

	useEffect(() => {
		if (searchParams.get("message")) {
			toast.success(searchParams.get("message")!)
		}
	}, [searchParams])
	
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Label className="text-2xl font-bold mb-4">Offices</Label>
				<Link href={`/dashboard/partitions/view?create=true`}>
					<Button>Add New Office</Button>
				</Link>
			</div>
			<div className="flex gap-4">
				<DataTable columns={columns} data={partitions} />
			</div>
		</div>
	);
}