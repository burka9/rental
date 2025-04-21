'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { useTenantStore } from "@/lib/store/tenants";
import { format, subMonths, addMonths } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toEthiopianDateString } from "@/lib/utils";

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
  }, [fetchBasicReport]);

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

  return !basicReport ? <>Loading</> : (
    <div className="p-6 space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Rooms</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{basicReport.totalRooms}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vacant Rooms</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{basicReport.vacantRooms}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{basicReport.totalTenants}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">Tenants: {basicReport.overduePayments?.totalTenants}</p>
            <p className="text-lg font-semibold">Amount: ETB {basicReport.overduePayments?.totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {/* filter */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
            {/* <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div> */}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant Name</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{payment.tenantName}</TableCell>
                    <TableCell>{toEthiopianDateString(new Date(payment.dueDate))}</TableCell>
                    <TableCell>ETB {payment.paymentAmount.toLocaleString()}</TableCell>
                    <TableCell><Link className="text-sm bg-gray-500 rounded py-1 px-3 text-white" href={`/dashboard/leases/view?id=${payment.leaseId}`}>View</Link></TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-gray-500">
                    {startDate || endDate ? "No payments found in selected date range" : "No upcoming payments"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPaymentPage(Math.max(currentPaymentPage - 1, 1))}
              disabled={currentPaymentPage === 1}
            >
              Previous
            </Button>
            <span>
              Page {currentPaymentPage} of {totalPaymentPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPaymentPage(Math.min(currentPaymentPage + 1, totalPaymentPages))}
              disabled={currentPaymentPage === totalPaymentPages}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPage;