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
import { axios } from "@/lib/axios";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Define month names as a const tuple for Zod
const monthNames = [
  "መስከረም", // Meskerem (Month 1)
  "ጥቅምት", // Tikimt (Month 2)
  "ህዳር", // Hidar (Month 3)
  "ታህሳስ", // Tahsas (Month 4)
  "ጥር", // Tir (Month 5)
  "የካቲት", // Yekatit (Month 6)
  "መጋቢት", // Megabit (Month 7)
  "ሚያዝያ", // Miazia (Month 8)
  "ግንቦት", // Ginbot (Month 9)
  "ሰኔ", // Sene (Month 10)
  "ሐምሌ", // Hamle (Month 11)
  "ነሐሴ", // Nehase (Month 12)
  "ጳጉሜ", // Pagumē (Month 13)
] as const;

const roomForm = z.object({
  buildingId: z.string().optional(),
  roomId: z.string().optional(),
});

const dateForm = z.object({
  day: z.coerce.number().optional(),
  month: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
});

const formSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  address: z.string().optional(),
  tinNumber: z.string().optional(),
  isShareholder: z.boolean().optional(),
  startDate: z.array(dateForm).optional(),
  endDate: z.array(dateForm).optional(),
  agreementFile: z
    .instanceof(File)
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "application/pdf"].includes(file.type),
      "Only JPEG, PNG, or PDF files are allowed"
    )
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .optional(),
  paymentIntervalInMonths: z.string(),
  paymentAmountPerMonth: z.object({
    base: z.coerce.number().min(0),
    utility: z.coerce.number().min(0).optional(),
  }),
  deposit: z.coerce.number().min(0).optional(),
  lateFee: z.coerce.number().optional(),
  lateFeeType: z.string().optional(),
  rooms: z.array(roomForm).optional(),
  initialPaymentAmount: z.coerce.number().min(0).optional(),
  initialPaymentDate: z.coerce.date().optional(),
});

