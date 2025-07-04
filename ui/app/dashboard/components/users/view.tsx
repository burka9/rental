"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { toast } from "sonner"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

// Icons
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"

// Store
import { useUserStore } from "@/lib/store/users"
import { usePropertyStore } from "@/lib/store/property"
import { useStore } from "@/lib/store"

// Types
import { ROLES } from "@/lib/types"

// Loading Skeleton
const FormFieldSkeleton = ({ label = true }: { label?: boolean }) => (
  <div className="space-y-2">
    {label && <Skeleton className="h-4 w-24" />}
    <Skeleton className="h-10 w-full" />
  </div>
)



const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum([ROLES.ADMIN, ROLES.BUILDING_ADMIN, ROLES.TENANT, ROLES.BOARD_MEMBER, ROLES.FINANCE_ADMIN, ROLES.EMPTY]),
  buildingId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export default function ViewUser() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const isNew = searchParams.get('create') === 'true'
  
  // Form initialization first
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      password: '',
      role: ROLES.EMPTY,
      buildingId: '',
    },
  })
  
  // Stores
  const { fetchUser, createUser, updateUser, deleteUser } = useUserStore()
  const { buildings, fetchBuildings } = usePropertyStore()
  const { user: currentUser } = useStore()
  
  // State
  const [loading, setLoading] = useState(!isNew)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [role, setRole] = useState<FormValues['role']>(ROLES.EMPTY)
  const [editUser, setEditUser] = useState<{id?: number; name?: string; phone?: string; role?: string; buildingId?: number | null} | null>(null)
  
  // Watch for role changes
  const currentRole = form.watch('role')
  
  // Update role state when form value changes
  useEffect(() => {
    setRole(currentRole)
  }, [currentRole])
  

  useEffect(() => {
  }, [editUser])
  
  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await fetchBuildings()
        if (id) {
          const userData = await fetchUser(Number(id))
          if (userData) {
            setEditUser(userData)
            form.reset({
              name: userData.name || '',
              phone: userData.phone,
              password: '',
              role: userData.role as FormValues['role'],
              buildingId: userData.buildingId?.toString() || '',
            })
          }
        } else if (currentUser?.role === ROLES.BUILDING_ADMIN) {
          form.setValue('buildingId', currentUser.buildingId?.toString() || '')
          form.setValue('role', ROLES.TENANT)
        }
      } catch (err) {
        console.error('Failed to load data:', err)
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, fetchUser, fetchBuildings, form, currentUser])
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const payload = { ...values }
      
      // Don't send password if it's empty (edit mode)
      if (!payload.password) {
        delete payload.password
      }
      
      if (id) {
        const success = await updateUser({
          id: Number(id),
          name: payload.name,
          phone: payload.phone,
          password: payload.password,
          role: payload.role,
          buildingId: payload.buildingId ? Number(payload.buildingId) : null,
        })
        if (success) {
          setEditUser(prev => ({
            ...prev,
            name: payload.name,
            phone: payload.phone,
            role: payload.role,
            buildingId: payload.buildingId ? Number(payload.buildingId) : null,
          }))
          toast.success('User updated successfully')
          form.reset(undefined, { keepValues: true }) // Reset form but keep current values
        } else {
          throw new Error('Failed to update user')
        }
      } else {
        const success = await createUser({
          name: payload.name,
          phone: payload.phone,
          password: payload.password,
          role: payload.role,
          buildingId: payload.buildingId ? Number(payload.buildingId) : null,
        })
        if (success) {
          toast.success('User created successfully')
          router.push('/dashboard/users')
        } else {
          throw new Error('Failed to create user')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save user'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    if (!id) return
    
    setIsDeleting(true)
    try {
      const success = await deleteUser(Number(id))
      if (success) {
        toast.success('User deleted successfully')
        router.push('/dashboard/users')
      } else {
        throw new Error('Failed to delete user')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      toast.error(message)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center">
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
              <FormFieldSkeleton />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/users" className="flex items-center">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Link>
        </Button>
        
        {id && (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete User
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit User' : 'Create New User'}</CardTitle>
          <CardDescription>
            {id ? 'Update user information' : 'Add a new user to the system'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          disabled={isSubmitting} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1234567890" 
                          {...field} 
                          disabled={isSubmitting} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={id ? 'Leave blank to keep current' : 'Enter password'}
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting || currentUser?.role === ROLES.BUILDING_ADMIN}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ROLES)
                            .map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {key.replace(/_/g, ' ')}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {(role === ROLES.BUILDING_ADMIN || role === ROLES.TENANT) && (
                  <FormField
                    control={form.control}
                    name="buildingId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Building</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ''}
                          disabled={isSubmitting || currentUser?.role === ROLES.BUILDING_ADMIN}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a building" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {buildings.map((building) => (
                              <SelectItem key={building.id} value={building.id.toString()}>
                                {building.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/users')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : id ? (
                    'Save Changes'
                  ) : (
                    'Create User'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the user and all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}