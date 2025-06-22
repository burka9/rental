'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { axios } from "@/lib/axios";
import { ArrowRight, Home, Users, Building, CreditCard, FileText, UserPlus, Calendar, DollarSign } from "lucide-react";
import { links } from "./sidebar";
import { useStore } from "@/lib/store";
import { ROLES } from "@/lib/types";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { usePropertyStore } from "@/lib/store/property";

interface Room {
  id: number;
  name: string;
  // Add other room properties as needed
}

interface Building {
  id: number;
  name: string;
  address?: string;
  noOfFloors?: number;
  rooms?: Room[];
  tenantCount?: number;
}

interface Overview {
  vacantRooms: number;
  tenants: number;
  rooms: number;
  buildings: number;
  users: number;
  banks: number;
  leases: number;
  payments: number;
  buildingsList?: Building[];
}

export default function Dashboard() {
  const [overview, setOverview] = useState<Overview>();
  const [loading, setLoading] = useState(true)
  const router = useRouter();
  const { user } = useStore();
  const { fetchBuildings } = usePropertyStore();
  
  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  useEffect(() => {
    if (!user?.token) return
    console.log('user - home')
    console.log(user)
    axios.get('/util/overview', {
      headers: {
        Authorization: `Bearer ${user?.token}`
      }
    })
      .then(res => {
        setOverview(res.data.data);
        setLoading(false)
      })
      .catch(console.error);
  }, [user]);

  // Show loading overlay when page is loading
  if (loading) {
    return <LoadingSpinner fullScreen size="lg" text="Loading..." />;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{getGreeting()}, {user?.phone || 'Admin'}!</h1>
              <p className="text-blue-100">Here&apos;s what&apos;s happening with your properties today</p>
            </div>
            <Badge variant="secondary" className="mt-4 md:mt-0 bg-white/10 hover:bg-white/20 text-white border-0 px-4 py-2 text-sm font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 -mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Properties" 
            value={overview?.buildings ?? '0'} 
            icon={<Building className="h-6 w-6" />}
            color="bg-blue-100 text-blue-600"
            href="/dashboard/buildings"
          />
          <StatCard 
            title="Total Rooms" 
            value={overview?.rooms ?? '0'} 
            icon={<Home className="h-6 w-6" />}
            color="bg-green-100 text-green-600"
            href="/dashboard/rooms"
          />
          <StatCard 
            title="Vacant Rooms" 
            value={overview?.vacantRooms ?? '0'} 
            icon={<Home className="h-6 w-6" />}
            color="bg-amber-100 text-amber-600"
            href="/dashboard/rooms?vacant=true"
          />
          <StatCard 
            title="Active Tenants" 
            value={overview?.tenants ?? '0'} 
            icon={<Users className="h-6 w-6" />}
            color="bg-purple-100 text-purple-600"
            href="/dashboard/tenants"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <span>Quick Actions</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {links.filter(link => link.roles.includes(user?.role as ROLES) && link.showOnDashboard).length} Actions
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ActionCard 
                    title="Add New Tenant" 
                    description="Register a new tenant and assign a room"
                    icon={<UserPlus className="h-5 w-5" />}
                    href="/dashboard/tenants/new"
                  />
                  <ActionCard 
                    title="Record Payment" 
                    description="Record a new rent payment"
                    icon={<DollarSign className="h-5 w-5" />}
                    href="/dashboard/payments/new"
                  />
                  <ActionCard 
                    title="Create Lease" 
                    description="Generate a new lease agreement"
                    icon={<FileText className="h-5 w-5" />}
                    href="/dashboard/leases/new"
                  />
                  <ActionCard 
                    title="Schedule Maintenance" 
                    description="Request property maintenance"
                    icon={<Calendar className="h-5 w-5" />}
                    href="/dashboard/maintenance/new"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div>
            <Card className="border-0 shadow-sm h-full">
              <CardHeader>
                <CardTitle className="text-xl">Recent Activity</CardTitle>
                <CardDescription>Latest system events and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">New payment received</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="link" className="w-full text-blue-600 hover:no-underline mt-2">
                    View all activity <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Buildings Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Buildings</h2>
            <Button
              data-roles={[ROLES.SUPERADMIN,ROLES.ADMIN]}
              onClick={() => router.push('/dashboard/buildings')}
              variant="outline"
              className="text-blue-600 hover:bg-blue-50 border-blue-200"
            >
              View All Buildings
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="md" text="Loading buildings..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {overview?.buildingsList?.slice(0, 4).map(building => (
                <Card
                  key={building.id}
                  className="hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
                  onClick={() => router.push(`/dashboard/buildings/view?id=${building.id}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                      {building.name}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500 truncate">
                      {building.address || 'No address'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 mt-auto">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500">Rooms</span>
                        <span className="font-medium">{building.rooms?.length ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Floors</span>
                        <span className="font-medium">{building.noOfFloors ?? '-'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Tenants</span>
                        <span className="font-medium">{building.tenantCount ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Status</span>
                        <span className="font-medium text-green-600">Active</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {overview?.buildingsList?.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No buildings found</p>
                  <Button 
                    variant="link" 
                    className="mt-2 text-blue-600"
                    onClick={() => router.push('/dashboard/buildings?create=true')}
                  >
                    Add your first building
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {links
              .filter(link => link.roles.includes(user?.role as ROLES) && link.showOnDashboard)
              .map((link) => (
                <Link key={link.href} href={link.href}>
                  <Card className="h-full transition-all hover:shadow-md border border-gray-100 hover:border-blue-100">
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center">
                      <div className="bg-blue-50 p-3 rounded-full mb-3 text-blue-600">
                        {link.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{link.title}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({ title, value, icon, color, href }: { title: string; value: string | number; icon: React.ReactNode; color: string; href: string }) {
  return (
    <Link href={href}>
      <Card className="group border-0 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
              <h3 className="text-2xl font-bold">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
              {icon}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
            View details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Reusable Action Card Component
function ActionCard({ title, description, icon, href }: { title: string; description: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href}>
      <Card className="h-full border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              {icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-900">{title}</h4>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}