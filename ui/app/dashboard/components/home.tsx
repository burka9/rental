'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { axios } from "@/lib/axios";
import { ArrowRight } from "lucide-react";
import { links } from "./sidebar";

interface Overview {
  vacantRooms: number;
  tenants: number;
  rooms: number;
  buildings: number;
  users: number;
  banks: number;
  leases: number;
  payments: number;
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview>();

  useEffect(() => {
    axios.get('/util/overview')
      .then(res => {
        setOverview(res.data.data);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>
      
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-500">Total Rooms</CardDescription>
            <CardTitle className="text-2xl font-semibold">{overview?.rooms ?? '-'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/rooms">
              <Button variant="link" className="p-0 text-blue-600 hover:text-blue-800">
                View Rooms <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-500">Vacant Rooms</CardDescription>
            <CardTitle className="text-2xl font-semibold">{overview?.vacantRooms ?? '-'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/rooms?vacant=true">
              <Button variant="link" className="p-0 text-blue-600 hover:text-blue-800">
                Manage Rooms <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-500">Active Tenants</CardDescription>
            <CardTitle className="text-2xl font-semibold">{overview?.tenants ?? '-'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/tenants">
              <Button variant="link" className="p-0 text-blue-600 hover:text-blue-800">
                View Tenants <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mb-6 text-gray-900">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {links.map((link) => link.showOnDashboard && (
          <Link key={link.href} href={link.href}>
            <Card className="hover:bg-gray-50 transition-colors border-none shadow-sm">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <CardDescription className="text-gray-500">{link.title}</CardDescription>
                  <CardTitle className="text-lg font-medium">
                    {overview?.[link.selector as keyof Overview] ?? '-'}
                  </CardTitle>
                </div>
                <div className="text-gray-400">{link.icon}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}