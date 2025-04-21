"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTenantStore } from "@/lib/store/tenants";
import { usePropertyStore } from "@/lib/store/property";
import { Lease, Payment, Bank } from "@/lib/types";
import { toGregorian } from "@/lib/date-converter";
import { axios} from "@/lib/axios";

// Ethiopian month names
const monthNames = [
  "መስከረም", // Meskerem
  "ጥቅምት", // Tikimt
  "ህዳር", // Hidar
  "ታህሳስ", // Tahsas
  "ጥር", // Tir
  "የካቲት", // Yekatit
  "መጋቢት", // Megabit
  "ሚያዝያ", // Miazia
  "ግንቦት", // Ginbot
  "ሰኔ", // Sene
  "ሐምሌ", // Hamle
  "ነሐሴ", // Nehase
  "ጳጉሜ", // Pagumē
] as const;

// Schema for Ethiopian date
const dateForm = z.object({
  day: z.coerce.number().min(1, "Day is required").max(30, "Invalid day"),
  month: z.coerce.number().min(1, "Month is required").max(13, "Invalid month"),
  year: z.coerce.number().min(1900, "Year is required"),
});

// Form schema
const formSchema = z.object({
  leaseId: z.coerce.number().min(1, "Lease is required"),
  paidAmount: z.coerce.number().min(0, "Paid amount must be non-negative"),
  paymentDate: dateForm,
  bankId: z.coerce.number().min(1, "Bank is required"),
  referenceNumber: z.coerce.number().min(0, "Reference number is required"),
  notes: z.string().optional(),
  bankSlipAttachment: z.any().refine((file) => file instanceof File, {
    message: "Bank slip attachment is required",
  }),
});

