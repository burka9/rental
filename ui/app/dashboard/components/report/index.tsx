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
import { ChevronLeftIcon, Download, FileText, Home, Users, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { axios } from "@/lib/axios"

const ReportPage = () => {
  const { basicReport, fetchBasicReport } = useTenantStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  // Set default dates: 3 months ago and 3 months from now
  const today = new Date();
  const defaultStart = subMonths(today, 3);
  const defaultEnd = addMonths(today, 3);
  
  const [startDate, setStartDate] = useState(format(defaultStart, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(defaultEnd, "yyyy-MM-dd"));
  const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
  const paymentPageSize = 10;

  const [currentOverduePage, setCurrentOverduePage] = useState(1);
  const overduePageSize = 10;
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchBasicReport();
      } catch (error) {
        console.error('Error loading report:', error);
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchBasicReport]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get('report/pdf-template', {
        headers: {
          Accept: 'application/pdf',
        },
        responseType: 'blob', // Ensure binary data is handled correctly
      });
  
      if (!response.data) {
        throw new Error('Failed to generate report');
      }
  
      const blob = response.data; // Response is already a Blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rental-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
  
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

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

  const filteredOverduePayments = basicReport?.overduePayments?.payments
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
    .slice((currentOverduePage - 1) * overduePageSize, currentOverduePage * overduePageSize) || [];

  const totalOverduePages = Math.ceil((basicReport?.overduePayments?.payments?.length || 0) / overduePageSize);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!basicReport) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-2xl font-semibold text-gray-900">Unable to load report data</h2>
        <p className="text-gray-500">Please try refreshing the page or check your connection.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    );
  }

  const occupancyRate = ((basicReport.totalRooms - basicReport.vacantRooms) / basicReport.totalRooms) * 100;
  const paymentRate = basicReport.totalTenants > 0 
    ? ((basicReport.totalTenants - (basicReport.overduePayments?.totalTenants || 0)) / basicReport.totalTenants) * 100 
    : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="h-5 w-px bg-border" />
          <h1 className="text-2xl font-bold tracking-tight">Property Reports</h1>
        </div>
        <Button 
          onClick={handleDownloadReport} 
          disabled={isDownloading}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isDownloading ? 'Generating...' : 'Download Full Report'}
        </Button>
      </div>

      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Rooms</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Home className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basicReport.totalRooms}</div>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                {basicReport.vacantRooms} vacant
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
              <div className="flex items-center mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${occupancyRate}%` }}></div>
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  {basicReport.totalRooms - basicReport.vacantRooms} occupied
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenants</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{basicReport.totalTenants}</div>
              <div className="flex items-center mt-2 text-xs text-muted-foreground">
                {basicReport.overduePayments?.totalTenants || 0} with overdue
              </div>
            </CardContent>
          </Card>

          <Card className="border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Payment Status</CardTitle>
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentRate.toFixed(1)}%</div>
              <div className="flex items-center mt-2">
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${paymentRate}%` }}></div>
                </div>
                <span className="ml-2 text-xs text-muted-foreground">
                  ETB {basicReport.overduePayments?.totalAmount.toLocaleString() || 0} overdue
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Payments Table */}
        <Card className="border rounded-lg shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Overdue Payments</CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate" className="text-sm text-muted-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[120px]"
                />
                <Label htmlFor="endDate" className="text-sm text-muted-foreground">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[120px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Tenant Name</TableHead>
                  <TableHead className="text-muted-foreground">Due Date</TableHead>
                  <TableHead className="text-muted-foreground">Payment Amount</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOverduePayments?.length > 0 ? (
                  filteredOverduePayments?.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{payment.tenantName}</TableCell>
                      <TableCell>{toEthiopianDateString(new Date(payment.dueDate))}</TableCell>
                      <TableCell>ETB {payment.paymentAmount.toLocaleString()}</TableCell>
                      <TableCell className="flex gap-2">
                        <Link
                          href={`/dashboard/leases/view?id=${payment.leaseId}`}
                          className="text-sm bg-blue-600 text-white rounded py-1 px-3 hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/payments/view?create=true&leaseId=${payment.leaseId}`}
                          className="text-sm bg-green-600 text-white rounded py-1 px-3 hover:bg-green-700 transition-colors"
                        >
                          Pay Now
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {startDate || endDate ? "No payments found in selected date range" : "No upcoming payments"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={currentOverduePage === 1}
                onClick={() => setCurrentOverduePage(currentOverduePage - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentOverduePage} of {totalOverduePages}
              </span>
              <Button
                variant="outline"
                disabled={currentOverduePage === totalOverduePages}
                onClick={() => setCurrentOverduePage(currentOverduePage + 1)}
              >
                Next
              </Button>
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
                      <TableCell className="flex gap-2 items-center">
                        <Link
                          href={`/dashboard/leases/view?id=${payment.leaseId}`}
                          className="text-sm bg-blue-600 text-white rounded py-1 px-3 hover:bg-blue-700 transition-colors"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/payments/view?create=true&leaseId=${payment.leaseId}`}
                          className="text-sm bg-green-600 text-white rounded py-1 px-3 hover:bg-green-700 transition-colors"
                        >
                          Pay Now
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