export default function ViewTenant() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const router = useRouter();
  const { fetchTenants, fetchTenant, updateTenant, deleteTenant } =
    useTenantStore();
  const { buildings, fetchBuildings, rooms, fetchRooms } = usePropertyStore();

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

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
      name: "",
      phone: "",
      address: "",
      tinNumber: "",
      isShareholder: false,
      startDate: [{ day: undefined, month: undefined, year: undefined }],
      endDate: [{ day: undefined, month: undefined, year: undefined }],
      rooms: [{}],
      paymentIntervalInMonths: "1",
      paymentAmountPerMonth: { base: 0 },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms",
  });

  const startDate = useFieldArray({
    control: form.control,
    name: "startDate",
  });

  const endDate = useFieldArray({
    control: form.control,
    name: "endDate",
  });

  const searchParams = useSearchParams();

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append("name", values.name);
    if (values.phone) formData.append("phone", values.phone);
    if (values.address) formData.append("address", values.address);
    if (values.tinNumber) formData.append("tinNumber", values.tinNumber);
    if (values.startDate)
      formData.append("startDate", JSON.stringify(values.startDate));
    if (values.endDate)
      formData.append("endDate", JSON.stringify(values.endDate));
    if (values.agreementFile)
      formData.append("agreementFile", values.agreementFile);
    formData.append(
      "paymentAmountPerMonth",
      JSON.stringify(values.paymentAmountPerMonth)
    );
    formData.append("rooms", JSON.stringify(values.rooms));
    if (values.deposit) formData.append("deposit", values.deposit.toString());
    if (values.lateFee) formData.append("lateFee", values.lateFee.toString());
    if (values.lateFeeType) formData.append("lateFeeType", values.lateFeeType);
    if (values.paymentIntervalInMonths)
      formData.append(
        "paymentIntervalInMonths",
        values.paymentIntervalInMonths
      );
    if (values.initialPaymentAmount)
      formData.append(
        "initialPaymentAmount",
        values.initialPaymentAmount.toString()
      );
    if (values.initialPaymentDate)
      formData.append(
        "initialPaymentDate",
        values.initialPaymentDate.toISOString()
      );
    formData.append("isShareholder", values.isShareholder ? "true" : "false");

    form
      .trigger()
      .then((data) => {
        if (!data) throw new Error();
        return axios.post("/tenant", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      })
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          toast.success("Tenant created successfully");
          router.push("/dashboard/tenants");
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response?.data?.message ?? "Failed to create tenant");
      });
  };

  const buttonClicked = () => {
    if (creating) {
      form
        .trigger()
        .then((data) => {
          console.log(data)
          if (!data) throw new Error();
          handleSubmit(form.getValues());
        })
        .catch((error) => console.log(error));
    } else if (editing) {
      if (!tenant) return;
      form
        .trigger()
        .then((data) => {
          if (!data) return;
          updateTenant({ ...form.getValues(), id: tenant.id }).then((data) => {
            if (data == null) {
              toast.error("Failed to update tenant");
              return;
            }
            setTenant(() => ({ id: tenant.id, ...form.getValues() }));
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
        if (data)
          router.push(`/dashboard/tenants?message=Tenant deleted successfully`);
        else console.log("error");
      })
      .catch((error) => console.log(error));
  };

  const leases = useMemo(() => tenant?.leases ?? [], [tenant]);

  useEffect(() => {
    const id = Number(searchParams.get("id"));
    if (!id) return;
    fetchTenant(id)
      .then((data) => {
        if (data == null) router.push(`/dashboard/tenants`);
        else setTenant(data);
      })
      .catch((error) => console.log(error));
  }, [fetchTenant, searchParams, router]);

  // Assuming Tenant type has startDate and endDate as Date or similar
  useEffect(() => {
    if (!tenant) return;

    console.log(tenant.leases)
    
    // Convert Date to Ethiopian format if needed (assuming tenant.leases uses Date)
    const startDate = tenant.leases?.[0]?.startDate
      ? [
          {
            // year: tenant.leases[0].startDate.getFullYear(), // Adjust for Ethiopian year if necessary
            // month: tenant.leases[0].startDate.getMonth(), // Simplified; adjust for Ethiopian calendar
            // day: tenant.leases[0].startDate.getDate(),
          },
        ]
      : [{ day: undefined, month: undefined, year: undefined }];
    const endDate = tenant.leases?.[0]?.endDate
      ? [
          {
            // year: tenant.leases[0].endDate.getFullYear(),
            // month: tenant.leases[0].endDate.getMonth(),
            // day: tenant.leases[0].endDate.getDate(),
          },
        ]
      : [{ day: undefined, month: undefined, year: undefined }];

    form.reset({
      name: tenant.name,
      phone: tenant.phone,
      address: tenant.address,
      tinNumber: tenant.tinNumber,
      isShareholder: tenant.isShareholder,
      startDate,
      endDate,
      paymentIntervalInMonths:
        tenant.leases?.[0]?.paymentIntervalInMonths?.toString() ?? "1",
      paymentAmountPerMonth: {
        base: tenant.leases?.[0]?.paymentAmountPerMonth?.base ?? 0,
        utility: tenant.leases?.[0]?.paymentAmountPerMonth?.utility ?? 0,
      },
      deposit: tenant.leases?.[0]?.deposit ?? 0,
      lateFee: tenant.leases?.[0]?.lateFee ?? 0,
      lateFeeType: tenant.leases?.[0]?.lateFeeType ?? "",
    });
  }, [tenant, form]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const getDaysInMonth = (
    monthIndex: number | undefined,
    year: number | undefined
  ) => {
    if (!monthIndex || year === undefined) return [];
    if (monthIndex >= monthNames.length) return [];
    
    const month = monthNames[monthIndex];
    
    const isPagume = month === "ጳጉሜ";
    const dayCount = isPagume ? (year % 4 === 3 ? 6 : 5) : 30;
    return Array.from({ length: dayCount }, (_, idx) => idx + 1);
  };

  return !creating && !tenant ? (
    <>Loading</>
  ) : (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center mb-4">
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
                  isShareholder: tenant?.isShareholder,
                  startDate: tenant?.leases?.[0]?.startDate
                    ? [
                        {
                          year: tenant.leases[0].startDate.getFullYear(),
                          month:
                            tenant.leases[0].startDate.getMonth(),
                          day: tenant.leases[0].startDate.getDate(),
                        },
                      ]
                    : [{ day: undefined, month: undefined, year: undefined }],
                  endDate: tenant?.leases?.[0]?.endDate
                    ? [
                        {
                          year: tenant.leases[0].endDate.getFullYear(),
                          month:
                            tenant.leases[0].endDate.getMonth(),
                          day: tenant.leases[0].endDate.getDate(),
                        },
                      ]
                    : [{ day: undefined, month: undefined, year: undefined }],
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
            <div className="grid grid-cols-3 gap-4 mx-8">
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
              <FormField
                control={form.control}
                name="isShareholder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!creating && !editing}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel
                        className={cn(
                          "cursor-pointer",
                          !creating && !editing
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        )}
                      >
                        Shareholder
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {(creating || editing) && (
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
                          name={`rooms.${index}.buildingId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Building</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(`rooms.${index}.roomId`, "");
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
                          name={`rooms.${index}.roomId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Room</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={
                                  !form.watch(`rooms.${index}.buildingId`)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Room" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {rooms
                                    .filter(room => !room.occupied)
                                    .filter(
                                      (room) =>
                                        room.buildingId?.toString() ===
                                        form.watch(`rooms.${index}.buildingId`)
                                    )
                                    .map((room) => (
                                      <SelectItem
                                        key={room.id}
                                        value={room.id.toString()}
                                      >
                                        {room.name}
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
                      onClick={() => append({ buildingId: "", roomId: "" })}
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
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

                  <div className="grid grid-cols-2 gap-4">
                    {/* Start Date */}
                    <div className="flex flex-col gap-4">
                      {startDate.fields.map((field, index) => (
                        <div key={field.id}>
                          <FormLabel>Start Date</FormLabel>
                          <div className="flex items-center gap-4 w-full">
                            <FormField
                              control={form.control}
                              name={`startDate.${index}.year`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Year" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 50 }).map(
                                        (_, idx) => {
                                          const year = 2010 + idx; // Adjust for Ethiopian year if needed
                                          return (
                                            <SelectItem
                                              key={year}
                                              value={year.toString()}
                                            >
                                              {year}
                                            </SelectItem>
                                          );
                                        }
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`startDate.${index}.month`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Month" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {monthNames.map((month, idx) => (
                                        <SelectItem key={month} value={(idx+1).toString()}>
                                          {month}
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
                              name={`startDate.${index}.day`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString() ?? ""}
                                    disabled={
                                      !form.watch(`startDate.${index}.month`)
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Day" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getDaysInMonth(
                                        form.watch(`startDate.${index}.month`),
                                        form.watch(`startDate.${index}.year`)
                                      ).map((day) => (
                                        <SelectItem
                                          key={day}
                                          value={day.toString()}
                                        >
                                          {day}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* End Date */}
                    <div className="flex flex-col gap-4">
                      {endDate.fields.map((field, index) => (
                        <div key={field.id}>
                          <FormLabel>End Date</FormLabel>
                          <div className="flex items-center gap-4 w-full">
                            <FormField
                              control={form.control}
                              name={`endDate.${index}.year`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Year" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Array.from({ length: 50 }).map(
                                        (_, idx) => {
                                          const year = 2010 + idx;
                                          return (
                                            <SelectItem
                                              key={year}
                                              value={year.toString()}
                                            >
                                              {year}
                                            </SelectItem>
                                          );
                                        }
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`endDate.${index}.month`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString()}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Month" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {monthNames.map((month, idx) => (
                                        <SelectItem key={month} value={(idx+1).toString()}>
                                          {month}
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
                              name={`endDate.${index}.day`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value?.toString() ?? ""}
                                    disabled={
                                      !form.watch(`endDate.${index}.month`)
                                    }
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Day" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getDaysInMonth(
                                        form.watch(`endDate.${index}.month`),
                                        form.watch(`endDate.${index}.year`)
                                      ).map((day) => (
                                        <SelectItem
                                          key={day}
                                          value={day.toString()}
                                        >
                                          {day}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="lateFeeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Fee Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
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
                                  : field.value ?? ""
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
                              onChange={(e) =>
                                field.onChange(
                                  e.target.files ? e.target.files[0] : null
                                )
                              }
                              ref={field.ref}
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
              </div>
              <div className="flex gap-2 items-center">
                <Link href={`/dashboard/leases/view?tenantId=${tenant?.id}`}>
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
