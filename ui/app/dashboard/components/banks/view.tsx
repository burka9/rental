import { usePropertyStore } from "@/lib/store/property"
import { Bank } from "@/lib/types"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ArrowLeft, Landmark, Loader2, PencilIcon, Save, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const formSchema = z.object({
  name: z.string().min(1, "Bank name is required"),
  branch: z.string().min(1, "Branch is required"),
  accountNumber: z.string().min(1, "Account number is required"),
})

export default function ViewBank() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [bank, setBank] = useState<Bank | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const { fetchBank, createBank, updateBank, deleteBank } = usePropertyStore()
  const searchParams = useSearchParams()

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      branch: "",
      accountNumber: "",
    }
  })

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setSubmitting(true)
    try {
      if (creating) {
        const data = await createBank(values)
        if (data) {
          toast.success("Bank account created successfully")
          router.push(`/dashboard/banks?message=Bank created successfully`)
        }
      } else if (editing && bank) {
        const updatedBank = await updateBank({
          ...values,
          id: bank.id,
        })
        if (updatedBank) {
          setBank(updatedBank)
          setEditing(false)
          toast.success("Bank account updated successfully")
        }
      }
    } catch (error) {
      console.error("Error saving bank:", error)
      toast.error("Failed to save bank account. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }
	  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)

  const handleDelete = async () => {
    try {
      const success = await deleteBank(bank?.id ?? 0)
      if (success) {
        toast.success("Bank account deleted successfully")
        router.push(`/dashboard/banks?message=Bank deleted successfully`)
      }
    } catch (error) {
      console.error("Error deleting bank:", error)
      toast.error("Failed to delete bank account")
    }
  }

  useEffect(() => {
    const id = Number(searchParams.get("id"))
    const isCreating = searchParams.get("create") === "true"
    const isEditing = searchParams.get("edit") === "true"

    setCreating(isCreating)
    setEditing(isCreating || isEditing)

    if (isCreating) {
      setLoading(false)
      return
    }

    if (!id) {
      router.push("/dashboard/banks")
      return
    }

    setLoading(true)
    fetchBank(id)
      .then((data) => {
        if (!data) {
          router.push("/dashboard/banks")
          return
        }
        setBank(data)
        form.reset({
          name: data.name,
          branch: data.branch,
          accountNumber: data.accountNumber
        })
      })
      .catch((error) => {
        console.error("Error fetching bank:", error)
        toast.error("Failed to load bank details")
        router.push("/dashboard/banks")
      })
      .finally(() => setLoading(false))
  }, [searchParams, fetchBank, router, form])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col gap-6">
          <Skeleton className="h-10 w-64" />
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {creating ? 'Add New Bank Account' : editing ? 'Edit Bank Account' : 'Bank Account Details'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {creating ? 'Enter the bank account details' : editing ? 'Update the bank account information' : 'View bank account information'}
              </p>
            </div>
          </div>
          
          {!creating && (
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setEditing(false)
                      form.reset({
                        name: bank?.name || '',
                        branch: bank?.branch || '',
                        accountNumber: bank?.accountNumber || ''
                      })
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={form.handleSubmit(handleSubmit)}
                    disabled={submitting || !form.formState.isDirty}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setOpenDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button 
                    onClick={() => setEditing(true)}
                    className="gap-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <DialogTitle>Delete Bank Account</DialogTitle>
              </div>
              <DialogDescription className="pt-2">
                Are you sure you want to delete this bank account? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setOpenDeleteDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDelete}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle>Bank Information</CardTitle>
            </div>
            <CardDescription>
              {creating ? 'Enter the bank account details' : 'View and manage bank account information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Commercial Bank of Ethiopia"
                            readOnly={!creating && !editing}
                            className={creating || editing ? "bg-white" : "bg-muted/50"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Bole Branch"
                            readOnly={!creating && !editing}
                            className={creating || editing ? "bg-white" : "bg-muted/50"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., 1000345678901"
                            readOnly={!creating && !editing}
                            className={creating || editing ? "bg-white" : "bg-muted/50"}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {creating && (
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.back()}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || !form.formState.isDirty}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : 'Create Bank Account'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}