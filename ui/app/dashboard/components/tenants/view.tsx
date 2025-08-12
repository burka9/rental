'use client'

import { Lease, ROLES, Tenant } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
// Icons
import { ChevronLeft, Loader2, X, FileSignature, FileCheck2 } from "lucide-react";
import Link from "next/link";

// Re-export ChevronLeft as ChevronLeftIcon for consistency with other components
const ChevronLeftIcon = ChevronLeft

// Custom Components
import { DataTable } from "./lease/data-table";
import { columns } from "./lease/columns";

// Store
import { useTenantStore } from "@/lib/store/tenants";
import { usePropertyStore } from "@/lib/store/property";
import { useStore } from "@/lib/store";

// Utils
import { cn } from "@/lib/utils";
import { GDate } from "ethiopian-gregorian-date-converter";

// Loading Skeleton
const FormFieldSkeleton = ({ label = true }: { label?: boolean }) => (
  <div className="space-y-2">
    {label && <Skeleton className="h-4 w-24" />}
    <Skeleton className="h-10 w-full" />
  </div>
)

const SectionSkeleton = ({ title = true }: { title?: boolean }) => (
  <Card className="animate-pulse">
    {title && (
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
    )}
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
        <FormFieldSkeleton />
      </div>
    </CardContent>
  </Card>
)

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
  buildingId: z.string().min(1, "Building is required"),
  roomId: z.string().min(1, "Room is required"),
});

const dateForm = z.object({
  day: z.coerce.number().min(1, "Day is required"),
  month: z.coerce.number().min(1, "Month is required"),
  year: z.coerce.number().min(1, "Year is required"),
});

const formSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  tinNumber: z.string().optional(),
  isShareholder: z.boolean().default(false),
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
  paymentIntervalInMonths: z.string().default("1"),
  paymentAmountPerMonth: z.object({
    base: z.coerce.number().min(0, "Base amount is required"),
    utility: z.coerce.number().min(0).optional(),
  }),
  deposit: z.coerce.number().min(0).optional(),
  lateFee: z.coerce.number().min(0).optional(),
  lateFeeType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
  rooms: z.array(roomForm).optional(),
  initialPaymentAmount: z.coerce.number().min(0).optional(),
  initialPaymentDate: z.coerce.date().optional(),
});

