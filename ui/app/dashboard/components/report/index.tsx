'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useTenantStore } from "@/lib/store/tenants";
import { format, subMonths, addMonths } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toEthiopianDateString } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const ReportPage = () => {
  const { basicReport, fetchBasicReport } = useTenantStore();
  
  // Set default dates: 3 months ago and 3 months from now
  const today = new Date();
  const defaultStart = subMonths(today, 3);
  const defaultEnd = addMonths(today, 3);
  
  const [startDate, setStartDate] = useState(format(defaultStart, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(defaultEnd, "yyyy-MM-dd"));
  const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
  const paymentPageSize = 10;

  useEffect(() => {
    fetchBasicReport();
  }, [fetchBasicReport]); // Run only on mount

  // Filter upcoming payments based on date range
  const filteredPayments = basicReport?.upcomingPayment
    ?.filter((payment) => {
      const dueDate = new Date(payment.dueDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && end) {
        return dueDate >= start && dueDate <= end;
      }
      if (start) {
        return dueDate >= start;
      }
      if (end) {
        return dueDate <= end;
      }
      return true;
    })
    .slice((currentPaymentPage - 1) * paymentPageSize, currentPaymentPage * paymentPageSize) || [];

  const totalPaymentPages = Math.ceil((basicReport?.upcomingPayment?.length || 0) / paymentPageSize);

  return !basicReport ? (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-600">Loading...</p>
    </div>
  ) : (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Summary Section */}
        <Card className="border-none shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-gray-700">Total Rooms</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold text-gray-900">{basicReport.totalRooms}</CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-gray-700">Vacant Rooms</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold text-gray-900">{basicReport.vacantRooms}</CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-gray-700">Total Tenants</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold text-gray-900">{basicReport.totalTenants}</CardContent>
              </Card>

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-gray-700">Overdue Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-semibold text-gray-900">
                    Tenants: {basicReport.overduePayments?.totalTenants}
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    Amount: ETB {basicReport.overduePayments?.totalAmount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Payments Table */}
        <Card className="border-none shadow-md rounded-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Date Range Filter */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
              <div>
                <Label htmlFor="startDate" className="text-gray-700">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="text-gray-700">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700">Tenant Name</TableHead>
                  <TableHead className="text-gray-700">Due Date</TableHead>
                  <TableHead className="text-gray-700">Payment Amount</TableHead>
                  <TableHead className="text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-gray-900">{payment.tenantName}</TableCell>
                      <TableCell className="text-gray-900">{toEthiopianDateString(new Date(payment.dueDate))}</TableCell>
                      <TableCell className="text-gray-900">ETB {payment.paymentAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/leases/view?id=${payment.leaseId}`}
                          className="text-sm bg-blue-600 text-white rounded py-1 px-3 hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      {startDate || endDate ? "No payments found in selected date range" : "No upcoming payments"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPaymentPage(Math.max(currentPaymentPage - 1, 1))}
                disabled={currentPaymentPage === 1}
                className={cn(
                  "border-gray-200 text-gray-700 hover:bg-gray-50",
                  currentPaymentPage === 1 && "opacity-50 cursor-not-allowed"
                )}
              >
                Previous
              </Button>
              <span className="text-gray-700">
                Page {currentPaymentPage} of {totalPaymentPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPaymentPage(Math.min(currentPaymentPage + 1, totalPaymentPages))}
                disabled={currentPaymentPage === totalPaymentPages}
                className={cn(
                  "border-gray-200 text-gray-700 hover:bg-gray-50",
                  currentPaymentPage === totalPaymentPages && "opacity-50 cursor-not-allowed"
                )}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportPage;