/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Lease, Room } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { ChevronLeftIcon, X, Download, Eye, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTenantStore } from "@/lib/store/tenants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "./payment-schedule/data-table";
import { DataTable as RoomsDataTable } from "./roomsDataTable";
import { columns as roomsColumn } from "./roomsColumn";
import { columns } from "./payment-schedule/columns";
import { toEthiopian, toGregorian } from '@/lib/date-converter';
import { usePropertyStore } from "@/lib/store/property";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { baseURL } from "@/lib/axios";

// Ethiopian month names
const monthNames = [
  "መስከረም", // Meskerem (Month 1)
  "ጥቅምት", // Tikimt (Month 2)
  "ህዳር", // Hidar (Month 3)
  "ታህሳስ", // Tahsas (Month 4)
  "ጥር", // Tir (Month 5)
  "የካቲት", // Yekatit (Month 6)
  "መጋቢት", // Megabit (Month 7)
  "ሚያዝያ", // Miazia (Month 8)
  "ግንቦት", // Ginbot (Month 9)
  "ሰኔ", // Sene (Month 10)
  "ሐምሌ", // Hamle (Month 11)
  "ነሐሴ", // Nehase (Month 12)
  "ጳጉሜ", // Pagumē (Month 13)
] as const;

// Schema for date fields
const dateForm = z.object({
  day: z.coerce.number().optional(),
  month: z.coerce.number().optional(),
  year: z.coerce.number().optional(),
});

const roomForm = z.object({
  buildingId: z.string().min(1, "Building is required"),
  roomId: z.string().min(1, "Room is required"),
});

const formSchema = z.object({
  startDate: z.array(dateForm).min(1, "Start date is required"),
  endDate: z.array(dateForm).min(1, "End date is required"),
  tenantId: z.coerce.number().min(1, "Tenant is required"),
  paymentAmountPerMonth: z.object({
    base: z.coerce.number().min(0, "Base amount is required"),
    utility: z.coerce.number().min(0, "Utility amount is required"),
  }),
  deposit: z.coerce.number().min(0, "Deposit amount is required"),
  paymentIntervalInMonths: z.coerce.number().min(1, "Payment interval is required"),
  lateFee: z.coerce.number().min(0, "Late fee is required"),
  lateFeeType: z.enum(["PERCENTAGE", "FIXED"]),
  rooms: z.array(roomForm).optional(),
});

