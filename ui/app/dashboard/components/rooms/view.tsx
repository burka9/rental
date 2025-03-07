import { usePropertyStore } from "@/lib/store/property";
import { Room } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { DataTable } from "./partitions/data-table";
import { columns } from "./partitions/columns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
	number: z.string(),
	floorNumber: z.coerce.number().min(0, "Floor number is required"),
	buildingId: z.coerce.number().min(0, "Building is required"),
})

export default function ViewRoom() {
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState(false);
	const [room, setRoom] = useState<Room | null>(null);
	const router = useRouter();
	const { fetchRoom, createRoom, updateRoom, deleteRoom, buildings, fetchBuildings } = usePropertyStore();

	useEffect(() => {
		fetchBuildings();
	}, [fetchBuildings]);

	// Find the building name when room is loaded
	const selectedBuilding = useMemo(() => {
		if (!room?.buildingId || !buildings.length) return null;
		return buildings.find(b => b.id === room.buildingId);
	}, [room?.buildingId, buildings]);

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: {
			number: room?.number ?? "",
			// floorNumber: Number(room?.floorNumber ?? "",
			buildingId: room?.buildingId ?? -1,
		}
	})

  const searchParams = useSearchParams();

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		console.log(values)
	}
	
	const buttonClicked = () => {
		if (creating) {
			form.trigger()
				.then(data => {
					if (!data) throw new Error()

					return createRoom(form.getValues())
				})
				.then(data => {
					console.log(form.getValues())
					
					if (data) {
						router.push(`/dashboard/rooms?message=Room created successfully`)
					} else {
						console.log('error')
					}
				})
		} else if (editing) {
			if (!room) return

			form.trigger()
				.then((data) => {
					if (!data) return
					
					updateRoom({
						...form.getValues(),
						id: room.id,
					})
						.then(data => {
							if (data == null) {
								toast.error("Failed to update room")
								return
							}

							setRoom(() => ({
								id: room.id,
								partitions: room.partitions,
								...form.getValues()
							}))
							toast.success("Room updated successfully")
							setEditing(() => false)
						})
				})
				.catch(error => {
					console.log(error)
					toast.error("Failed to update room")
				})
		} else {
			setEditing(() => true)
		}
	}

	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const handleDelete = () => {
		deleteRoom(room?.id ?? 0)
			.then(data => {
				if (data) {
					router.push(`/dashboard/rooms?message=Room deleted successfully`)
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

	const partitions = useMemo(() => {
		if (!room) return []

		// if (floorFilter === "all") return room.partitions

		// return room.partitions.filter(partition => partition.toString() === floorFilter)
		return room.partitions
	// }, [floorFilter, room])
	}, [room])
	
  useEffect(() => {
		const id = Number(searchParams.get("id"))

		if (!id) return;

    fetchRoom(id)
      .then((data) => {
				if (data == null) {
					router.push(`/dashboard/rooms`)
				} else {
					setRoom(data);
				}
      })
      .catch((error) => {
        console.log(error);
      });
  }, [fetchRoom, searchParams, router]);

	useEffect(() => {
		if (!room) return;

		form.reset({
			number: room.number,
			floorNumber: room.floorNumber,
			buildingId: Number(room.buildingId),
		})
	}, [room, form])
	
	useEffect(() => {
		setCreating(searchParams.get("create") === "true");
		setEditing(searchParams.get("edit") === "true");
	}, [searchParams])
	
  return !creating && !room ? <>Loading</> : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
					{/* back button */}
					<Link href="/dashboard/rooms">
					<Button className="mr-2 p-1 px-2" size="sm"><ChevronLeftIcon size={3} /></Button>
					</Link>
					<Label className="text-xl font-bold">{creating ? "Create Room" : editing ? "Edit Room" : "View Room"}</Label>
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
							router.back()
						} else if (editing) {
							setEditing(() => false);
							form.reset({
								floorNumber: room?.floorNumber,
								number: room?.number,
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
							Delete Room
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this room?
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
								name="number"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Room Number</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Room Number"
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
								name="floorNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Floor Number</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Floor Number"
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
											defaultValue={room?.buildingId?.toString() ?? ""}
											disabled={!creating && !editing}
										>
											<SelectTrigger>
												<SelectValue placeholder={selectedBuilding?.name || "Select a building"} />
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
						</div>
					</form>
				</Form>

				{
					creating ? null : <div className="flex flex-col justify-center gap-4">
						<div className="flex items-center justify-between">
							<div className="flex flex-col gap-2">
								<Label className="font-bold text-xl">Offices</Label>
								{/* <Select onValueChange={floorFilterChange}>
									<SelectTrigger className="w-[150px]">
										<SelectValue placeholder="Floor Number" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Floors</SelectItem>
										{Array.from({ length: building?.noOfFloors || 0 }).map((_, i) => (
											<SelectItem key={i + 1} value={(i + 1).toString()}>
												Floor {i + 1}
											</SelectItem>
										))}
									</SelectContent>
								</Select> */}
							</div>

							<div className="flex gap-2 items-center">
								<Link href={`/dashboard/partitions/view?create=true&roomId=${room?.id}`}>
									<Button>Add Partitions</Button>
								</Link>
							</div>
						</div>

						<DataTable columns={columns} data={partitions} />
					</div>
				}
      </div>
    </div>
  );
}