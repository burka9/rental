'use client'

import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/lib/store/tenants";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner"
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Loader2, 
  Search, 
  Plus, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Leases() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchLeases, leases, totalLeases } = useTenantStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Fetch leases with pagination
  useEffect(() => {
    const loadLeases = async () => {
      setLoading(true);
      try {
        await fetchLeases(currentPage, pageSize);
      } catch (error) {
        console.error("Failed to fetch leases:", error);
        toast.error("Failed to load leases");
      } finally {
        setLoading(false);
      }
    };

    loadLeases();
  }, [fetchLeases, currentPage, pageSize]);

  // Handle success message from search params
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.success(message);
    }
  }, [searchParams]);

  // Filter and sort leases
  const filteredLeases = useMemo(() => {
    return leases.filter(lease => {
      const matchesSearch = 
        lease.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lease.id.toString().includes(searchTerm);
      
      if (activeTab === "active") return matchesSearch && lease.active;
      if (activeTab === "expired") return matchesSearch && new Date(lease.endDate) < new Date();
      return matchesSearch;
    }).sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [leases, searchTerm, activeTab]);

  // Pagination calculations
  const totalPages = Math.ceil(totalLeases / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  interface LeaseStatus {
    label: string;
    variant: 'default' | 'destructive' | 'secondary';
  }

  interface Lease {
    id: number;
    startDate: string | Date;
    endDate: string | Date;
    active: boolean;
    paymentAmountPerMonth: {
      base: number;
      utility: number;
      [key: string]: number;
    };
    roomIds: number[];
    tenant?: {
      name: string;
    };
  }

  const getLeaseStatus = (lease: Lease): LeaseStatus => {
    const today = new Date();
    const endDate = new Date(lease.endDate);
    const startDate = new Date(lease.startDate);
    
    if (endDate < today) return { label: 'Expired', variant: 'destructive' };
    if (startDate > today) return { label: 'Upcoming', variant: 'secondary' };
    return { label: 'Active', variant: 'default' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col space-y-4 mb-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Lease Management</h1>
          <p className="text-gray-500">
            Manage all lease agreements and monitor their status
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by tenant name, lease ID, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <Link href="/dashboard/leases/view?create=true" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 flex items-center gap-2 h-10">
              <Plus className="h-4 w-4" />
              New Lease
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Leases</p>
                <p className="text-2xl font-semibold">{totalLeases}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Leases</p>
                <p className="text-2xl font-semibold">
                  {leases.filter(l => l.active).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-semibold">
                  {leases.filter(l => {
                    const endDate = new Date(l.endDate);
                    const today = new Date();
                    const diffTime = endDate.getTime() - today.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 30 && diffDays >= 0;
                  }).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-amber-100">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expired Leases</p>
                <p className="text-2xl font-semibold">
                  {leases.filter(l => new Date(l.endDate) < new Date()).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-none shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="bg-gray-50 px-6 py-4 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Lease Directory</h2>
              <p className="text-sm text-gray-500">
                {filteredLeases.length} {filteredLeases.length === 1 ? 'lease' : 'leases'} found
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="h-9 border-gray-200">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Leases</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-500">Loading leases...</p>
            </div>
          ) : filteredLeases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No leases found</h3>
              <p className="text-gray-500 mt-1 max-w-md">
                {searchTerm ? 
                  'No leases match your search criteria. Try adjusting your search.' : 
                  'Get started by creating a new lease agreement.'}
              </p>
              {!searchTerm && (
                <Link href="/dashboard/leases/view?create=true" className="mt-4">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Lease
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLeases.map((lease) => {
                const status = getLeaseStatus(lease);
                const totalAmount = lease.paymentAmountPerMonth?.base + (lease.paymentAmountPerMonth?.utility || 0);
                
                return (
                  <div 
                    key={lease.id} 
                    className="p-6 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                    onClick={() => router.push(`/dashboard/leases/view?id=${lease.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base font-medium text-gray-900 truncate">
                                {lease.tenant?.name || 'Unknown Tenant'}
                              </h3>
                              <Badge variant={status.variant} className="text-xs">
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Lease #{lease.id} • {format(new Date(lease.startDate), 'MMM d, yyyy')} - {format(new Date(lease.endDate), 'MMM d, yyyy')}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:items-end space-y-1">
                        <p className="text-base font-medium text-gray-900">
                          {formatCurrency(totalAmount)}
                          <span className="text-sm font-normal text-gray-500">/month</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {lease.roomIds?.length || 0} {lease.roomIds?.length === 1 ? 'room' : 'rooms'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {filteredLeases.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, filteredLeases.length)}
                  </span>{" "}
                  of <span className="font-medium">{filteredLeases.length}</span> leases
                </p>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="h-9 w-9 p-0"
                  >
                    <span className="sr-only">Previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={`h-9 min-w-9 ${
                            currentPage === pageNum 
                              ? 'bg-blue-600 text-white' 
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <span className="px-2 text-sm text-gray-500">...</span>
                    )}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        className={`h-9 min-w-9 ${
                          currentPage === totalPages 
                            ? 'bg-blue-600 text-white' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {totalPages}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="h-9 w-9 p-0"
                  >
                    <span className="sr-only">Next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}