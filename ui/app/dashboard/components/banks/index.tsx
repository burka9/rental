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


export default function Rooms() {
	const searchParams = useSearchParams()
	const { fetchBanks, banks } = usePropertyStore()

	useEffect(() => {
		fetchBanks()
			.then(data => {
				console.log(data)
			})
			.catch(error => {
				console.log(error)
			})
	}, [fetchBanks])

	useEffect(() => {
		if (searchParams.get("message")) {
			toast.success(searchParams.get("message")!)
		}
	}, [searchParams])
	
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Label className="text-2xl font-bold mb-4">Banks</Label>
				<Link href={`/dashboard/banks/view?create=true`}>
					<Button>Add New Bank</Button>
				</Link>
			</div>
			<div className="flex gap-4">
				<DataTable columns={columns} data={banks} />
			</div>
		</div>
	);
}