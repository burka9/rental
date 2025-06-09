/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { ChevronLeftIcon, DownloadIcon, EyeIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTenantStore } from "@/lib/store/tenants";
import { usePropertyStore } from "@/lib/store/property";
import { Lease, Payment, Bank, ROLES } from "@/lib/types";
import { toEthiopian, toGregorian } from "@/lib/date-converter";
import { axios, baseURL } from "@/lib/axios";
import { Textarea } from "@/components/ui/textarea";

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
  referenceNumber: z.string().min(0, "Reference number is required"),
  notes: z.string().optional(),
  bankSlipAttachment: z.any().optional(),
});

// Component to handle file display and download for Bank Slip
const BankSlipDisplay = ({ filePath }: { filePath: string }) => {
  const fileUrl = `${baseURL}/${filePath}`;
  const fileName = filePath.split('/').pop() || 'bank-slip';

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="col-span-full">
      <FormLabel className="text-sm font-medium text-gray-700">Bank Slip</FormLabel>
      <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600 truncate max-w-xs">{fileName}</p>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          >
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <EyeIcon className="h-4 w-4" /> View File
            </a>
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          >
            <DownloadIcon className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
};

// Component to handle file display and download for Invoice
const InvoiceDisplay = ({ filePath }: { filePath: string }) => {
  const fileUrl = `${baseURL}/${filePath}`;
  const fileName = filePath.split('/').pop() || 'invoice';

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch file');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  };

  return (
    <div className="col-span-full">
      <FormLabel className="text-sm font-medium text-gray-700">Invoice</FormLabel>
      <div className="mt-2 bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600 truncate max-w-xs">{fileName}</p>
        <div className="flex gap-2">
          <Button
            asChild
            className="bg-gray-600 hover:bg-gray-700 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          >
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <EyeIcon className="h-4 w-4" /> View File
            </a>
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
          >
            <DownloadIcon className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function ViewPayments() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchLease, fetchLeases, fetchPayment } = useTenantStore();
  const { fetchBanks, banks, fetchRooms } = usePropertyStore();
  const [lease, setLease] = useState<Lease | null>(null);
  const [creating, setCreating] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);

  // Get current Ethiopian date for default values
  const currentGregDate = new Date();
  const [currentEthYear, currentEthMonth, currentEthDay] = toEthiopian(
    currentGregDate.getFullYear(),
    currentGregDate.getMonth() + 1,
    currentGregDate.getDate()
  );

  // Form setup with dynamic default values
  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      leaseId: 0,
      paidAmount: 0,
      paymentDate: {
        day: currentEthDay,
        month: currentEthMonth,
        year: currentEthYear,
      },
      bankId: 0,
      referenceNumber: "",
      notes: "",
      bankSlipAttachment: undefined,
    },
  });

  // const leaseId = form.watch("leaseId");
  const bankId = form.watch("bankId");

  const [selectedLease, setselectedLease] = useState()
  
  // const selectedLease = useMemo(() => {
  //   const _leaseId = searchParams.get("leaseId") || 0;
    
  //   if (creating && _leaseId !== 0) {
  //     console.log(payment?.lease)
  //     return payment?.lease
  //   }
  //   if (!leases.length) return null;
  //   return payment?.lease
  //   // return leases.find(l => l.id === payment?.leaseId);
  // }, [payment, leases, creating, searchParams]);

  const selectedBank = useMemo(() => {
    if (creating && bankId !== 0) return banks.find(b => b.id === bankId);
    if (!banks.length) return null;
    return banks.find(b => b.id === payment?.bankId);
  }, [payment?.bankId, banks, creating, bankId]);

  // Fetch leases, banks, rooms, and set leaseId from query parameter
  useEffect(() => {
    const createMode = searchParams.get("create") === "true";
    const queryLeaseId = Number(searchParams.get("leaseId") || searchParams.get("id"));

    setCreating(createMode);

    // Fetch all leases for the dropdown
    fetchLeases();

    // Fetch all rooms for displaying room numbers
    fetchRooms();


    // If leaseId is provided in query and in create mode, set the form value
    if (queryLeaseId && !isNaN(queryLeaseId)) {
      fetchLease(queryLeaseId)
        .then(data => {
          if (data) {
            console.log(data)
            setLease(data);
            form.setValue("leaseId", queryLeaseId);
            setselectedLease(data as any)
          } else {
            // toast.error("Lease not found");
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
  }, [searchParams, fetchLease, fetchLeases, fetchBanks, fetchRooms, form]);

  // Fetch payment if viewing an existing payment
  useEffect(() => {
    const id = Number(searchParams.get("id"));
    if (!id) return;
    fetchPayment(id)
      .then((data) => {
        if (data == null) router.push(`/dashboard/payments`);
        else {
          setPayment(data);
          console.log('data ------------------------------------')
          console.log(data)
          // Populate form with payment data in view mode
          const paymentDate = data.paymentDate ? toEthiopian(
            new Date(data.paymentDate).getFullYear(),
            new Date(data.paymentDate).getMonth() + 1,
            new Date(data.paymentDate).getDate()
          ) : [currentEthYear, currentEthMonth, currentEthDay];
          
          form.reset({
            leaseId: data.leaseId,
            paidAmount: data.paidAmount,
            paymentDate: {
              day: paymentDate[2],
              month: paymentDate[1],
              year: paymentDate[0],
            },
            bankId: data.bankId,
            referenceNumber: data.referenceNumber,
            notes: data.notes || "",
          });
        }
      })
      .catch((error) => console.log(error));
  }, [fetchPayment, searchParams, router, form, currentEthYear, currentEthMonth, currentEthDay]);

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
    const payment = {
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

    // Append files to FormData
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
            router.push("/dashboard/payments?message=Payment added successfully");
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
              <Link href="/dashboard/payments">
                <Button className="mr-2 p-1 px-2" size="sm">
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-xl font-bold">{creating ? "Add Payment" : "View Payment"}</h1>
            </div>
            <div className="flex items-center gap-2">
              {creating && (
                <Button size="default" onClick={form.handleSubmit(handleSubmit)}>
                  Create
                </Button>
              )}
              <Button
                size="default"
                variant="outline"
                onClick={() => {
                  router.back();
                }}
              >
                {creating ? "Cancel" : "Back"}
              </Button>
              <Link
                href={`/dashboard/payments/verify?id=${payment?.id}`}
                data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.FINANCE_ADMIN]}
              >
                <Button variant={"outline"} className="bg-green-600 text-white">Verify</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Display Selected Lease Information */}
            {/* {selectedLease && ( */}
            {true && (
              <Link href={`/dashboard/leases/view?id=${(selectedLease as any)?.id}`}>
                <div className="bg-gray-50 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md">
                  <h2 className="text-lg font-semibold text-gray-900">Tenant Info</h2>
                  <p className="text-sm text-gray-700">Tenant Name: {payment?.lease.tenant.name ?? (lease as any)?.tenant.name}</p>
                  {/* <p className="text-sm text-gray-700">Block: {(payment as any)?.lease.rooms[0].buildingId}</p>
                  <p className="text-sm text-gray-700">Office: {(payment as any)?.lease.rooms[0].name}</p> */}
                </div>
              </Link>
            )}

            {/* Display Selected Bank Information */}
            {selectedBank && (
              <div className="bg-gray-50 p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md">
                <h2 className="text-lg font-semibold text-gray-900">Bank Info</h2>
                <p className="text-sm text-gray-700">Bank Name: {selectedBank.name}</p>
                <p className="text-sm text-gray-700">Account Number: {selectedBank.accountNumber}</p>
                <p className="text-sm text-gray-700">Branch: {selectedBank.branch}</p>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-col gap-2">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4 sm:col-span-1">
                  <FormField
                    control={form.control}
                    name="bankId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() ?? ""}
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
                </div>

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
                          disabled={!creating}
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
                          disabled={!creating}
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
                          disabled={!creating}
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
                          disabled={!form.watch("paymentDate.month") || !creating}
                          onValueChange={field.onChange}
                          value={field.value?.toString() ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={
                                form.watch("paymentDate.month") && creating
                                  ? "bg-white"
                                  : "opacity-60 cursor-default"
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
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference Number</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          min={0}
                          {...field}
                          className="bg-white"
                          disabled={!creating}
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
                          {/* <Input
                            {...field}
                            className="bg-white"
                            disabled={!creating}
                          /> */}
                          <Textarea
                            {...field}
                            className="bg-white "
                            disabled={!creating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {creating ? (
                  <>
                    <FormField
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
                  </>
                ) : (
                  <>
                    {payment?.bankSlipPath && <BankSlipDisplay filePath={payment.bankSlipPath} />}
                    {payment?.invoicePath && <InvoiceDisplay filePath={payment.invoicePath} />}
                  </>
                )}
              </div>
            </form>
          </Form>
        </div>
      )}
      <p className="hidden">{lease?.id}</p>
    </>
  );
}