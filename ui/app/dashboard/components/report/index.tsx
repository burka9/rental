'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useTenantStore } from '@/lib/store/tenants';
import { axios } from '@/lib/axios';
import { Lease, Payment } from '@/lib/types';

interface UpcomingPayment {
  tenantName: string;
  amount: number;
  dueDate: string;
}

export default function Report() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalTenants, setTotalTenants] = useState(0);
  const [totalRentDue, setTotalRentDue] = useState(0);
  const [latePayments, setLatePayments] = useState(0);
  const [lateTenants, setLateTenants] = useState(0);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const { tenants, leases, payments } = useTenantStore();

  const fetchReportData = useCallback(async () => {
    try {
      // Get total tenants
      setTotalTenants(tenants.length);

      // Calculate total rent due
      let totalDue = 0;
      leases.forEach((lease: Lease) => {
        if (lease.active) {
          totalDue += lease.paymentAmountPerMonth.base;
        }
      });
      setTotalRentDue(totalDue);

      // Calculate late payments and tenants
      const latePaymentCount = payments.filter((payment: Payment) => 
        new Date(payment.paymentDate) > new Date((payment as { [key: string]: string | Date | number }).paymentSchedule.dueDate)
      ).length;
      setLatePayments(latePaymentCount);

      const lateTenantCount = new Set(payments
        .filter((payment: Payment) => new Date(payment.paymentDate) > new Date((payment as { [key: string]: string | Date | number }).paymentSchedule.dueDate))
        .map((payment: Payment) => payment.lease.tenantId)
      ).size;
      setLateTenants(lateTenantCount);

      // Get upcoming payments
      const upcoming = leases
        .filter((lease: Lease) => lease.active)
        .map((lease: Lease) => ({
          tenantName: lease.tenant.name,
          amount: lease.paymentAmountPerMonth.base,
          dueDate: format(lease.paymentSchedule[0].dueDate, 'MMMM yyyy'),
        }));
      setUpcomingPayments(upcoming);

    } catch (error) {
      console.error('Error fetching report data:', error);
    }
  }, [tenants, leases, payments]);

  useEffect(() => {
    // Fetch initial data
    fetchReportData();
  }, [fetchReportData]);

  const handleDateRangeChange = async () => {
    if (!startDate || !endDate) return;

    try {
      const response = await axios.get('/api/reports/rent-due', {
        params: {
          startDate,
          endDate,
        },
      });

      setTotalRentDue(response.data.totalRentDue);
    } catch (error) {
      console.error('Error fetching rent due data:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-8">Rental Report</h1>

      {/* Date Range Filter */}
      <div className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <Input
              type="month"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">End Date</label>
            <Input
              type="month"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
          </div>
          <Button onClick={handleDateRangeChange}>
            Update Rent Due
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTenants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rent Due</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRentDue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latePayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lateTenants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upcoming Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingPayments.map((payment, index) => (
              <div key={index} className="flex justify-between p-4 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{payment.tenantName}</p>
                  <p className="text-sm text-muted-foreground">{payment.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${payment.amount.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}