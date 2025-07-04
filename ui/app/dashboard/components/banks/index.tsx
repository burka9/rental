'use client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { usePropertyStore } from "@/lib/store/property"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import Link from "next/link"
import { Landmark, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function BanksPage() {
  const searchParams = useSearchParams()
  const { fetchBanks, banks } = usePropertyStore()
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const loadBanks = async () => {
      try {
        setLoading(true)
        await fetchBanks()
      } catch (error) {
        console.error("Failed to load banks:", error)
        toast.error("Failed to load banks. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    loadBanks()
  }, [fetchBanks])

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!)
    }
  }, [searchParams])

  if (!isClient) {
    return <BanksSkeleton />
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Bank Accounts</h1>
            <p className="text-muted-foreground">
              Manage your bank accounts and their details
            </p>
          </div>
          <Link href="/dashboard/banks/view?create=true" className="w-full md:w-auto">
            <Button className="w-full md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add New Bank
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-6 w-6 text-primary" />
              <CardTitle>Bank Accounts</CardTitle>
            </div>
            <CardDescription>
              View and manage all your bank accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : banks && banks.length > 0 ? (
              <DataTable columns={columns} data={banks} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Landmark className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bank accounts found</h3>
                <p className="text-muted-foreground mb-6">
                  Get started by adding your first bank account
                </p>
                <Link href="/dashboard/banks/view?create=true">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Bank Account
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BanksSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-[400px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}