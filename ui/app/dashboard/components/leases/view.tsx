'use client'

import { Lease } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import { useTenantStore } from "@/lib/store/tenants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "./payment-schedule/data-table";
import { columns } from "./payment-schedule/columns";

const formSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  tenantId: z.coerce.number().min(1, "Tenant is required"),
  partitionIds: z.array(z.number()).min(1, "At least one partition is required"),
  paymentType: z.enum(["PREPAID", "POSTPAID"]),
  paymentAmountPerMonth: z.object({
    base: z.coerce.number().min(0, "Base amount is required"),
    utility: z.coerce.number().min(0, "Utility amount is required"),
  }),
  deposit: z.coerce.number().min(0, "Deposit amount is required"),
  paymentIntervalInMonths: z.coerce.number().min(1, "Payment interval is required"),
  initialPayment: z.object({
    amount: z.coerce.number().min(0, "Initial payment amount is required"),
    paymentDate: z.string().min(1, "Initial payment date is required"),
  }).optional(),
  lateFee: z.coerce.number().min(0, "Late fee is required"),
  lateFeeType: z.enum(["PERCENTAGE", "FIXED"]),
  lateFeeGracePeriodInDays: z.coerce.number().min(0, "Grace period is required"),
})

export default function ViewLease() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lease, setLease] = useState<Lease | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: "",
      endDate: "",
      tenantId: 0,
      partitionIds: [],
      paymentType: "PREPAID",
      paymentAmountPerMonth: {
        base: 0,
        utility: 0,
      },
      deposit: 0,
      paymentIntervalInMonths: 1,
      initialPayment: {
        amount: 0,
        paymentDate: "",
      },
      lateFee: 0,
      lateFeeType: "FIXED",
      lateFeeGracePeriodInDays: 0,
    }
  })

  const searchParams = useSearchParams();
  const { fetchLease, createLease, updateLease, deleteLease, tenants, fetchTenants } = useTenantStore();

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      setCreating(true);
      return;
    }

    fetchLease(Number(id))
      .then(data => {
        if (!data) {
          router.push("/dashboard/leases?error=Lease not found");
          return;
        }
        setLease(data);
        form.reset({
          startDate: new Date(data.startDate).toISOString().split("T")[0],
          endDate: new Date(data.endDate).toISOString().split("T")[0],
          tenantId: data.tenantId,
          partitionIds: data.partitionIds,
          paymentType: data.paymentType,
          paymentAmountPerMonth: data.paymentAmountPerMonth,
          deposit: data.deposit,
          paymentIntervalInMonths: data.paymentIntervalInMonths,
          initialPayment: data.initialPayment ? {
            amount: data.initialPayment.amount,
            paymentDate: new Date(data.initialPayment.paymentDate).toISOString().split("T")[0],
          } : undefined,
          lateFee: data.lateFee,
          lateFeeType: data.lateFeeType,
          lateFeeGracePeriodInDays: data.lateFeeGracePeriodInDays,
        });
      })
      .catch(console.error);
  }, [searchParams, fetchLease, router, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (creating) {
      createLease({
        ...values,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        initialPayment: values.initialPayment ? {
          ...values.initialPayment,
          paymentDate: new Date(values.initialPayment.paymentDate),
        } : undefined,
      })
        .then(success => {
          if (success) {
            router.push("/dashboard/leases?message=Lease created successfully");
          } else {
            toast.error("Failed to create lease");
          }
        })
        .catch(error => {
          console.error(error);
          toast.error("Failed to create lease");
        });
    } else if (editing && lease) {
      updateLease({
        ...values,
        id: lease.id,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        initialPayment: values.initialPayment ? {
          ...values.initialPayment,
          paymentDate: new Date(values.initialPayment.paymentDate),
        } : undefined,
      })
        .then(data => {
          if (data === null) {
            toast.error("Failed to update lease");
            return;
          }
          toast.success("Lease updated successfully");
          setEditing(false);
        })
        .catch(error => {
          console.error(error);
          toast.error("Failed to update lease");
        });
    }
  };

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    if (!lease) return;

    deleteLease(lease.id)
      .then(success => {
        if (success) {
          router.push("/dashboard/leases?message=Lease deleted successfully");
        } else {
          toast.error("Failed to delete lease");
        }
      })
      .catch(error => {
        console.error(error);
        toast.error("Failed to delete lease");
      });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/leases">
            <Button variant="outline" size="icon">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">
            {creating ? "New Lease Agreement" : editing ? "Edit Lease Agreement" : "View Lease Agreement"}
          </h1>
        </div>
        <div className="flex gap-2">
          {!creating && !editing && (
            <>
              <Link href={`/dashboard/leases/payment/add?leaseId=${lease?.id}`}>
                <Button variant="outline">
                  Add Payment
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setEditing(true)}>
                Edit
              </Button>
              <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <FormField
                control={form.control}
                name="tenantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tenant</FormLabel>
                    <Select
                      disabled={!creating && !editing}
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tenant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id.toString()}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="paymentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Type</FormLabel>
                  <Select
                    disabled={!creating && !editing}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PREPAID">Prepaid</SelectItem>
                      <SelectItem value="POSTPAID">Postpaid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentIntervalInMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Interval (months)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={!creating && !editing}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      disabled={!creating && !editing}
                      {...field}
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
                      type="date"
                      disabled={!creating && !editing}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentAmountPerMonth.base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={!creating && !editing}
                      {...field}
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
                  <FormLabel>Utility Payment Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={!creating && !editing}
                      {...field}
                    />
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
                    <Input
                      type="number"
                      disabled={!creating && !editing}
                      {...field}
                    />
                  </FormControl>
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
                      type="number"
                      disabled={!creating && !editing}
                      {...field}
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
                    disabled={!creating && !editing}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select late fee type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lateFeeGracePeriodInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Fee Grace Period (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={!creating && !editing}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(creating || editing) && (
              <>
                <FormField
                  control={form.control}
                  name="initialPayment.amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Payment Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialPayment.paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Payment Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {(creating || editing) && (
            <Button type="submit" className="w-full mt-6">
              {creating ? "Create Lease" : "Save Changes"}
            </Button>
          )}
        </form>
      </Form>

      {lease && lease.paymentSchedule && lease.paymentSchedule.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Payment Schedule</h2>
          <DataTable
            columns={columns}
            data={lease.paymentSchedule}
          />
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogTitle>Delete Lease</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this lease? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}