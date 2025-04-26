/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useTenantStore } from "@/lib/store/tenants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lease, Payment, Bank, Tenant, Room } from "@/lib/types";
import { axios } from "@/lib/axios";
import { cn } from "@/lib/utils";
import { toEthiopian } from '@/lib/date-converter';

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

// Form schema
const formSchema = z.object({
  invoiceNumber: z.string().min(0, "Invoice number is required"),
  bankSlipAttachment: z.any().refine((file) => file instanceof File, {
    message: "Receipt is required",
  }),
});

export default function VerifyPayment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchPayment } = useTenantStore();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [lease, setLease] = useState<Lease | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]); // Store all rooms
  const [bank, setBank] = useState<Bank | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: undefined,
      bankSlipAttachment: undefined,
    },
  });

  // Fetch payment details
  useEffect(() => {
    const id = Number(searchParams.get("id"));
    if (!id || isNaN(id)) {
      toast.error("Invalid payment ID");
      router.push("/dashboard/payments");
      return;
    }

    const loadPayment = async () => {
      try {
        setIsLoading(true);
        const data = await fetchPayment(id);
        if (data == null || (data && data.isVerified)) {
          toast.error("Payment not found");
          router.push("/dashboard/payments");
          return;
        }

        setPayment(data);

        // Set lease, tenant, and rooms from API response
        if (data.lease) {
          setLease(data.lease);
          if (data.lease.tenant) {
            setTenant(data.lease.tenant);
          } else {
            setErrorMessage("No tenant associated with this lease");
          }
          // Use rooms directly from the API response (already fetched by getPayment)
          setRooms((data.lease as any).rooms || []);
        } else {
          setErrorMessage("No lease associated with this payment");
        }

				setBank(data.bank);
      } catch (error: any) {
        console.error("Error fetching payment:", error);
        toast.error(error.message || "Failed to load payment");
        setTimeout(() => router.push("/dashboard/payments"), 2000);
      } finally {
        setIsLoading(false);
      }
    };

    loadPayment();
  }, [searchParams, router]);

  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    const id = Number(searchParams.get("id"));
    if (!id || isNaN(id)) {
      toast.error("Invalid payment ID");
      return;
    }

    const formData = new FormData();
    formData.append("invoiceNumber", values.invoiceNumber.toString());
		formData.append("id", id.toString());
		
    if (values.bankSlipAttachment) {
      formData.append("bankSlipAttachment", values.bankSlipAttachment);
    }

    try {
      const response = await axios.post(`/payment/verify`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status >= 200 && response.status < 300) {
        toast.success("Payment verified successfully");
        setTimeout(() => router.push("/dashboard/payments?message=Payment verified successfully"), 2000);
      } else {
        throw new Error("Failed to verify payment");
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      toast.error(error.response?.data?.message ?? "Failed to verify payment");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/payments">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Verify Payment</h1>
        </div>
      </div>

      {/* Payment Details and Form */}
      {!payment ? (
        <div className="text-gray-500">No payment data available</div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Tenant Information Card */}
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Tenant Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Name</p>
                  <Input
                    value={tenant ? tenant.name : errorMessage || "N/A"}
                    disabled
                    className={cn(
                      "bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm",
                      errorMessage && "text-red-600"
                    )}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <Input
                    value={tenant?.phone || "N/A"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Address</p>
                  <Input
                    value={tenant?.address || "N/A"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">TIN Number</p>
                  <Input
                    value={tenant?.tinNumber || "N/A"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Room Information Card */}
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Room Information</CardTitle>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <div className="text-gray-500 text-center">No rooms associated with this lease</div>
              ) : (
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Block Number</th>
                      <th scope="col" className="px-6 py-3">Room Name</th>
                      <th scope="col" className="px-6 py-3">Floor Number</th>
                      <th scope="col" className="px-6 py-3">Size in square meters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id} className="bg-white border-b">
                        <td className="px-6 py-4">{room.id}</td>
                        <td className="px-6 py-4">{room.name}</td>
                        <td className="px-6 py-4">{room.floorNumber}</td>
                        <td className="px-6 py-4">{room.sizeInSquareMeters || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-700">Paid Amount</p>
                  <Input
                    value={payment.paidAmount ? `ETB ${Number(payment.paidAmount).toFixed(2)}` : "N/A"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Payment Date</p>
                  <Input
                    value={
                      payment.paymentDate
                        ? (() => {
                            const gregDate = new Date(payment.paymentDate);
                            try {
                              const [ethYear, ethMonth, ethDay] = toEthiopian(
                                gregDate.getFullYear(),
                                gregDate.getMonth() + 1,
                                gregDate.getDate()
                              );
                              return `${ethDay} ${monthNames[ethMonth - 1]} ${ethYear}`;
                            } catch (error) {
                              console.error("Error converting paymentDate to Ethiopian:", error);
                              return "Invalid Date";
                            }
                          })()
                        : "N/A"
                    }
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <p className="text-sm font-medium text-gray-700">Bank Slip</p>
                  {payment.bankSlipPath ? (
                    <a
                      href={`${axios.defaults.baseURL}${payment.bankSlipPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Bank Slip
                    </a>
                  ) : (
                    <Input
                      value="No bank slip uploaded"
                      disabled
                      className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Bank</p>
                  <Input
                    value={bank ? bank.name : "N/A"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Bank Account</p>
                  <Input
                    value={bank ? bank.accountNumber : "N/A"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Notes</p>
                  <Input
                    value={payment.notes || "No notes"}
                    disabled
                    className="bg-gray-50 text-gray-900 border-gray-200 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Verification Form Card */}
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Verify Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Invoice Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            min={0}
                            {...field}
                            className="w-[250px] border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter invoice number"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankSlipAttachment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Upload Receipt
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) =>
                              field.onChange(e.target.files ? e.target.files[0] : null)
                            }
                            className="w-[250px] border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all"
                    >
                      Verify
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="border-gray-200 text-gray-700 hover:bg-gray-100 rounded-md shadow-sm transition-all"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
			<p className="hidden">{lease?.id}</p>
    </div>
  );
}