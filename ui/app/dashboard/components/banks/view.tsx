import { usePropertyStore } from "@/lib/store/property";
import { Bank } from "@/lib/types";
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
import { DataTable } from "./data-table";
import { columns } from "./columns";

const formSchema = z.object({
	name: z.string(),
	branch: z.string(),
	accountNumber: z.string(),
	ownerName: z.string(),
})

export default function ViewRoom() {
	const [creating, setCreating] = useState(false);
	const [editing, setEditing] = useState(false);
	const [bank, setBank] = useState<Bank | null>(null);
	const router = useRouter();
	const { banks, fetchBank, createBank, updateBank, deleteBank } = usePropertyStore();

	const form = useForm<z.infer<typeof formSchema>>({
		mode: "onChange",
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: bank?.name ?? "",
			branch: bank?.branch ?? "",
			accountNumber: bank?.accountNumber ?? "",
			ownerName: bank?.ownerName ?? "",
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

					return createBank(form.getValues())
				})
				.then(data => {
					console.log(form.getValues())
					
					if (data) {
						router.push(`/dashboard/banks?message=Bank created successfully`)
					} else {
						console.log('error')
					}
				})
		} else if (editing) {
			if (!bank) return

			form.trigger()
				.then((data) => {
					if (!data) return
					
					updateBank({
						...form.getValues(),
						id: bank.id,
					})
						.then(data => {
							if (data == null) {
								toast.error("Failed to update bank")
								return
							}

							setBank(() => ({
								id: bank.id,
								...form.getValues()
							}))
							toast.success("Bank updated successfully")
							setEditing(() => false)
						})
				})
				.catch(error => {
					console.log(error)
					toast.error("Failed to update bank")
				})
		} else {
			setEditing(() => true)
		}
	}

	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

	const handleDelete = () => {
		deleteBank(bank?.id ?? 0)
			.then(data => {
				if (data) {
					router.push(`/dashboard/banks?message=Bank deleted successfully`)
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

    fetchBank(id)
      .then((data) => {
				if (data == null) {
					router.push(`/dashboard/banks`)
				} else {
					setBank(data);
				}
      })
      .catch((error) => {
        console.log(error);
      });
  }, [fetchBank, searchParams, router]);

	useEffect(() => {
		if (!bank) return;

		form.reset({
			name: bank?.name
		})
	}, [bank, form])
	
	useEffect(() => {
		setCreating(searchParams.get("create") === "true");
		setEditing(searchParams.get("edit") === "true");
	}, [searchParams])
	
  return !creating && !bank ? <>Loading</> : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
					{/* back button */}
					<Link href="/dashboard/rooms">
					<Button className="mr-2 p-1 px-2" size="sm"><ChevronLeftIcon size={3} /></Button>
					</Link>
					<Label className="text-xl font-bold">{creating ? "Create Bank" : editing ? "Edit Bank" : "View Bank"}</Label>
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
								name: bank?.name
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
							Delete Bank
						</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this bank?
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
						className="flex flex-col gap-2 w-full mx-auto"
					>
						<div className="grid grid-cols-4 gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Bank Name"
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
								name="branch"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Branch</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Branch"
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
								name="accountNumber"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Account Number</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Account Number"
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
								name="ownerName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Owner Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												placeholder="Owner Name"
												readOnly={!creating && !editing}
												className={editing || creating ? "bg-white" : "opacity-60 cursor-default"}
											/>
										</FormControl>
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
								<Link href={`/dashboard/banks/view?create=true&roomId=${bank?.id}`}>
									<Button>Add Banks</Button>
								</Link>
							</div>
						</div>

						<DataTable columns={columns} data={banks} />
					</div>
				}
      </div>
    </div>
  );
}