export default function ViewTenant() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useStore();
  
  // Initialize stores
  // useStore(); // Used for role-based access control via data-roles
  const { fetchTenants, fetchTenant, createTenant, updateTenant, deleteTenant } = useTenantStore();
  const { buildings, fetchBuildings, rooms, fetchRooms } = usePropertyStore();
  
  // State management
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Derived state
  const [creating, setCreating] = useState(searchParams.get('new') === 'true');
  const [editing, setEditing] = useState(searchParams.get('edit') === 'true');
  
  // Role-based access control is handled via data-roles attribute

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchTenants(),
          fetchBuildings(),
          fetchRooms()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load required data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [fetchTenants, fetchBuildings, fetchRooms]);

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
      paymentAmountPerMonth: { base: 0, utility: 0 },
      deposit: 0,
      lateFee: 0,
      lateFeeType: undefined,
      initialPaymentAmount: 0,
      initialPaymentDate: undefined,
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

  const leases = useMemo<Lease[]>(() => {
    if (!tenant || !tenant.leases) return [];
    return tenant.leases.map(lease => ({
      ...lease,
      startDate: new Date(lease.startDate),
      endDate: new Date(lease.endDate),
      active: lease.active ?? true
    }));
  }, [tenant]);

  useEffect(() => {
    const id = Number(searchParams.get("id"));
    if (!id) return;
    fetchTenant(id)
      .then((data) => {
        if (data == null) router.push(`/dashboard/tenants`);
        else setTenant(data);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Failed to fetch tenant");
      });
  }, [fetchTenant, searchParams, router]);

  useEffect(() => {
    if (!tenant) return;
    
    const startDate = [{ day: NaN, month: NaN, year: NaN }]
    const _start = new Date(tenant.leases?.[0]?.startDate ?? "");
    const gregStart = new GDate(_start.toDateString())
    const ethStart = gregStart.toEth()

    if (_start.toString() !== "Invalid Date") {
      startDate[0].day = ethStart.day
      startDate[0].month = ethStart.month
      startDate[0].year = ethStart.year
    }
    
    const endDate = [{ day: NaN, month: NaN, year: NaN }]
    const _end = new Date(tenant.leases?.[0]?.endDate ?? "");
    const gregEnd = new GDate(_end.toDateString())
    const ethEnd = gregEnd.toEth()
    if (_end.toString() !== "Invalid Date") {
      endDate[0].day = ethEnd.day
      endDate[0].month = ethEnd.month
      endDate[0].year = ethEnd.year
    }

    form.reset({
      name: tenant.name,
      phone: tenant.phone ?? "",
      address: tenant.address ?? "",
      tinNumber: tenant.tinNumber ?? "",
      isShareholder: tenant.isShareholder ?? false,
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
      lateFeeType: tenant.leases?.[0]?.lateFeeType ?? undefined,
      rooms: tenant.leases?.[0]?.roomIds?.map((roomId: number) => {
        const room = rooms.find((r) => String(r.id) === String(roomId));
        console.log(room)
        return {
          buildingId: room?.buildingId?.toString() ?? "",
          roomId: roomId.toString(),
        };
      }) ?? [{}],
      initialPaymentAmount: tenant.leases?.[0]?.initialPayment?.amount ?? 0,
      initialPaymentDate: tenant.leases?.[0]?.initialPayment?.paymentDate ?? undefined,
    });
  }, [tenant, form, rooms]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const handleSubmit = async (): Promise<void> => {
    // check user role
    if (user?.role !== ROLES.SUPERADMIN && user?.role !== ROLES.ADMIN) {
      toast.error("You do not have permission to perform this action");
      return;
    }
    
    setIsSubmitting(true);

    await form.trigger()

    try {
      if (form.formState.isValid) {
        console.log('valid')
      } else {
        console.log('invalid')
        return
      }
    
      const values = form.getValues();
      if (creating) {
        const formData = new FormData();
        formData.append("name", values.name);
        if (values.phone) formData.append("phone", values.phone);
        if (values.address) formData.append("address", values.address);
        if (values.tinNumber) formData.append("tinNumber", values.tinNumber);
        if (values.startDate) formData.append("startDate", JSON.stringify(values.startDate));
        if (values.endDate) formData.append("endDate", JSON.stringify(values.endDate));
        if (values.agreementFile) formData.append("agreementFile", values.agreementFile);
        formData.append("paymentAmountPerMonth", JSON.stringify(values.paymentAmountPerMonth));
        formData.append("rooms", JSON.stringify(values.rooms));
        if (values.deposit) formData.append("deposit", values.deposit.toString());
        if (values.lateFee) formData.append("lateFee", values.lateFee.toString());
        if (values.lateFeeType) formData.append("lateFeeType", values.lateFeeType);
        formData.append("paymentIntervalInMonths", values.paymentIntervalInMonths);
        if (values.initialPaymentAmount) formData.append("initialPaymentAmount", values.initialPaymentAmount.toString());
        if (values.initialPaymentDate) formData.append("initialPaymentDate", values.initialPaymentDate.toISOString());
        formData.append("isShareholder", values.isShareholder ? "true" : "false");

        const data = await createTenant(formData);
        if (data) {
          toast.success("Tenant created successfully");
          router.push("/dashboard/tenants");
          return;
        }
        toast.error("Failed to create tenant");
      } else if (editing && tenant) {
        const formData = new FormData();
        formData.append("id", tenant.id.toString())
        if (values.phone) formData.append("phone", values.phone);
        if (values.address) formData.append("address", values.address);
        if (values.tinNumber) formData.append("tinNumber", values.tinNumber);
        formData.append("isShareholder", values.isShareholder ? "true" : "false");
        
        const data = await updateTenant(formData);
        if (data) {
          toast.success("Tenant updated successfully");
          router.push("/dashboard/tenants");
          return;
        }
        toast.error("Failed to update tenant");
      }
    } catch (error: unknown) {
      const handleError = (error: unknown): void => {
        console.error('Error:', error);
        toast.error('An error occurred. Please try again.');
      };
      handleError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!tenant?.id) return;

    setIsDeleting(true);
  try {
    const success = await deleteTenant(tenant.id);
    if (success) {
      toast.success('Tenant deleted successfully');
      router.push('/dashboard/tenants');
    } else {
      toast.error('Failed to delete tenant');
    }
  } catch (error) {
    console.error('Error deleting tenant:', error);
    toast.error('An error occurred while deleting the tenant');
  } finally {
    setIsDeleting(false);
    setOpenDeleteDialog(false);
  }
};

const getDaysInMonth = (monthIndex: number | undefined, year: number | undefined) => {
  if (!monthIndex || year === undefined) return [];
  if (monthIndex > monthNames.length || monthIndex < 1) return [];

  const adjustedMonthIndex = monthIndex - 1; // Adjust for 0-based index
  const month = monthNames[adjustedMonthIndex];
  const isPagume = month === "ጳጉሜ";
  const dayCount = isPagume ? (year % 4 === 3 ? 6 : 5) : 30;
  return Array.from({ length: dayCount }, (_, idx) => idx + 1);
};

// Show loading state
if (!user || isLoading) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button variant="ghost">Overview</Button>
            <Button variant="ghost">Leases</Button>
            <Button variant="ghost">Payments</Button>
            <Button variant="ghost">Documents</Button>
          </div>
        </div>

        <div className="space-y-6">
          <SectionSkeleton title={false} />
          <SectionSkeleton title={false} />
        </div>
      </div>
    </div>
  );
}

