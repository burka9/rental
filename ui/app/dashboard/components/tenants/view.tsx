import { Tenant } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { DataTable } from "./lease/data-table";
import { columns } from "./lease/columns";
import { useTenantStore } from "@/lib/store/tenants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePropertyStore } from "@/lib/store/property";
import { useStore } from "@/lib/store";
import { axios } from "@/lib/axios";

const officeForm = z.object({
  buildingId: z.string(),
  roomId: z.string(),
  officeId: z.string(),
});

const formSchema = z.object({
  // tenant info
  name: z.string(),
  phone: z.string(),
  address: z.string(),
  tinNumber: z.string(),

  // lease info
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  agreementFile: z
    .instanceof(File)
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
      "Only JPEG, PNG, or PDF files are allowed"
    )
    .refine(
      (file) => file.size <= 5 * 1024 * 1024, // 5MB limit
      "File size must be less than 5MB"
    ),
  // paymentType: z.string(),
  paymentIntervalInMonths: z.string(), // it should be a number
  paymentAmountPerMonth: z.object({
    base: z.coerce.number().min(0),
    utility: z.coerce.number().min(0),
  }),
  deposit: z.coerce.number().min(0),
  lateFee: z.coerce.number().min(0),
  lateFeeType: z.string(),
  offices: z.array(officeForm),
  initialPaymentAmount: z.coerce.number().min(0),
  initialPaymentDate: z.coerce.date().optional(),
});

