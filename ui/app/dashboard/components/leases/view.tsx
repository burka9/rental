'use client'

import { Lease } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray } from "react-hook-form";
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
import { toEthiopian, toGregorian } from '@/lib/date-converter';

// Ethiopian month names
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

// Schema for date fields
const dateForm = z.object({
  day: z.coerce.number().optional(),
  month: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
});

const formSchema = z.object({
  startDate: z.array(dateForm).min(1, "Start date is required"),
  endDate: z.array(dateForm).min(1, "End date is required"),
  tenantId: z.coerce.number().min(1, "Tenant is required"),
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
});

export default function ViewLease() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lease, setLease] = useState<Lease | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: [{ day: undefined, month: undefined, year: undefined }],
      endDate: [{ day: undefined, month: undefined, year: undefined }],
      tenantId: 0,
      paymentType: "PREPAID",
      paymentAmountPerMonth: {
        base: 0,
        utility: 0,
      },
      deposit: 0,
      paymentIntervalInMonths: 1,
      initialPayment: undefined,
      lateFee: 0,
      lateFeeType: "FIXED",
      lateFeeGracePeriodInDays: 0,
    },
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
  const { fetchLease,
    // createLease,
    // updateLease,
    deleteLease,
    tenants,
    fetchTenants
  } = useTenantStore();

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id || isNaN(Number(id))) {
      setCreating(true);
      return;
    }

    fetchLease(Number(id))
      .then(data => {
        if (!data) {
          toast.error("Lease not found or invalid ID");
          setCreating(true);
          return;
        }
        setLease(data);

        // Convert Gregorian to Ethiopian dates
        const startDateValue = data.startDate && !isNaN(new Date(data.startDate).getTime())
          ? (() => {
              const gregDate = new Date(data.startDate);
              try {
                const [ethYear, ethMonth, ethDay] = toEthiopian(
                  gregDate.getFullYear(),
                  gregDate.getMonth() + 1, // 1-based
                  gregDate.getDate()
                );
                return [{ year: ethYear, month: ethMonth, day: ethDay }];
              } catch (error) {
                console.error("Error converting startDate to Ethiopian:", error);
                return [{ day: undefined, month: undefined, year: undefined }];
              }
            })()
          : [{ day: undefined, month: undefined, year: undefined }];

        const endDateValue = data.endDate && !isNaN(new Date(data.endDate).getTime())
          ? (() => {
              const gregDate = new Date(data.endDate);
              try {
                const [ethYear, ethMonth, ethDay] = toEthiopian(
                  gregDate.getFullYear(),
                  gregDate.getMonth() + 1,
                  gregDate.getDate()
                );
                return [{ year: ethYear, month: ethMonth, day: ethDay }];
              } catch (error) {
                console.error("Error converting endDate to Ethiopian:", error);
                return [{ day: undefined, month: undefined, year: undefined }];
              }
            })()
          : [{ day: undefined, month: undefined, year: undefined }];

        form.reset({
          startDate: startDateValue,
          endDate: endDateValue,
          tenantId: data.tenantId || 0,
          paymentType: data.paymentType || "PREPAID",
          paymentAmountPerMonth: {
            base: data.paymentAmountPerMonth?.base || 0,
            utility: data.paymentAmountPerMonth?.utility || 0,
          },
          deposit: data.deposit || 0,
          paymentIntervalInMonths: data.paymentIntervalInMonths || 1,
          initialPayment: data.initialPayment && data.initialPayment.amount && data.initialPayment.paymentDate
            ? {
                amount: data.initialPayment.amount || 0,
                paymentDate: !isNaN(new Date(data.initialPayment.paymentDate).getTime())
                  ? new Date(data.initialPayment.paymentDate).toISOString().split("T")[0]
                  : "",
              }
            : undefined,
          lateFee: data.lateFee || 0,
          lateFeeType: data.lateFeeType || "FIXED",
          lateFeeGracePeriodInDays: data.lateFeeGracePeriodInDays || 0,
        });
      })
      .catch(error => {
        console.error("Error fetching lease:", error);
        toast.error("Failed to load lease. Please try again.");
        setCreating(true);
      });
  }, [searchParams, fetchLease, router, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Convert Ethiopian date to Gregorian ISO string
    const startDate = values.startDate[0].year && values.startDate[0].month && values.startDate[0].day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(
              values.startDate[0].year,
              values.startDate[0].month,
              values.startDate[0].day
            );
            return new Date(gregYear, gregMonth - 1, gregDay).toISOString();
          } catch (error) {
            console.error("Error converting startDate to Gregorian:", error);
            return undefined;
          }
        })()
      : undefined;

    const endDate = values.endDate[0].year && values.endDate[0].month && values.endDate[0].day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(
              values.endDate[0].year,
              values.endDate[0].month,
              values.endDate[0].day
            );
            return new Date(gregYear, gregMonth - 1, gregDay).toISOString();
          } catch (error) {
            console.error("Error converting endDate to Gregorian:", error);
            return undefined;
          }
        })()
      : undefined;

    if (!startDate || !endDate) {
      toast.error("Invalid start or end date");
      return;
    }

    // if (creating) {
    //   createLease({
    //     ...values,
    //     startDate: startDate,
    //     endDate: endDate,
    //     initialPayment: values.initialPayment ? {
    //       ...values.initialPayment,
    //       paymentDate: new Date(values.initialPayment.paymentDate),
    //     } : undefined,
    //   })
    //     .then(success => {
    //       if (success) {
    //         router.push("/dashboard/leases?message=Lease created successfully");
    //       } else {
    //         toast.error("Failed to create lease");
    //       }
    //     })
    //     .catch(error => {
    //       console.error(error);
    //       toast.error("Failed to create lease");
    //     });
    // } else if (editing && lease) {
    //   updateLease({
    //     ...values,
    //     id: lease.id,
    //     startDate,
    //     endDate,
    //     initialPayment: values.initialPayment ? {
    //       ...values.initialPayment,
    //       paymentDate: new Date(values.initialPayment.paymentDate),
    //     } : undefined,
    //   })
    //     .then(data => {
    //       if (data === null) {
    //         toast.error("Failed to update lease");
    //         return;
    //       }
    //       toast.success("Lease updated successfully");
    //       setEditing(false);
    //     })
    //     .catch(error => {
    //       console.error(error);
    //       toast.error("Failed to update lease");
    //     });
    // }
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

  const getDaysInMonth = (monthIndex: number | undefined, year: number | undefined) => {
    if (!monthIndex || year === undefined) return [];
    if (monthIndex > monthNames.length) return [];
    
    const month = monthNames[monthIndex - 1];
    const isPagume = month === "ጳጉሜ";
    const dayCount = isPagume ? (year % 4 === 3 ? 6 : 5) : 30;
    return Array.from({ length: dayCount }, (_, idx) => idx + 1);
  };

  // Generate Ethiopian years (current year ±25 years)
  const getEthiopianYears = () => {
    const currentGregYear = new Date().getFullYear();
    const [currentEthYear] = toEthiopian(currentGregYear, 1, 1);
    return Array.from({ length: 51 }, (_, idx) => currentEthYear - 25 + idx);
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
          {!creating && !editing && lease && (
            <>
              <Link href={`/dashboard/leases/payment/add?leaseId=${lease.id}`}>
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

            {/* Start Date */}
            <div className="flex flex-col gap-2">
              {startDate.fields.map((field, index) => (
                <div key={field.id}>
                  <FormLabel>Start Date</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`startDate.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            disabled={!creating && !editing}
                            onValueChange={field.onChange}
                            value={field.value?.toString() ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getEthiopianYears().map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
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
                      name={`startDate.${index}.month`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            disabled={!creating && !editing}
                            onValueChange={field.onChange}
                            value={field.value?.toString() ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                            disabled={!creating && !editing || !form.watch(`startDate.${index}.month`)}
                            onValueChange={field.onChange}
                            value={field.value?.toString() ?? ""}
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
                                <SelectItem key={day} value={day.toString()}>
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
            <div className="flex flex-col gap-2">
              {endDate.fields.map((field, index) => (
                <div key={field.id}>
                  <FormLabel>End Date</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`endDate.${index}.year`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            disabled={!creating && !editing}
                            onValueChange={field.onChange}
                            value={field.value?.toString() ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getEthiopianYears().map((year) => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
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
                      name={`endDate.${index}.month`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            disabled={!creating && !editing}
                            onValueChange={field.onChange}
                            value={field.value?.toString() ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                            disabled={!creating && !editing || !form.watch(`endDate.${index}.month`)}
                            onValueChange={field.onChange}
                            value={field.value?.toString() ?? ""}
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
                                <SelectItem key={day} value={day.toString()}>
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
                          disabled={!creating && !editing}
                          {...field}
                          value={field.value ?? ""}
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
                          disabled={!creating && !editing}
                          {...field}
                          value={field.value || ""}
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