export default function ViewLease() {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [lease, setLease] = useState<Lease | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rentedRooms, setRentedRooms] = useState<Room[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false); // State for upload dialog
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // State for selected files
  const [leaseFiles, setLeaseFiles] = useState<{ id: number; name: string; url: string }[]>([]); // State for lease files
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchLease, createLease, updateLease, deleteLease, tenants, fetchTenants, addFilesToLease, removeFile } = useTenantStore();
  const { buildings, fetchBuildings, rooms, fetchRooms } = usePropertyStore();

  const form = useForm<z.infer<typeof formSchema>>({
    mode: "onChange",
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: [{ day: undefined, month: undefined, year: undefined }],
      endDate: [{ day: undefined, month: undefined, year: undefined }],
      tenantId: 0,
      paymentAmountPerMonth: { base: 0, utility: 0 },
      deposit: 0,
      paymentIntervalInMonths: 1,
      lateFee: 0,
      lateFeeType: "FIXED",
      rooms: [{}],
    },
  });

  const startDate = useFieldArray({
    control: form.control,
    name: "startDate",
  });

  const endDate = useFieldArray({
    control: form.control,
    name: "endDate",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms",
  });
  
  // Fetch buildings, rooms, and files only once on component mount or lease change
  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, [fetchBuildings, fetchRooms]);

  // Fetch rented rooms only when lease.roomIds changes
  const fetchRentedRooms = useCallback(async () => {
    if (!lease || !lease.roomIds || lease.roomIds.length === 0) {
      setRentedRooms([]);
      return;
    }
    try {
      const fetchedRooms = await fetchRooms(lease.roomIds);
      setRentedRooms(fetchedRooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRentedRooms([]);
    }
  }, [lease, fetchRooms]);

  useEffect(() => {
    if (!lease || !lease.id) return; // Prevent fetching if lease is not loaded
    fetchRentedRooms();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lease?.id, fetchRooms]); // Depend on lease.id instead of lease.roomIds

  // Fetch lease files
  const fetchLeaseFiles = useCallback(async () => {
    const files: any = lease?.files ?? [];
    setLeaseFiles(files.map((f: any, i: any) => ({
      id: i,
      name: f.filename,
      url: baseURL + '/' + f.path,
      path: f.path
    })))
    return []
  }, [lease]);

  useEffect(() => {
    fetchTenants();
    if (lease) fetchLeaseFiles();
  }, [fetchTenants, lease, fetchLeaseFiles]);

  useEffect(() => {
    const id = searchParams.get("id");
    const tenantId = searchParams.get("tenantId");
    if (!id || isNaN(Number(id))) {
      if (tenantId && !isNaN(Number(tenantId))) {
        setCreating(true);
        form.setValue("tenantId", Number(tenantId));
      }
      return;
    }

    fetchLease(Number(id))
      .then(data => {
        if (!data) {
          toast.error("Lease not found or invalid ID");
          setCreating(true);
          return;
        }
        setLease(data);

        const startDateValue = data.startDate && !isNaN(new Date(data.startDate).getTime())
          ? (() => {
              const gregDate = new Date(data.startDate);
              try {
                const [ethYear, ethMonth, ethDay] = toEthiopian(
                  gregDate.getFullYear(),
                  gregDate.getMonth() + 1,
                  gregDate.getDate()
                );
                return [{ year: ethYear, month: ethMonth, day: ethDay }];
              } catch (error) {
                console.error("Error converting startDate to Ethiopian:", error);
                return [{ day: undefined, month: undefined, year: undefined }];
              }
            })()
          : [{ day: undefined, month: undefined, year: undefined }];

        const endDateValue = data.endDate && !isNaN(new Date(data.endDate).getTime())
          ? (() => {
              const gregDate = new Date(data.endDate);
              try {
                const [ethYear, ethMonth, ethDay] = toEthiopian(
                  gregDate.getFullYear(),
                  gregDate.getMonth() + 1,
                  gregDate.getDate()
                );
                return [{ year: ethYear, month: ethMonth, day: ethDay }];
              } catch (error) {
                console.error("Error converting endDate to Ethiopian:", error);
                return [{ day: undefined, month: undefined, year: undefined }];
              }
            })()
          : [{ day: undefined, month: undefined, year: undefined }];

        // Pre-populate rooms with selected buildings and rooms
        const selectedRooms = data.roomIds?.map((roomId: number) => {
          const room = rooms.find((r) => String(r.id) === String(roomId));

          return {
            buildingId: room?.buildingId?.toString() ?? "",
            roomId: roomId.toString(),
          };
        }) ?? [{}];

        form.reset({
          startDate: startDateValue,
          endDate: endDateValue,
          tenantId: data.tenantId || 0,
          paymentAmountPerMonth: {
            base: data.paymentAmountPerMonth?.base || 0,
            utility: data.paymentAmountPerMonth?.utility || 0,
          },
          deposit: data.deposit || 0,
          paymentIntervalInMonths: data.paymentIntervalInMonths || 1,
          lateFee: data.lateFee || 0,
          lateFeeType: data.lateFeeType || "FIXED",
          rooms: selectedRooms,
        });
      })
      .catch(error => {
        console.error("Error fetching lease:", error);
        toast.error("Failed to load lease. Please try again.");
        setCreating(true);
      });
  }, [searchParams, fetchLease, form, fetchTenants, rooms]);

  useEffect(() => {
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");
  }, [searchParams]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const startDate = values.startDate[0].year && values.startDate[0].month && values.startDate[0].day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(
              values.startDate[0].year,
              values.startDate[0].month,
              values.startDate[0].day
            );
            return new Date(gregYear, gregMonth - 1, gregDay);
          } catch (error) {
            console.error("Error converting startDate to Gregorian:", error);
            return undefined;
          }
        })()
      : undefined;

    const endDate = values.endDate[0].year && values.endDate[0].month && values.endDate[0].day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(
              values.endDate[0].year,
              values.endDate[0].month,
              values.endDate[0].day
            );
            return new Date(gregYear, gregMonth - 1, gregDay);
          } catch (error) {
            console.error("Error converting endDate to Gregorian:", error);
            return undefined;
          }
        })()
      : undefined;

    if (!startDate || !endDate) {
      toast.error("Invalid start or end date");
      return;
    }

    const leaseData = {
      ...values,
      startDate: startDate,
      endDate: endDate,
      paymentType: "PREPAID" as const,
      lateFeeGracePeriodInDays: 0,
      roomIds: values.rooms?.map((room) => Number(room.roomId)) ?? [],
    };

    if (creating) {
      createLease(leaseData)
        .then(success => {
          if (success) {
            router.push("/dashboard/leases?message=Lease created successfully");
          } else {
            toast.error("Failed to create lease");
          }
        })
        .catch(error => {
          console.error(error);
          toast.error("Failed to create lease");
        });
    } else if (editing && lease) {
      updateLease({
        ...leaseData,
        id: lease.id,
      })
        .then(data => {
          if (data === null) {
            toast.error("Failed to update lease");
            return;
          }
          setLease(data);
          toast.success("Lease updated successfully");
          setEditing(false);
        })
        .catch(error => {
          console.error(error);
          toast.error("Failed to update lease");
        });
    }
  };

  const handleDelete = () => {
    if (!lease) return;

    deleteLease(lease.id)
      .then(success => {
        if (success) {
          router.push("/dashboard/leases?message=Lease deleted successfully");
        } else {
          toast.error("Failed to delete lease");
        }
      })
      .catch(error => {
        console.error(error);
        toast.error("Failed to delete lease");
      });
  };

  const getDaysInMonth = (monthIndex: number | undefined, year: number | undefined) => {
    if (!monthIndex || year === undefined) return [];
    if (monthIndex > monthNames.length) return [];
    
    const month = monthNames[monthIndex - 1];
    const isPagume = month === "ጳጉሜ";
    const dayCount = isPagume ? (year % 4 === 3 ? 6 : 5) : 30;
    return Array.from({ length: dayCount }, (_, idx) => idx + 1);
  };

  const getEthiopianYears = () => {
    const currentGregYear = new Date().getFullYear();
    const [currentEthYear] = toEthiopian(currentGregYear, 1, 1);
    return Array.from({ length: 51 }, (_, idx) => currentEthYear - 25 + idx);
  };

  // Handle file upload
  const handleFileUpload = async () => {
    if (!lease || selectedFiles.length === 0) {
      toast.error("No lease selected or no files to upload");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const updatedLease = await addFilesToLease(lease.id, formData)
      
      if (!updatedLease) {
        // toast.error("Failed to upload files");
        toast.error(`Failed to upload files`);
        return;
      }

      // if (response.ok) {
        toast.success("Files uploaded successfully");
        setShowUploadDialog(false);
        setSelectedFiles([]); // Clear files after successful upload
        fetchLeaseFiles(); // Refresh file list
        // router.refresh()
        window.location.reload()
      // } else {
        // const errorText = await response.text();
        // toast.error(`Failed to upload files: ${errorText}`);
      // }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred while uploading files");
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file =>
        file.type === "application/pdf" || file.type.startsWith("image/") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      if (files.length === 0) {
        toast.error("Please select only Word Documents, PDF or image files");
        return;
      }
      setSelectedFiles(files);
    }
  };

  // Handle file open (new tab)
  const handleOpenFile = (url: string) => {
    window.open(url, "_blank");
  };

  // Handle file download
  const handleDownloadFile = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (file: any) => {
    console.log('here')
    if (!lease) return
    
    await removeFile(lease?.id, file.path)

    window.location.reload()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/leases">
            <Button variant="ghost" size="sm" className="p-2">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {creating ? "Create Lease Agreement" : editing ? "Edit Lease Agreement" : "View Lease Agreement"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (!creating && !editing) {
                setEditing(true);
              } else {
                form.handleSubmit(handleSubmit)();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? "Create" : editing ? "Save Changes" : "Edit"}
          </Button>
          <Button
            variant={creating || editing ? "outline" : "destructive"}
            onClick={() => {
              if (creating) {
                router.push("/dashboard/leases");
              } else if (editing) {
                setEditing(false);
                form.reset({
                  startDate: lease?.startDate && !isNaN(new Date(lease.startDate).getTime())
                    ? (() => {
                        const gregDate = new Date(lease.startDate);
                        const [ethYear, ethMonth, ethDay] = toEthiopian(
                          gregDate.getFullYear(),
                          gregDate.getMonth() + 1,
                          gregDate.getDate()
                        );
                        return [{ year: ethYear, month: ethMonth, day: ethDay }];
                      })()
                    : [{ day: undefined, month: undefined, year: undefined }],
                  endDate: lease?.endDate && !isNaN(new Date(lease.endDate).getTime())
                    ? (() => {
                        const gregDate = new Date(lease.endDate);
                        const [ethYear, ethMonth, ethDay] = toEthiopian(
                          gregDate.getFullYear(),
                          gregDate.getMonth() + 1,
                          gregDate.getDate()
                        );
                        return [{ year: ethYear, month: ethMonth, day: ethDay }];
                      })()
                    : [{ day: undefined, month: undefined, year: undefined }],
                  tenantId: lease?.tenantId || 0,
                  paymentAmountPerMonth: {
                    base: lease?.paymentAmountPerMonth?.base || 0,
                    utility: lease?.paymentAmountPerMonth?.utility || 0,
                  },
                  deposit: lease?.deposit || 0,
                  paymentIntervalInMonths: lease?.paymentIntervalInMonths || 1,
                  lateFee: lease?.lateFee || 0,
                  lateFeeType: lease?.lateFeeType || "FIXED",
                  rooms: lease?.roomIds?.map((roomId: number) => {
                    const room = rooms.find((r) => r.id === roomId);
                    return {
                      buildingId: room?.buildingId?.toString() ?? "",
                      roomId: roomId.toString(),
                    };
                  }) ?? [{}],
                });
              } else {
                setShowDeleteDialog(true);
              }
            }}
          >
            {creating ? "Cancel" : editing ? "Cancel" : "Delete"}
          </Button>
          {!creating && !editing && lease && (
            <>
              <Link href={`/dashboard/payments/view?create=true&leaseId=${lease.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Add Payment
                </Button>
              </Link>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowUploadDialog(true)}
              >
                Add Files
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogTitle>Delete Lease</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this lease? This action cannot be undone.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* File Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Select PDF or image files to upload for this lease.
            </DialogDescription>
            <div className="py-4">
              <Input
                type="file"
                multiple
                accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                  <ul className="list-disc pl-5">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowUploadDialog(false);
                setSelectedFiles([]);
              }}>
                Cancel
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleFileUpload}
                disabled={selectedFiles.length === 0}
              >
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            <Card className="border-none shadow-md rounded-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Lease Information</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="tenantId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Tenant</FormLabel>
                        <Select
                          disabled={!creating && !editing}
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "border-gray-200 rounded-md shadow-sm transition-all",
                                !creating && !editing
                                  ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                  : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              )}
                            >
                              <SelectValue placeholder="Select a tenant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tenants.map((tenant) => (
                              <SelectItem key={tenant.id} value={tenant.id.toString()}>
                                {tenant.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentIntervalInMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Payment Interval (Months)</FormLabel>
                        <Select
                          disabled={!creating && !editing}
                          onValueChange={(value) => field.onChange(Number(value))}
                          value={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "w-[120px] border-gray-200 rounded-md shadow-sm transition-all",
                                !creating && !editing
                                  ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                  : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              )}
                            >
                              <SelectValue placeholder="Interval" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.from({ length: 12 }).map((_, idx) => (
                              <SelectItem key={idx} value={`${idx + 1}`}>
                                {idx + 1} Month{idx + 1 > 1 ? "s" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    {startDate.fields.map((field, index) => (
                      <div key={field.id}>
                        <FormLabel className="text-gray-700">Start Date (Ethiopian Calendar)</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`startDate.${index}.year`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={!creating && !editing}
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    form.setValue(`startDate.${index}.day`, undefined);
                                  }}
                                  value={field.value?.toString() ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                        !creating && !editing
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getEthiopianYears().map((year) => (
                                      <SelectItem key={year} value={year.toString()}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`startDate.${index}.month`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={!creating && !editing}
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    form.setValue(`startDate.${index}.day`, undefined);
                                  }}
                                  value={field.value?.toString() ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                        !creating && !editing
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {monthNames.map((month, idx) => (
                                      <SelectItem key={month} value={(idx + 1).toString()}>
                                        {month}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`startDate.${index}.day`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={!creating && !editing || !form.watch(`startDate.${index}.month`)}
                                  onValueChange={(value) => field.onChange(Number(value))}
                                  value={field.value?.toString() ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "w-[80px] border-gray-200 rounded-md shadow-sm transition-all",
                                        (!creating && !editing) || !form.watch(`startDate.${index}.month`)
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Day" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getDaysInMonth(
                                      form.watch(`startDate.${index}.month`),
                                      form.watch(`startDate.${index}.year`)
                                    ).map((day) => (
                                      <SelectItem key={day} value={day.toString()}>
                                        {day}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    {endDate.fields.map((field, index) => (
                      <div key={field.id}>
                        <FormLabel className="text-gray-700">End Date (Ethiopian Calendar)</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField
                            control={form.control}
                            name={`endDate.${index}.year`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={!creating && !editing}
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    form.setValue(`endDate.${index}.day`, undefined);
                                  }}
                                  value={field.value?.toString() ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                        !creating && !editing
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Year" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getEthiopianYears().map((year) => (
                                      <SelectItem key={year} value={year.toString()}>
                                        {year}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`endDate.${index}.month`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={!creating && !editing}
                                  onValueChange={(value) => {
                                    field.onChange(Number(value));
                                    form.setValue(`endDate.${index}.day`, undefined);
                                  }}
                                  value={field.value?.toString() ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                        !creating && !editing
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {monthNames.map((month, idx) => (
                                      <SelectItem key={month} value={(idx + 1).toString()}>
                                        {month}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`endDate.${index}.day`}
                            render={({ field }) => (
                              <FormItem>
                                <Select
                                  disabled={!creating && !editing || !form.watch(`endDate.${index}.month`)}
                                  onValueChange={(value) => field.onChange(Number(value))}
                                  value={field.value?.toString() ?? ""}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={cn(
                                        "w-[80px] border-gray-200 rounded-md shadow-sm transition-all",
                                        (!creating && !editing) || !form.watch(`endDate.${index}.month`)
                                          ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                          : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      )}
                                    >
                                      <SelectValue placeholder="Day" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getDaysInMonth(
                                      form.watch(`endDate.${index}.month`),
                                      form.watch(`endDate.${index}.year`)
                                    ).map((day) => (
                                      <SelectItem key={day} value={day.toString()}>
                                        {day}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500 text-sm" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Payment Details</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <FormField
                    control={form.control}
                    name="paymentAmountPerMonth.base"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Base Payment Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            disabled={!creating && !editing}
                            {...field}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentAmountPerMonth.utility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Utility Payment Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            disabled={!creating && !editing}
                            {...field}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deposit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Deposit Amount</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            disabled={!creating && !editing}
                            {...field}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lateFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Late Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            disabled={!creating && !editing}
                            {...field}
                            className={cn(
                              "border-gray-200 rounded-md shadow-sm transition-all",
                              !creating && !editing
                                ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lateFeeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">Late Fee Type</FormLabel>
                        <Select
                          disabled={!creating && !editing}
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                "border-gray-200 rounded-md shadow-sm transition-all",
                                !creating && !editing
                                  ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                  : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              )}
                            >
                              <SelectValue placeholder="Select late fee type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-500 text-sm" />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-lg">
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">Rented Rooms</h2>
              </CardHeader>
              <CardContent>
                {(creating || editing) ? (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" key={field.id}>
                        <FormField
                          control={form.control}
                          name={`rooms.${index}.buildingId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Select Building</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  form.setValue(`rooms.${index}.roomId`, "");
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <SelectValue placeholder="Select Building" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {buildings.map((bldg) => (
                                    <SelectItem key={bldg.id} value={bldg.id.toString()}>
                                      {bldg.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`rooms.${index}.roomId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700">Select Room</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!form.watch(`rooms.${index}.buildingId`)}
                              >
                                <FormControl>
                                  <SelectTrigger
                                    className={cn(
                                      "border-gray-200 rounded-md shadow-sm transition-all",
                                      !form.watch(`rooms.${index}.buildingId`)
                                        ? "bg-gray-100 opacity-70 cursor-not-allowed"
                                        : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    )}
                                  >
                                    <SelectValue placeholder="Select Room" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {rooms
                                    .filter((room) => {
                                      if (editing) {
                                        
                                      }
                                      
                                      return !room.occupied || (lease?.roomIds?.includes(room.id) && editing)
                                    })
                                    .filter(
                                      (room) =>
                                        room.buildingId?.toString() ===
                                        form.watch(`rooms.${index}.buildingId`)
                                    )
                                    .map((room) => (
                                      <SelectItem key={room.id} value={room.id.toString()}>
                                        {room.name}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-500 text-sm" />
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && (
                          <div className="flex items-end">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        className="text-blue-600 hover:underline text-sm font-medium"
                        onClick={() => append({ buildingId: "", roomId: "" })}
                      >
                        + Add More Rooms
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-6">
                    <RoomsDataTable columns={roomsColumn} data={rentedRooms} />
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>

        {!editing && lease && (
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
            </CardHeader>
            <CardContent className="pt-6">
              {leaseFiles.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaseFiles.map((file) => (
                        <tr key={file.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mr-2"
                              onClick={() => handleOpenFile(file.url)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(file.url, file.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file)}
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No files uploaded for this lease.</p>
              )}
            </CardContent>
          </Card>
        )}

        {!editing && lease && lease.paymentSchedule && lease.paymentSchedule.length > 0 && (
          <Card className="border-none shadow-md rounded-lg">
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">Payment Schedule</h2>
            </CardHeader>
            <CardContent className="pt-6">
              <DataTable columns={columns} data={lease.paymentSchedule} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}