export default function ViewTenant() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const router = useRouter();
  const {
    fetchTenants,
    fetchTenant,
    updateTenant,
    deleteTenant,
  } = useTenantStore();

  const {
    buildings,
    fetchBuildings,
    rooms,
    fetchRooms,
    partitions,
    fetchPartitions,
  } = usePropertyStore();

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);
  useEffect(() => {
    fetchPartitions();
  }, [fetchPartitions]);

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tenant?.name ?? "",
      phone: tenant?.phone ?? "",
      address: tenant?.address ?? "",
      tinNumber: tenant?.tinNumber ?? "",
      // startDate: tenant?.leases[0]?.startDate ?? "",
      // endDate: tenant?.leases[0]?.endDate ?? "",
      // paymentType: tenant?.leases[0]?.paymentType ?? "",
      // paymentIntervalInMonths: tenant?.leases[0]?.paymentIntervalInMonths ?? 1,
      // paymentAmountPerMonth: {
      // 	base: tenant?.leases[0]?.paymentAmountPerMonth?.base ?? 0,
      // 	utility: tenant?.leases[0]?.paymentAmountPerMonth?.utility ?? 0,
      // },
      // deposit: tenant?.leases[0]?.deposit ?? 0,
      // lateFee: tenant?.leases[0]?.lateFee ?? 0,
      // lateFeeType: tenant?.leases[0]?.lateFeeType ?? "",
      offices: [{}],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "offices",
  });

  const searchParams = useSearchParams();

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  const { user } = useStore();

  const buttonClicked = () => {
    if (creating) {
      console.log(form.getValues());

      const formData = new FormData();

      formData.append("name", form.getValues().name);
      formData.append("phone", form.getValues().phone);
      formData.append("address", form.getValues().address);
      formData.append("tinNumber", form.getValues().tinNumber);

      formData.append("offices", JSON.stringify(form.getValues().offices));

      formData.append("startDate", form.getValues().startDate.toString());
      formData.append("endDate", form.getValues().endDate.toString());
      formData.append("lateFee", form.getValues().lateFee.toString());
      formData.append("lateFeeType", form.getValues().lateFeeType);

      formData.append(
        "paymentIntervalInMonths",
        form.getValues().paymentIntervalInMonths
      );
      formData.append(
        "paymentAmountPerMonth",
        JSON.stringify(form.getValues().paymentAmountPerMonth)
      );
      formData.append("deposit", form.getValues().deposit.toString());

			try {
				formData.append(
					"initialPaymentDate",
					(form.getValues().initialPaymentDate || "").toString()
				);
			} catch {
			}

      formData.append(
        "initialPaymentAmount",
        form.getValues().initialPaymentAmount.toString()
      );

      formData.append("agreementFile", form.getValues().agreementFile);

      form
        .trigger()
        .then((data) => {
          if (!data) throw new Error();

          return axios.post("/tenant", formData, {
            headers: {
              Authorization: `Bearer ${user?.token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        })
        .then((data) => {
          console.log(form.getValues());

          if (data) {
            router.push(
              `/dashboard/tenants?message=Tenant created successfully`
            );
          } else {
            toast.error("Failed to create tenant");
          }
        });
    } else if (editing) {
      if (!tenant) return;

      form
        .trigger()
        .then((data) => {
          if (!data) return;

          updateTenant({
            ...form.getValues(),
            id: tenant.id,
          }).then((data) => {
            if (data == null) {
              toast.error("Failed to update tenant");
              return;
            }

            setTenant(() => ({
              id: tenant.id,
              ...form.getValues(),
            }));
            toast.success("Tenant updated successfully");
            setEditing(() => false);
          });
        })
        .catch((error) => {
          console.log(error);
          toast.error("Failed to update tenant");
        });
    } else {
      setEditing(() => true);
    }
  };

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDelete = () => {
    deleteTenant(tenant?.id ?? 0)
      .then((data) => {
        if (data) {
          router.push(`/dashboard/tenants?message=Tenant deleted successfully`);
        } else {
          console.log("error");
        }
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // const [floorFilter, setFloorFilter] = useState<string>("all")

  // const floorFilterChange = (value: string) => {
  // 	setFloorFilter(value)
  // }

  const leases = useMemo(() => {
    if (!tenant) return [];

    // if (floorFilter === "all") return room.partitions

    // return room.partitions.filter(partition => partition.toString() === floorFilter)
    return tenant.leases ?? [];
  }, [tenant]);

  useEffect(() => {
    const id = Number(searchParams.get("id"));

    if (!id) return;

    fetchTenant(id)
      .then((data) => {
        if (data == null) {
          router.push(`/dashboard/tenants`);
        } else {
          setTenant(data);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [fetchTenant, searchParams, router]);

  useEffect(() => {
    if (!tenant) return;

    form.reset({
      name: tenant.name,
      phone: tenant.phone,
      address: tenant.address,
      tinNumber: tenant.tinNumber,
      // startDate: tenant.leases[0]?.startDate ?? "",
      // endDate: tenant.leases[0]?.endDate ?? "",
      // paymentType: tenant.leases[0]?.paymentType ?? "",
      // paymentIntervalInMonths: tenant.leases[0]?.paymentIntervalInMonths ?? 1,
      // paymentAmountPerMonth: {
      // 	base: tenant.leases[0]?.paymentAmountPerMonth?.base ?? 0,
      // 	utility: tenant.leases[0]?.paymentAmountPerMonth?.utility ?? 0,
      // },
      // deposit: tenant.leases[0]?.deposit ?? 0,
      // lateFee: tenant.leases[0]?.lateFee ?? 0,
      // lateFeeType: tenant.leases[0]?.lateFeeType ?? "",
      // lateFeeGracePeriodInDays: tenant.leases[0]?.lateFeeGracePeriodInDays ?? 0,
    });
  }, [tenant, form]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  return !creating && !tenant ? (
    <>Loading</>
  ) : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
          {/* back button */}
          <Link href="/dashboard/tenants">
            <Button className="mr-2 p-1 px-2" size="sm">
              <ChevronLeftIcon size={3} />
            </Button>
          </Link>
          <Label className="text-xl font-bold">
            {creating
              ? "Create Tenant"
              : editing
              ? "Edit Tenant"
              : "View Tenant"}
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Button size="default" onClick={buttonClicked}>
            {creating ? "Create" : editing ? "Save Changes" : "Edit"}
          </Button>
          <Button
            size="default"
            variant={creating ? "outline" : editing ? "outline" : "destructive"}
            onClick={() => {
              if (creating) {
                setCreating(() => false);
                router.back();
              } else if (editing) {
                setEditing(() => false);
                form.reset({
                  name: tenant?.name,
                  phone: tenant?.phone,
                  address: tenant?.address,
                  tinNumber: tenant?.tinNumber,
                  // startDate: tenant?.leases[0]?.startDate ?? "",
                  // endDate: tenant?.leases[0]?.endDate ?? "",
                  // paymentType: tenant?.leases[0]?.paymentType ?? "",
                  // paymentIntervalInMonths: tenant?.leases[0]?.paymentIntervalInMonths ?? 1,
                  // paymentAmountPerMonth: {
                  // 	base: tenant?.leases[0]?.paymentAmountPerMonth?.base ?? 0,
                  // 	utility: tenant?.leases[0]?.paymentAmountPerMonth?.utility ?? 0,
                  // },
                  // deposit: tenant?.leases[0]?.deposit ?? 0,
                  // lateFee: tenant?.leases[0]?.lateFee ?? 0,
                  // lateFeeType: tenant?.leases[0]?.lateFeeType ?? "",
                  // lateFeeGracePeriodInDays: tenant?.leases[0]?.lateFeeGracePeriodInDays ?? 0,
                });
              } else {
                setOpenDeleteDialog(true);
              }
            }}
          >
            {creating ? "Cancel" : editing ? "Cancel" : "Delete"}
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-8">
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant?
            </DialogDescription>
            <DialogFooter>
              <Button variant="destructive" onClick={handleDelete}>
                Yes
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpenDeleteDialog(() => false)}
              >
                No
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-col gap-2 w-full mx-auto"
          >
            <Label className="text-xl">Tenant Information</Label>
            <div className="grid grid-cols-4 gap-4 mx-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tenant Name"
                        readOnly={!creating && !editing}
                        className={
                          editing || creating
                            ? "bg-white"
                            : "opacity-60 cursor-default"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tenant Phone"
                        readOnly={!creating && !editing}
                        className={
                          editing || creating
                            ? "bg-white"
                            : "opacity-60 cursor-default"
                        }
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
                    <FormLabel>Tenant Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tenant Address"
                        readOnly={!creating && !editing}
                        className={
                          editing || creating
                            ? "bg-white"
                            : "opacity-60 cursor-default"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tinNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant TIN</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tenant TIN"
                        readOnly={!creating && !editing}
                        className={
                          editing || creating
                            ? "bg-white"
                            : "opacity-60 cursor-default"
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {creating && (
              <>
                <Label className="text-xl mt-4">Office Information</Label>
                <div className="flex flex-col gap-2 mx-8">
                  <div className="flex flex-col items-center gap-4">
                    {fields.map((field, index) => (
                      <div
                        className="grid grid-cols-4 gap-4 w-full"
                        key={field.id}
                      >
                        <FormField
                          control={form.control}
                          name={`offices.${index}.buildingId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Building</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Reset room and office when building changes
                                  form.setValue(`offices.${index}.roomId`, "");
                                  form.setValue(
                                    `offices.${index}.officeId`,
                                    ""
                                  );
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Building" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {buildings.map((bldg) => (
                                    <SelectItem
                                      key={bldg.id}
                                      value={bldg.id.toString()}
                                    >
                                      {bldg.name}
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
                          name={`offices.${index}.roomId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Room</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  // Reset office when room changes
                                  form.setValue(
                                    `offices.${index}.officeId`,
                                    ""
                                  );
                                }}
                                value={field.value}
                                disabled={
                                  !form.watch(`offices.${index}.buildingId`)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Room" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {rooms
                                    .filter(
                                      (room) =>
                                        room.buildingId?.toString() ===
                                        form.watch(
                                          `offices.${index}.buildingId`
                                        )
                                    )
                                    .map((room) => (
                                      <SelectItem
                                        key={room.id}
                                        value={room.id.toString()}
                                      >
                                        {room.number}
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
                          name={`offices.${index}.officeId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Office</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={
                                  !form.watch(`offices.${index}.roomId`)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Office" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {partitions
																		.filter(
																			(part) =>
																				!part.occupied
																		)
                                    .filter(
                                      (part) =>
                                        part.roomId?.toString() ===
                                        form.watch(`offices.${index}.roomId`)
                                    )
                                    .map((office) => (
                                      <SelectItem
                                        key={office.id}
                                        value={office.id.toString()}
                                      >
                                        {office.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {fields.length > 1 && (
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <p
                      className="underline text-blue-600 cursor-pointer hover:no-underline"
                      onClick={() => {
                        append({
                          buildingId: "",
                          roomId: "",
                          officeId: "",
                        });
                      }}
                    >
                      + Add More Offices
                    </p>
                  </div>
                </div>
                <Label className="text-xl mt-4">
                  Lease Agreement Information
                </Label>
                <div className="flex flex-col gap-4 mx-8">
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="paymentIntervalInMonths"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Interval (Months)</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Payment Interval (Month)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 12 }).map((_, idx) => (
                                <SelectItem key={idx} value={`${idx + 1}`}>
                                  {idx + 1} Month
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
                      name="paymentAmountPerMonth.base"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Amount per Month</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Base Amount per Month"
                              type="number"
                              onBlur={(e) => {
                                if (
                                  !form.getValues().deposit ||
                                  Number(form.getValues().deposit) <
                                    Number(e.target.value)
                                ) {
                                  form.setValue(
                                    "deposit",
                                    Number(e.target.value)
                                  );
                                }
                              }}
                              min={0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentAmountPerMonth.utility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Utility Amount per Month</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} min={0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deposit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deposit Amount</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} min={0} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-5 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              placeholder="Start Date"
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split("T")[0]
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              placeholder="End Date"
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split("T")[0]
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lateFeeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Fee Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select late fee type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="PERCENTAGE">
                                Percentage
                              </SelectItem>
                              <SelectItem value="FIXED">Fixed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lateFee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Fee</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              min={0}
                              disabled={!form.getValues().lateFeeType}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <FormField
                      control={form.control}
                      name="initialPaymentAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Payment</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Initial Payment"
                              type="number"
                              min={0}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="initialPaymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initial Payment Date</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
                              placeholder="Initial Payment Date"
                              value={
                                field.value instanceof Date
                                  ? field.value.toISOString().split("T")[0]
                                  : field.value
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="agreementFile"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contract File</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files
                                  ? e.target.files[0]
                                  : null;
                                field.onChange(file); // Update form state with the file
                              }}
                              // Do not use value={field.value} to keep it uncontrolled
                              ref={field.ref} // Attach ref for focus management
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </>
            )}
          </form>
        </Form>

        {creating ? null : (
          <div className="flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2">
                <Label className="font-bold text-xl">Lease Agreements</Label>
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
                <Link
                  href={`/dashboard/leases/view?tenantId=${tenant?.id}`}
                >
                  <Button>Add Lease Agreement</Button>
                </Link>
              </div>
            </div>

            <DataTable columns={columns} data={leases} />
          </div>
        )}
      </div>
    </div>
  );
}