export default function ViewPayments() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchLease, fetchLeases, leases, fetchPayment } = useTenantStore();
  const { fetchBanks, banks } = usePropertyStore();
  const [lease, setLease] = useState<Lease | null>(null);
  const [creating, setCreating] = useState(false);
  const [payment, setPayment] = useState<Payment | null>();

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaseId: payment?.leaseId,
      paidAmount: payment?.paidAmount,
      // paymentDate: payment?.paymentDate,
      bankId: payment?.bankId,
      referenceNumber: payment?.referenceNumber,
      notes: payment?.notes,
      // bankSlipAttachment: payment?.bankSlipPath,
    },
  });

  const leaseId = form.watch("leaseId");
  const bankId = form.watch("bankId");

  const selectedLease = useMemo(() => {
      if (creating && leaseId !== null) return leases.find(l => l.id === leaseId);
      
      if (!leases.length) return null;
      return leases.find(l => l.id === payment?.leaseId);
    }, [payment?.leaseId, leases, creating, leaseId]);

  const selectedBank = useMemo(() => {
    if (creating && bankId !== null) return banks.find(b => b.id === bankId);
    
    if (!banks.length) return null;
    return banks.find(b => b.id === payment?.bankId);
  }, [payment?.bankId, banks, creating, bankId]);

  // Fetch lease and banks
  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    const leaseId = Number(searchParams.get("leaseId"));

    // Fetch all leases for the dropdown
    fetchLeases();

    // If leaseId is provided, fetch the specific lease
    if (leaseId && !isNaN(leaseId)) {
      fetchLease(leaseId)
        .then(data => {
          if (data) {
            setLease(data);
            form.setValue("leaseId", leaseId);
          } else {
            toast.error("Lease not found");
            setLease(null);
          }
        })
        .catch(error => {
          console.error("Error fetching lease:", error);
          toast.error("Failed to load lease");
          setLease(null);
        });
    }

    fetchBanks();
  }, [searchParams, fetchLease, fetchLeases, fetchBanks, form]);

  useEffect(() => {
      const id = Number(searchParams.get("id"));
      if (!id) return;
      fetchPayment(id)
        .then((data) => {
          console.log(data)
          if (data == null) router.push(`/dashboard/payments`);
          else setPayment(data);
        })
        .catch((error) => console.log(error));
    }, [fetchPayment, searchParams, router]);

  useEffect(() => {
    form.reset({
      leaseId: payment?.leaseId,
      paidAmount: payment?.paidAmount,
      // paymentDate: payment?.paymentDate,
      bankId: payment?.bankId,
      referenceNumber: payment?.referenceNumber,
      notes: payment?.notes,
      // bankSlipAttachment: payment?.bankSlipPath,
    })
  }, [form, payment])
  
  // Generate Ethiopian years (±25 years from current)
  const getEthiopianYears = () => {
    const currentGregYear = new Date().getFullYear();
    const [currentEthYear] = toGregorian(currentGregYear, 1, 1);
    return Array.from({ length: 51 }, (_, idx) => currentEthYear - 25 + idx);
  };

  // Get days in a month
  const getDaysInMonth = (monthIndex: number | undefined, year: number | undefined) => {
    if (!monthIndex || year === undefined) return [];
    if (monthIndex > monthNames.length) return [];
    const month = monthNames[monthIndex - 1];
    const isPagume = month === "ጳጉሜ";
    const dayCount = isPagume ? (year % 4 === 3 ? 6 : 5) : 30;
    return Array.from({ length: dayCount }, (_, idx) => idx + 1);
  };

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Convert Ethiopian date to Gregorian ISO string
    const paymentDate = values.paymentDate.year && values.paymentDate.month && values.paymentDate.day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(
              values.paymentDate.year,
              values.paymentDate.month,
              values.paymentDate.day
            );
            return new Date(gregYear, gregMonth - 1, gregDay).toISOString();
          } catch (error) {
            console.error("Error converting paymentDate to Gregorian:", error);
            return undefined;
          }
        })()
      : undefined;

    if (!paymentDate) {
      toast.error("Invalid payment date");
      return;
    }

    // Prepare FormData for submission
    const formData = new FormData();
    const payment: Partial<Payment> = {
      leaseId: values.leaseId,
      paidAmount: values.paidAmount,
      paymentDate: new Date(paymentDate),
      paymentMethod: "BANK_TRANSFER",
      bankId: values.bankId,
      referenceNumber: values.referenceNumber,
      notes: values.notes || "",
    };

    // Append payment fields to FormData
    Object.entries(payment).forEach(([key, value]) => {
      if (value instanceof Date) {
        formData.append(key, value.toISOString());
      } else if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    // Append file to FormData
    if (values.bankSlipAttachment) {
      formData.append("bankSlipAttachment", values.bankSlipAttachment);
    }

    try {
      await form
        .trigger()
        .then((data) => {
          if (!data) throw new Error("Form validation failed");
          return axios.post("/payment", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        })
        .then((response) => {
          if (response.status >= 200 && response.status < 300) {
            toast.success("Payment added successfully");
            router.push("/dashboard/leases?message=Payment added successfully");
          }
        })
        .catch((error) => {
          console.error("Error adding payment:", error);
          toast.error(error.response?.data?.message ?? "Failed to add payment");
        });
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error("Failed to add payment");
    }
  };

  return (
    <>
      {!creating && !payment ? (
        <div>Loading...</div>
      ) : (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard/leases">
                <Button className="mr-2 p-1 px-2" size="sm">
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Add Payment</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button size="default" onClick={form.handleSubmit(handleSubmit)}>
                Create
              </Button>
              <Button
                size="default"
                variant="outline"
                onClick={() => {
                  router.back();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-2">
              <div className="grid grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="leaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lease</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          creating
                          ? selectedLease?.id?.toString() ?? ""
                          : payment?.leaseId?.toString() ?? ""
                        }
                        disabled={!creating}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a lease" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {leases.map((lease: Lease) => (
                            <SelectItem key={lease.id} value={lease.id.toString()}>
                              {lease.tenant.name} - Lease #{lease.id}
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
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 col-span-2 gap-4">
                  <FormField
                    control={form.control}
                    name="paymentDate.year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a year" />
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
                    name="paymentDate.month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a month" />
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
                    name="paymentDate.day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day</FormLabel>
                        <Select
                          disabled={!form.watch("paymentDate.month")}
                          onValueChange={field.onChange}
                          value={field.value?.toString() ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={
                                form.watch("paymentDate.month") ? "bg-white" : "opacity-60 cursor-default"
                              }
                            >
                              <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getDaysInMonth(
                              form.watch("paymentDate.month"),
                              form.watch("paymentDate.year")
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

                <FormField
                  control={form.control}
                  name="bankId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={
                          creating
                          ? selectedBank?.id?.toString() ?? ""
                          : payment?.bankId?.toString() ?? ""
                        }
                        disabled={!creating}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select a bank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {banks.map((bank: Bank) => (
                            <SelectItem key={bank.id} value={bank.id!.toString()}>
                              {bank.name} - {bank.accountNumber} - {bank.branch}
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
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          className="bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input {...field} className="bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {
                  creating
                    ? <FormField
                      control={form.control}
                      name="bankSlipAttachment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Slip Attachment</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                              className="bg-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    : <Link href="">View File</Link>
                }
              </div>
            </form>
          </Form>
        </div>
      )}
    </>
  );
}