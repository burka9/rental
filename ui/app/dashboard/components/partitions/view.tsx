import { usePropertyStore } from "@/lib/store/property";
import { Partition } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
	name: z.string(),
	roomId: z.coerce.number(),
	buildingId: z.coerce.number(),
	occupied: z.boolean().optional(),
	sizeInSquareMeters: z.coerce.number(),
})

export default function ViewPartition() {
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState(false);
	const [partition, setPartition] = useState<Partial<Partition> | null>(null);
	const router = useRouter();
	const { fetchPartition, createPartition, updatePartition, deletePartition, buildings, fetchBuildings, rooms, fetchRooms } = usePropertyStore();

	useEffect(() => {
		fetchBuildings();
	}, [fetchBuildings]);

	useEffect(() => {
		fetchRooms();
	}, [fetchRooms]);

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: partition?.name ?? "",
			roomId: Number(partition?.roomId ?? ""),
			buildingId: Number(partition?.buildingId ?? ""),
			occupied: !!partition?.occupied,
			sizeInSquareMeters: Number(partition?.sizeInSquareMeters ?? ""),
		}
	})

  const searchParams = useSearchParams();

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		console.log(values)
	}
	
	const buttonClicked = () => {
		if (creating) {
			form.setValue("occupied", false)

			form.trigger()
				.then(data => {
					if (!data) throw new Error()

					return createPartition(form.getValues())
				})
				.then(data => {
					console.log(form.getValues())
					
					if (data) {
						router.push(`/dashboard/partitions?message=Partition created successfully`)
					} else {
						console.log('error')
					}
				})
		} else if (editing) {
			if (!partition) return

			form.trigger()
				.then((data) => {
					if (!data) return
					
					updatePartition({
						...form.getValues(),
						id: partition.id,
					})
						.then(data => {
							if (data == null) {
								toast.error("Failed to update partition")
								return
							}

							setPartition(() => ({
								id: partition.id,
								...form.getValues()
							}))
							toast.success("Partition updated successfully")
							setEditing(() => false)
						})
				})
				.catch(error => {
					console.log(error)
					toast.error("Failed to update partition")
				})
		} else {
			setEditing(() => true)
		}
	}

	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const handleDelete = () => {
		deletePartition(partition?.id ?? 0)
			.then(data => {
				if (data) {
					router.push(`/dashboard/partitions?message=Partition deleted successfully`)
				} else {
					console.log('error')
				}
			})
			.catch(error => {
				console.log(error)
			})
	}

	// const [floorFilter, setFloorFilter] = useState<string>("all")
	
	// const floorFilterChange = (value: string) => {
	// 	setFloorFilter(value)
	// }
	
  useEffect(() => {
		const id = Number(searchParams.get("id"))

		if (!id) return;

    fetchPartition(id)
      .then((data) => {
				if (data == null) {
					router.push(`/dashboard/partitions`)
				} else {
					setPartition(data);
				}
      })
      .catch((error) => {
        console.log(error);
      });
  }, [fetchPartition, searchParams, router]);

	useEffect(() => {
		if (!fetchPartition) return;

		form.reset({
		})
	}, [fetchPartition, form])
	
	useEffect(() => {
		setCreating(searchParams.get("create") === "true");
		setEditing(searchParams.get("edit") === "true");
	}, [searchParams])
	
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
					{/* back button */}
					<Link href="/dashboard/partitions">
					<Button className="mr-2 p-1 px-2" size="sm"><ChevronLeftIcon size={3} /></Button>
					</Link>
					<Label className="text-xl font-bold">{creating ? "Create Partition" : editing ? "Edit Partition" : "View Partition"}</Label>
				</div>
        <div className="flex items-center gap-2">
					<Button size="default" onClick={buttonClicked}>{
						creating ? "Create" : editing ? "Save Changes" : "Edit"
					}</Button>
					<Button size="default" variant={
						creating ? "outline" : editing ? "outline" : "destructive"
					} onClick={() => {
						if (creating) {
							setCreating(() => false);
						} else if (editing) {
							setEditing(() => false);
							form.reset({
							});
						} else {
							setOpenDeleteDialog(true);
						}
					}}>{
						creating ? "Cancel" : editing ? "Cancel" : "Delete"
					}</Button>
				</div>
      </div>
      <div className="flex flex-col gap-8">
				<Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
					<DialogContent>
						<DialogTitle>
							Delete Partition
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this partition?
						</DialogDescription>
						<DialogFooter>
							<Button variant="destructive" onClick={handleDelete}>Yes</Button>
							<Button variant="outline" onClick={() => setOpenDeleteDialog(() => false)}>No</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex flex-col gap-2 max-w-lg w-full mx-auto"
					>
						<div className="grid grid-cols-3 gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Office Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Office Name"
												readOnly={!creating && !editing}
												className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="sizeInSquareMeters"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Office Size</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Office Size"
												readOnly={!creating && !editing}
												className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="buildingId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Building</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value?.toString()}
											disabled={!creating && !editing}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a building" />
											</SelectTrigger>
											<SelectContent>
												{buildings.map((building) => (
													<SelectItem key={building.id} value={building.id.toString()}>
														{building.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="roomId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Room</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value?.toString()}
											disabled={!creating && !editing}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select a room" />
											</SelectTrigger>
											<SelectContent>
												{rooms.map((room) => (
													<SelectItem key={room.id} value={room.id.toString()}>
														{room.number}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* <div className="flex">
								<FormField
									control={form.control}
									name="occupied"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Rent Status</FormLabel>
											<FormControl>
												<Input
													{...field}
													placeholder="Office Size"
													readOnly={!creating && !editing}
													className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div> */}
						</div>
					</form>
				</Form>

				{
					// creating ? null : <div className="flex flex-col justify-center gap-4">
					// 	<div className="flex items-center justify-between">
					// 		<div className="flex flex-col gap-2">
					// 			<Label className="font-bold text-xl">Offices</Label>
					// 			{/* <Select onValueChange={floorFilterChange}>
					// 				<SelectTrigger className="w-[150px]">
					// 					<SelectValue placeholder="Floor Number" />
					// 				</SelectTrigger>
					// 				<SelectContent>
					// 					<SelectItem value="all">All Floors</SelectItem>
					// 					{Array.from({ length: building?.noOfFloors || 0 }).map((_, i) => (
					// 						<SelectItem key={i + 1} value={(i + 1).toString()}>
					// 							Floor {i + 1}
					// 						</SelectItem>
					// 					))}
					// 				</SelectContent>
					// 			</Select> */}
					// 		</div>

					// 		<div className="flex gap-2 items-center">
					// 			<Link href={`/dashboard/partitions/view?create=true&roomId=${room.id}`}>
					// 				<Button>Add Partitions</Button>
					// 			</Link>
					// 		</div>
					// 	</div>

					// 	<DataTable columns={columns} data={partitions} />
					// </div>
				}
      </div>
    </div>
  );
}