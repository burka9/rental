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
import { Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useEffect } from 'react';

const formSchema = z.object({
  tenantId: z.string().optional(),
  phoneNumber: z.string().optional(),
  message: z.string().min(1, 'Message content is required'),
});

export default function Notification() {
  const { tenants, fetchTenants } = useTenantStore();

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
        // form.reset();
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to send notification');
    }
  };

	useEffect(() => {
		fetchTenants()
	}, [fetchTenants]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Send Notification</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="tenantId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tenant</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
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
                    <PopoverContent className="w-full p-0">
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
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Phone number" readOnly />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message Content</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Enter your message" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button className='mt-6' type="submit">Send Notification</Button>
        </form>
      </Form>
    </div>
  );
}