'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useTenantStore } from '@/lib/store/tenants';
import { axios } from '@/lib/axios';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, ChevronLeftIcon } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

const formSchema = z.object({
  tenantId: z.string().optional(),
  phoneNumber: z.string().optional(),
  message: z.string().min(1, 'Message content is required'),
});

export default function Notification() {
  const { tenants, fetchTenants } = useTenantStore();
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tenantId: '',
      phoneNumber: '',
      message: '',
    },
  });

  const handleTenantSelect = (tenantId: string) => {
    const selectedTenant = tenants.find(tenant => tenant.id === Number(tenantId));
    form.setValue('tenantId', tenantId);
    form.setValue('phoneNumber', selectedTenant?.phone || '');
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post('/util/send-notification', {
        tenantId: values.tenantId ? Number(values.tenantId) : undefined,
        phoneNumber: values.phoneNumber || undefined,
        message: values.message,
      });

      if (response.status === 200) {
        toast.success('Notification sent successfully');
        form.reset();
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to send notification');
    }
  };

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setIsLoading(true);
        await fetchTenants();
      } catch (error) {
        console.error('Error fetching tenants:', error);
        toast.error('Failed to load tenants');
      } finally {
        setIsLoading(false);
      }
    };
    loadTenants();
  }, []); // Run only on mount

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/home">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Send Notification</h1>
        </div>
      </div>

      <Card className="border-none shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">Notification Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="tenantId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-700">Tenant</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-[250px] border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500 justify-between",
                                !field.value && "text-gray-500"
                              )}
                            >
                              {field.value
                                ? tenants.find(
                                    (tenant) => tenant.id === Number(field.value)
                                  )?.name
                                : "Select tenant"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-0">
                          <Command>
                            <CommandInput placeholder="Search tenant..." className="h-9" />
                            <CommandList>
                              <CommandEmpty>No tenant found.</CommandEmpty>
                              <CommandGroup>
                                {tenants.map((tenant) => (
                                  <CommandItem
                                    value={tenant.name}
                                    key={tenant.id}
                                    onSelect={() => handleTenantSelect(tenant.id.toString())}
                                  >
                                    {tenant.name}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        tenant.id.toString() === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Phone number"
                          readOnly
                          className="w-[250px] border-gray-200 rounded-md shadow-sm bg-gray-100 opacity-70 cursor-not-allowed transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Message Content</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter your message"
                        className="w-full max-w-[600px] border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-all mt-4"
              >
                Send Notification
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}