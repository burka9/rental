'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bank, Lease, Payment, PaymentSchedule } from "@/lib/types"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeftIcon } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useTenantStore } from "@/lib/store/tenants"
import { toast } from "sonner"

const formSchema = z.object({
  scheduleId: z.string().min(1, "Payment schedule is required"),
  paidAmount: z.string().min(1, "Paid amount is required"),
  paymentDate: z.string().min(1, "Payment date is required"),
  bankId: z.string().min(1, "Bank is required"),
  notes: z.string().optional(),
  bankSlipPath: z.string().min(1, "Bank slip is required"),
  invoicePath: z.string().optional(),
})

export default function AddPayment() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leaseId = searchParams.get("leaseId")
  const [banks, setBanks] = useState<Bank[]>([])
  const { fetchLease } = useTenantStore()
  const [lease, setLease] = useState<Lease>()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      scheduleId: "",
      paidAmount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      bankId: "",
      notes: "",
      bankSlipPath: "",
      invoicePath: "",
    },
  })

  useEffect(() => {
    if (leaseId) {
      fetchLease(Number(leaseId))
        .then((lease) => {
          if (!lease) {
            return router.push("/dashboard/leases/view?message=Lease not found")
          }

          setLease(lease)
        })
        .catch(console.error)
    }
  }, [leaseId, fetchLease, router])

  useEffect(() => {
    // Fetch banks
    fetch('/api/banks')
      .then(res => res.json())
      .then(data => setBanks(data))
      .catch(console.error)
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payment: Partial<Payment> = {
        leaseId: Number(leaseId),
        scheduleId: Number(values.scheduleId),
        paidAmount: Number(values.paidAmount),
        paymentDate: new Date(values.paymentDate),
        paymentMethod: "BANK_TRANSFER",
        bankId: Number(values.bankId),
        notes: values.notes || "",
        bankSlipPath: values.bankSlipPath,
        invoicePath: values.invoicePath,
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment')
      }

      toast.success("Payment added successfully")
      router.push(`/dashboard/leases/view?id=${leaseId}`)
    } catch (error) {
      console.error(error)
      toast.error("Failed to add payment")
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/dashboard/leases/view?id=${leaseId}`}>
          <Button variant="outline" size="icon">
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Add Payment</h1>
      </div>

      <Card className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Schedule</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment schedule" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lease?.paymentSchedule?.map((schedule: PaymentSchedule) => (
                          <SelectItem
                            key={schedule.id}
                            value={schedule.id.toString()}
                          >
                            {new Date(schedule.dueDate).toLocaleDateString()} - {schedule.payableAmount.toLocaleString()}
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
                      <Input type="number" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bankId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {banks.map((bank) => (
                          <SelectItem
                            key={bank.id}
                            value={bank.id?.toString() || ""}
                          >
                            {bank.name} - {bank.branch}
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
                name="bankSlipPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Slip</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*,.pdf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoicePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice (Optional)</FormLabel>
                    <FormControl>
                      <Input type="file" accept="image/*,.pdf" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add any notes about the payment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Add Payment
            </Button>
          </form>
        </Form>
      </Card>
    </div>
  )
}
