import { usePropertyStore } from "@/lib/store/property";
import { Building } from "@/lib/types";
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
import { DataTable } from "./rooms/data-table";
import { columns } from "./rooms/columns";
// import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { SelectTrigger } from "@radix-ui/react-select";



const formSchema = z.object({
	name: z.string().min(1, "Name is required"),
	address: z.string(),
	noOfFloors: z.coerce.number().min(1, "Number of floors is required"),
})

export default function ViewBuilding() {
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState(false);
	const [building, setBuilding] = useState<Building | null>(null);
	const router = useRouter();

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: building?.name ?? "",
			address: building?.address ?? "",
			noOfFloors: building?.noOfFloors ?? 0,
		}
	})

  const searchParams = useSearchParams();
  const { fetchBuilding, createBuilding, updateBuilding, deleteBuilding } = usePropertyStore();

	const handleSubmit = (values: z.infer<typeof formSchema>) => {
		console.log(values)
	}
	
	const buttonClicked = () => {
		if (creating) {
			form.trigger()
				.then(data => {
					if (!data) return

					createBuilding(form.getValues())
						.then(data => {
							if (data) {
								router.push(`/dashboard/buildings?message=Building created successfully`)
							} else {
								console.log('error')
							}
						})
				})
				.catch(console.error)
		} else if (editing) {
			if (!building) return

			form.trigger()
				.then((data) => {
					if (!data) return
					
					updateBuilding({
						...form.getValues(),
						id: building.id
					})
						.then(data => {
							if (data == null) {
								toast.error("Failed to update building")
								return
							}

							setBuilding(() => ({
								id: building.id,
								rooms: building.rooms,
								...form.getValues()
							}))
							toast.success("Building updated successfully")
							setEditing(() => false)
						})
				})
				.catch(error => {
					console.log(error)
					toast.error("Failed to update building")
				})
		} else {
			setEditing(() => true)
		}
	}

	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const handleDelete = () => {
		deleteBuilding(building?.id ?? 0)
			.then(data => {
				if (data) {
					router.push(`/dashboard/buildings?message=Building deleted successfully`)
				} else {
					console.log('error')
				}
			})
			.catch(error => {
				console.log(error)
			})
	}
	
  useEffect(() => {
		const id = Number(searchParams.get("id"))

		if (!id) return;

    fetchBuilding(id)
      .then((data) => {
				if (data == null) {
					router.push(`/dashboard/buildings`)
				} else {
					setBuilding(data);
				}
      })
      .catch((error) => {
        console.log(error);
      });
  }, [fetchBuilding, searchParams, router]);

	useEffect(() => {
		if (!building) return;

		form.reset({
			name: building.name,
			address: building.address,
			noOfFloors: building.noOfFloors
		})
	}, [building, form])
	
	useEffect(() => {
		setCreating(searchParams.get("create") === "true");
		setEditing(searchParams.get("edit") === "true");
	}, [searchParams])
	
  return !creating && !building ? <>Loading...</> : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
					{/* back button */}
					<Link href="/dashboard/buildings">
					<Button className="mr-2 p-1 px-2" size="sm"><ChevronLeftIcon size={3} /></Button>
					</Link>
					<Label className="text-xl font-bold">{creating ? "Create Building" : editing ? "Edit Building" : "View Building"}</Label>
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
								name: building?.name ?? "",
								address: building?.address ?? "",
								noOfFloors: Number(building?.noOfFloors ?? ""),
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
							Delete Building
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this building?
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
						className="flex flex-col gap-2 max-w-md w-full mx-auto"
					>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Building Name</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Building Name"
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
							name="address"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Address</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Address"
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
							name="noOfFloors"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Number of Floors</FormLabel>
									<FormControl>
										<Input
											{...field}
											placeholder="Number of Floors"
											readOnly={!creating && !editing}
											className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>
				</Form>

				{
					creating ? null : <div className="flex flex-col justify-center gap-4">
						<div className="flex items-center justify-between">
							<Label className="font-bold text-xl">Rooms</Label>
							{/* <Select>
								<SelectTrigger>
									<SelectValue placeholder="Floor Number" />
								</SelectTrigger>
								<SelectContent>
									{Array.from({ length: building?.noOfFloors || 0 }).map((_, i) => (
										<SelectItem key={i + 1} value={(i + 1).toString()}>
											Floor {i + 1}
										</SelectItem>
									))}
								</SelectContent>
							</Select> */}
							<Link href={`/dashboard/rooms/view?create=true&buildingId=${building?.id}`}>
								<Button>Add Room</Button>
							</Link>
						</div>

						<DataTable columns={columns} data={building?.rooms || []} />
					</div>
				}
      </div>
    </div>
  );
}