return (
  <div className="container mx-auto py-6 space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {creating ? 'Add New Tenant' : tenant?.name || 'Tenant Details'}
          </h1>
          {!creating && tenant && (
            <p className="text-sm text-muted-foreground">
              Tenant ID: {tenant.id}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!creating && (
          <>
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (creating) {
                      router.push("/dashboard/tenants");
                    } else {
                      setEditing(false);
                      form.reset({
                        name: tenant?.name ?? "",
                        phone: tenant?.phone ?? "",
                        address: tenant?.address ?? "",
                        tinNumber: tenant?.tinNumber ?? "",
                        isShareholder: tenant?.isShareholder ?? false,
                        startDate: tenant?.leases?.[0]?.startDate
                          ? [{
                              year: tenant.leases[0].startDate.getFullYear(),
                              month: tenant.leases[0].startDate.getMonth() + 1,
                              day: tenant.leases[0].startDate.getDate(),
                            }]
                          : [{ day: undefined, month: undefined, year: undefined }],
                        endDate: tenant?.leases?.[0]?.endDate
                          ? [{
                              year: tenant.leases[0].endDate.getFullYear(),
                              month: tenant.leases[0].endDate.getMonth() + 1,
                              day: tenant.leases[0].endDate.getDate(),
                            }]
                          : [{ day: undefined, month: undefined, year: undefined }],
                        paymentIntervalInMonths: tenant?.leases?.[0]?.paymentIntervalInMonths?.toString() ?? "1",
                        paymentAmountPerMonth: {
                          base: tenant?.leases?.[0]?.paymentAmountPerMonth?.base ?? 0,
                          utility: tenant?.leases?.[0]?.paymentAmountPerMonth?.utility ?? 0,
                        },
                        deposit: tenant?.leases?.[0]?.deposit ?? 0,
                        lateFee: tenant?.leases?.[0]?.lateFee ?? 0,
                        lateFeeType: tenant?.leases?.[0]?.lateFeeType ?? undefined,
                        // rooms: tenant?.leases?.[0]?.roomIds?.map((roomId: number) => ({ buildingId: tenant?.leases?.[0]?.buildingId, roomId: roomId.toString() })) || [],
                      });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileCheck2 className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(true)}
                  disabled={isSubmitting}
                >
                  <FileSignature className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setOpenDeleteDialog(true)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {creating && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/tenants")}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.BUILDING_ADMIN]}
            onClick={() => handleSubmit()}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileCheck2 className="mr-2 h-4 w-4" />
            )}
            Create Tenant
          </Button>
        </div>
      )}
    </div>

      <div className="flex flex-col gap-8">
        <Dialog open={openDeleteDialog} onOpenChange={!isDeleting ? setOpenDeleteDialog : undefined}>
          <DialogContent>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone.
            </DialogDescription>
            <DialogFooter>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : 'Yes, delete'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setOpenDeleteDialog(false)}
                disabled={isDeleting}
              >
                No, cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <Card className="border-none shadow-md rounded-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Tenant Information</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Tenant Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter tenant name"
                            readOnly={!creating && !editing}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter phone number"
                            readOnly={!creating && !editing}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter address"
                            readOnly={!creating && !editing}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tinNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">TIN Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter TIN number"
                            readOnly={!creating && !editing}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isShareholder"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!creating && !editing}
                            className={cn(
                              !creating && !editing
                                ? "opacity-70 cursor-not-allowed"
                                : "border-gray-200"
                            )}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel
                            className={cn(
                              "text-gray-700",
                              !creating && !editing
                                ? "opacity-70 cursor-not-allowed"
                                : "cursor-pointer"
                            )}
                          >
                            Is Shareholder
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {(creating) && (
              <>
                <Card className="border-none shadow-md rounded-lg">
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Office Information</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" key={field.id}>
                          <FormField
                            control={form.control}
                            name={`rooms.${index}.buildingId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Select Building</FormLabel>
                                <Select
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    form.setValue(`rooms.${index}.roomId`, "");
                                  }}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <SelectValue placeholder="Select Building" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {buildings.map((bldg) => (
                                      <SelectItem key={bldg.id} value={bldg.id.toString()}>
                                        {bldg.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`rooms.${index}.roomId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">Select Room</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value}
                                  disabled={!form.watch(`rooms.${index}.buildingId`)}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "border-gray-200 rounded-md shadow-sm transition-all",
                                        !form.watch(`rooms.${index}.buildingId`)
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Select Room" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {rooms
                                      .filter((room) => !room.occupied)
                                      .filter(
                                        (room) =>
                                          room.buildingId?.toString() ===
                                          form.watch(`rooms.${index}.buildingId`)
                                      )
                                      .map((room) => (
                                        <SelectItem key={room.id} value={room.id.toString()}>
                                          {room.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                          {fields.length > 1 && (
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => remove(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          className="text-blue-600 hover:underline text-sm font-medium"
                          onClick={() => append({ buildingId: "", roomId: "" })}
                        >
                          + Add More Offices
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md rounded-lg">
                  <CardHeader>
                    <h2 className="text-xl font-semibold text-gray-900">Lease Agreement Information</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <FormField
                          control={form.control}
                          name="paymentIntervalInMonths"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Payment Interval (Months)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <SelectValue placeholder="Payment Interval" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({ length: 12 }).map((_, idx) => (
                                    <SelectItem key={idx} value={`${idx + 1}`}>
                                      {idx + 1} Month{idx + 1 > 1 ? "s" : ""}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="paymentAmountPerMonth.base"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Base Amount per Month</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter base amount"
                                  type="number"
                                  min={0}
                                  onBlur={(e) => {
                                    const baseAmount = Number(e.target.value);
                                    if (
                                      !form.getValues().deposit ||
                                      Number(form.getValues().deposit) < baseAmount
                                    ) {
                                      form.setValue("deposit", baseAmount);
                                    }
                                  }}
                                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="paymentAmountPerMonth.utility"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Utility Amount per Month</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  min={0}
                                  placeholder="Enter utility amount"
                                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="deposit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Deposit Amount</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  min={0}
                                  placeholder="Enter deposit amount"
                                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          {startDate.fields.map((field, index) => (
                            <div key={field.id}>
                              <FormLabel className="text-gray-700">Start Date (Ethiopian Calendar)</FormLabel>
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`startDate.${index}.year`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(Number(value));
                                          form.setValue(`startDate.${index}.day`, NaN);
                                        }}
                                        value={field.value?.toString() ?? ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          >
                                            <SelectValue placeholder="Year" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {Array.from({ length: 50 }).map((_, idx) => {
                                            const year = 2010 + idx; // Ethiopian year adjustment needed in real app
                                            return (
                                              <SelectItem key={year} value={year.toString()}>
                                                {year}
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`startDate.${index}.month`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(Number(value));
                                          form.setValue(`startDate.${index}.day`, NaN);
                                        }}
                                        value={field.value?.toString() ?? ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          >
                                            <SelectValue placeholder="Month" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {monthNames.map((month, idx) => (
                                            <SelectItem key={month} value={(idx + 1).toString()}>
                                              {month}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`startDate.${index}.day`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value?.toString() ?? ""}
                                        disabled={!form.watch(`startDate.${index}.month`)}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className={cn(
                                              "border-gray-200 rounded-md shadow-sm transition-all",
                                              !form.watch(`startDate.${index}.month`)
                                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            )}
                                          >
                                            <SelectValue placeholder="Day" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getDaysInMonth(
                                            form.watch(`startDate.${index}.month`),
                                            form.watch(`startDate.${index}.year`)
                                          ).map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                              {day}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-4">
                          {endDate.fields.map((field, index) => (
                            <div key={field.id}>
                              <FormLabel className="text-gray-700">End Date (Ethiopian Calendar)</FormLabel>
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`endDate.${index}.year`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(Number(value));
                                          form.setValue(`endDate.${index}.day`, NaN);
                                        }}
                                        value={field.value?.toString() ?? ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          >
                                            <SelectValue placeholder="Year" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {Array.from({ length: 50 }).map((_, idx) => {
                                            const year = 2010 + idx;
                                            return (
                                              <SelectItem key={year} value={year.toString()}>
                                                {year}
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`endDate.${index}.month`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(Number(value));
                                          form.setValue(`endDate.${index}.day`, NaN);
                                        }}
                                        value={field.value?.toString() ?? ""}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          >
                                            <SelectValue placeholder="Month" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {monthNames.map((month, idx) => (
                                            <SelectItem key={month} value={(idx + 1).toString()}>
                                              {month}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`endDate.${index}.day`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        onValueChange={(value) => field.onChange(Number(value))}
                                        value={field.value?.toString() ?? ""}
                                        disabled={!form.watch(`endDate.${index}.month`)}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className={cn(
                                              "border-gray-200 rounded-md shadow-sm transition-all",
                                              !form.watch(`endDate.${index}.month`)
                                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            )}
                                          >
                                            <SelectValue placeholder="Day" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getDaysInMonth(
                                            form.watch(`endDate.${index}.month`),
                                            form.watch(`endDate.${index}.year`)
                                          ).map((day) => (
                                            <SelectItem key={day} value={day.toString()}>
                                              {day}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* <FormField
                          control={form.control}
                          name="lateFeeType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Late Fee Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger
                                    className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <SelectValue placeholder="Select late fee type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                  <SelectItem value="FIXED">Fixed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        /> */}
                        {/* <FormField
                          control={form.control}
                          name="lateFee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Late Fee Percentage</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min={0}
                                  placeholder="Enter late fee percentage"
                                  className="border-gray-200 rounded-md shadow-sm transition-all"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        /> */}
                        {/* <FormField
                          control={form.control}
                          name="initialPaymentAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Initial Payment</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter initial payment"
                                  type="number"
                                  min={0}
                                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="initialPaymentDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Initial Payment Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  placeholder="Select date"
                                  value={
                                    field.value instanceof Date
                                      ? field.value.toISOString().split("T")[0]
                                      : field.value ?? ""
                                  }
                                  onChange={(e) => field.onChange(new Date(e.target.value))}
                                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        /> */}
                        <FormField
                          control={form.control}
                          name="agreementFile"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Contract File</FormLabel>
                              <FormControl>
                                <Input
                                  type="file"
                                  onChange={(e) =>
                                    field.onChange(e.target.files ? e.target.files[0] : null)
                                  }
                                  ref={field.ref}
                                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              </FormControl>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </form>
        </Form>

        {!creating && !editing && (
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Lease Agreements</h2>
                <Link href={`/dashboard/leases/view?tenantId=${tenant?.id}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700">Add Lease Agreement</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {leases.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={leases.filter((lease) => lease.active)}
                  searchKey="id"
                  onSearch={() => {}}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No active leases found for this tenant.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}