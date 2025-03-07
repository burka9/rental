'use client'
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { usePropertyStore } from "@/lib/store/property";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner"


export default function Buildings() {
	const searchParams = useSearchParams()
	const { fetchBuildings, buildings } = usePropertyStore()
	const router = useRouter()

	useEffect(() => {
		fetchBuildings()
			.then(data => {
				console.log(data)
			})
			.catch(error => {
				console.log(error)
			})
	}, [fetchBuildings])

	useEffect(() => {
		if (searchParams.get("message")) {
			toast.success(searchParams.get("message")!)
		}
	}, [searchParams])
	
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Label className="text-2xl font-bold mb-4">Buildings</Label>
				<Button onClick={() => {
					router.push(`/dashboard/buildings/view?create=true`)
				}}>Add New Building</Button>
			</div>
			<div className="flex flex-wrap gap-4">
				{buildings.map(building => (
					<Card key={building.id} className={cn(
						"w-full max-w-[250px] cursor-pointer",
						"hover:bg-primary hover:text-white transition-all"
					)} onClick={() => {
						router.push(`/dashboard/buildings/view?id=${building.id}`)
					}}>
						<CardHeader>
							<CardDescription>{building.address}</CardDescription>
							<CardTitle>{building.name}</CardTitle>
							<CardContent className="flex flex-col gap-1">
								<Label>Rooms: {building.rooms?.length}</Label>
								<Label>Floors: {building.noOfFloors}</Label>
								<Label>Offices: {building.rooms?.reduce((total, room) => total + room.partitions.length, 0)}</Label>
							</CardContent>
						</CardHeader>
					</Card>
				))}
			</div>
		</div>
	);
}