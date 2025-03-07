"use client"
import { useEffect } from "react"
import { useTenantStore } from "@/lib/store/tenants"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default function Tenants() {
	const searchParams = useSearchParams()
	const { fetchTenants, tenants } = useTenantStore()

	useEffect(() => {
		fetchTenants()
			.then(data => {
				console.log(data)
			})
			.catch(error => {
				console.log(error)
			})
	}, [fetchTenants])

	useEffect(() => {
		if (searchParams.get("message")) {
			toast.success(searchParams.get("message")!)
		}
	}, [searchParams])


	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Label className="text-2xl font-bold mb-4">Tenants</Label>
				<Link href={`/dashboard/tenants/view?create=true`}>
					<Button>Add New Tenant</Button>
				</Link>
			</div>
			<div className="flex gap-4">
				<DataTable columns={columns} data={tenants} />
			</div>
		</div>
	);
}