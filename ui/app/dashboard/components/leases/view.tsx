/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Lease, ROLES, Room } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Link from "next/link";
import { ChevronLeftIcon, X, Download, Eye, Trash2Icon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTenantStore } from "@/lib/store/tenants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataTable } from "./payment-schedule/data-table";
import { DataTable as RoomsDataTable } from "./roomsDataTable";
import { columns as roomsColumn } from "./roomsColumn";
import { columns } from "./payment-schedule/columns";
import { toEthiopian, toGregorian } from '@/lib/date-converter';
import { usePropertyStore } from "@/lib/store/property";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn, toEthiopianDateString } from "@/lib/utils";
import { baseURL } from "@/lib/axios";
import { Badge } from "@/components/ui/badge";
import { LeaseLoading } from "./loading";

// Ethiopian month names
const monthNames = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
] as const;

// Schema definitions
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
  const [loading, setLoading] = useState(true);
  const [lease, setLease] = useState<Lease | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rentedRooms, setRentedRooms] = useState<Room[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [leaseFiles, setLeaseFiles] = useState<{ id: number; name: string; url: string; path: string }[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchLease, createLease, updateLease, terminateLease, tenants, fetchTenants, addFilesToLease, removeFile } = useTenantStore();
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rooms",
  });

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBuildings(),
          // fetchRooms(),
          fetchTenants()]);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchBuildings, fetchTenants]);

  // Fetch rooms initial
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchRooms()
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [fetchRooms])
  
  // Fetch lease and files
  useEffect(() => {
    const id = searchParams.get("id");
    const tenantId = searchParams.get("tenantId");
    setCreating(searchParams.get("create") === "true");
    setEditing(searchParams.get("edit") === "true");

    if (!id || isNaN(Number(id))) {
      if (tenantId && !isNaN(Number(tenantId))) {
        setCreating(true);
        form.setValue("tenantId", Number(tenantId));
      }
      setLoading(false);
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
                const [ethYear, ethMonth, ethDay] = toEthiopian(gregDate.getFullYear(), gregDate.getMonth() + 1, gregDate.getDate());
                return [{ year: ethYear, month: ethMonth, day: ethDay }];
              } catch (error) {
                console.error("Error converting startDate:", error);
                return [{ day: undefined, month: undefined, year: undefined }];
              }
            })()
          : [{ day: undefined, month: undefined, year: undefined }];

        const endDateValue = data.endDate && !isNaN(new Date(data.endDate).getTime())
          ? (() => {
              const gregDate = new Date(data.endDate);
              try {
                const [ethYear, ethMonth, ethDay] = toEthiopian(gregDate.getFullYear(), gregDate.getMonth() + 1, gregDate.getDate());
                return [{ year: ethYear, month: ethMonth, day: ethDay }];
              } catch (error) {
                console.error("Error converting endDate:", error);
                return [{ day: undefined, month: undefined, year: undefined }];
              }
            })()
          : [{ day: undefined, month: undefined, year: undefined }];

        const selectedRooms = data.roomIds?.map((roomId: number) => {
          const room = rooms.find((r) => String(r.id) === String(roomId));
          return { buildingId: room?.buildingId?.toString() ?? "", roomId: roomId.toString() };
        }) ?? [{}];

        form.reset({
          startDate: startDateValue,
          endDate: endDateValue,
          tenantId: data.tenantId || 0,
          paymentAmountPerMonth: { base: data.paymentAmountPerMonth?.base || 0, utility: data.paymentAmountPerMonth?.utility || 0 },
          deposit: data.deposit || 0,
          paymentIntervalInMonths: data.paymentIntervalInMonths || 1,
          lateFee: data.lateFee || 0,
          lateFeeType: data.lateFeeType || "FIXED",
          rooms: selectedRooms,
        });
      })
      .catch(error => {
        console.error("Error fetching lease:", error);
        toast.error("Failed to load lease");
        setCreating(true);
      })
      .finally(() => setLoading(false));
  }, [searchParams, fetchLease, form, rooms]);

  // Fetch rented rooms
  useEffect(() => {
    const fetchRentedRooms = async () => {
      if (!lease?.id || !lease?.roomIds || lease.roomIds.length === 0) {
        setRentedRooms([]);
        return;
      }
      try {
        const fetchedRooms = await fetchRooms(lease.roomIds);
        setRentedRooms(fetchedRooms);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        toast.error("Failed to load rented rooms");
        setRentedRooms([]);
      }
    };

    fetchRentedRooms();
  }, [lease?.id, JSON.stringify(lease?.roomIds), fetchRooms]);

  // Fetch lease files
  const fetchLeaseFiles = useCallback(async () => {
    if (!lease?.files) return;
    try {
      const files = lease.files.map((file, index) => ({
        id: index,
        name: file.filename,
        url: `${baseURL}/${file.path}`,
        path: file.path,
      }));
      setLeaseFiles(files);
    } catch (error) {
      console.error("Error fetching lease files:", error);
      toast.error("Failed to load lease files");
    }
  }, [lease]);

  useEffect(() => {
    if (lease?.id) fetchLeaseFiles();
  }, [lease?.id, fetchLeaseFiles]);

  // Form submission
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    const startDate = values.startDate[0].year && values.startDate[0].month && values.startDate[0].day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(values.startDate[0].year, values.startDate[0].month, values.startDate[0].day);
            return new Date(gregYear, gregMonth - 1, gregDay);
          } catch (error) {
            console.error("Error converting startDate:", error);
            return undefined;
          }
        })()
      : undefined;

    const endDate = values.endDate[0].year && values.endDate[0].month && values.endDate[0].day
      ? (() => {
          try {
            const [gregYear, gregMonth, gregDay] = toGregorian(values.endDate[0].year, values.endDate[0].month, values.endDate[0].day);
            return new Date(gregYear, gregMonth - 1, gregDay);
          } catch (error) {
            console.error("Error converting endDate:", error);
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
      startDate,
      endDate,
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
      updateLease({ ...leaseData, id: lease.id })
        .then(data => {
          if (data) {
            setLease(data);
            toast.success("Lease updated successfully");
            setEditing(false);
          } else {
            toast.error("Failed to update lease");
          }
        })
        .catch(error => {
          console.error(error);
          toast.error("Failed to update lease");
        });
    }
  };

  // Terminate lease
  const handleTerminate = () => {
    if (!lease) return;
    setIsDeleting(true);
    terminateLease(lease.id)
      .then(success => {
        if (success) {
          router.push("/dashboard/leases?message=Lease terminated successfully");
        } else {
          toast.error("Failed to terminate lease");
        }
      })
      .catch(error => {
        console.error(error);
        toast.error("Failed to terminate lease");
      })
      .finally(() => setIsDeleting(false));
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(file =>
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      if (files.length === 0) {
        toast.error("Please select PDF, image, or Word files");
        return;
      }
      setSelectedFiles(files);
    }
  };

  const handleFileUpload = async () => {
    if (!lease || selectedFiles.length === 0) {
      toast.error("No lease selected or no files to upload");
      return;
    }
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    try {
      const updatedLease = await addFilesToLease(lease.id, formData);
      if (updatedLease) {
        toast.success("Files uploaded successfully");
        setShowUploadDialog(false);
        setSelectedFiles([]);
        fetchLeaseFiles();
      } else {
        toast.error("Failed to upload files");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenFile = (url: string) => {
    window.open(url, "_blank");
  };

  const handleDownloadFile = (url: string, name: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (file: { id: number; name: string; url: string; path: string }) => {
    if (!lease) return;
    try {
      await removeFile(lease.id, file.path);
      toast.success("File deleted successfully");
      fetchLeaseFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  // Ethiopian calendar helpers
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

  if (loading) return <LeaseLoading />;

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="icon" className="h-8 w-8">
            <Link href="/dashboard/leases">
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="sr-only">Back to leases</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {creating ? "Create Lease" : editing ? "Edit Lease" : `Lease #${lease?.id}`}
            </h1>
            {!creating && !editing && lease && (
              <p className="text-sm text-muted-foreground">
                Created on {new Date(lease.startDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-4 justify-end">
          <Button
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            onClick={() => {
              if (!creating && !editing) {
                setEditing(true);
              } else {
                form.handleSubmit(handleSubmit)();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            {creating ? "Create" : editing ? "Save Changes" : "Edit"}
          </Button>
          <Button
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            variant={creating || editing ? "outline" : "destructive"}
            onClick={() => {
              if (creating) {
                router.push("/dashboard/leases");
              } else if (editing) {
                setEditing(false);
                form.reset();
              } else {
                setShowDeleteDialog(true);
              }
            }}
            className="transition-colors"
          >
            {creating ? "Cancel" : editing ? "Cancel" : "Terminate"}
          </Button>
          {!creating && !editing && lease && (
            <div className="flex gap-4">
              <Link href={`/dashboard/payments/view?create=true&leaseId=${lease.id}`}>
                <Button className="bg-blue-600 hover:bg-blue-700 transition-colors">
                  <span className="hidden sm:inline">Add </span>Payment
                </Button>
              </Link>
              <Button
                className="bg-blue-600 hover:bg-blue-700 transition-colors"
                onClick={() => setShowUploadDialog(true)}
              >
                <span className="hidden sm:inline">Add </span>Files
              </Button>
            </div>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-6">
            {(creating || editing) ? (
              <Card className="border-none shadow-md rounded-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    {creating ? "Create Lease" : "Edit Lease"}
                  </CardTitle>
                  <CardDescription>
                    {creating ? "Enter lease details" : "Update lease information"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="tenantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Tenant</FormLabel>
                          <Select
                            disabled={!creating && !editing}
                            onValueChange={field.onChange}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "w-full border-gray-200 rounded-md shadow-sm transition-all",
                                  !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                )}
                              >
                                <SelectValue placeholder="Select tenant" />
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
                      name="startDate"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Start Date (Ethiopian Calendar)</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            <FormField
                              control={form.control}
                              name={`startDate.0.year`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    disabled={!creating && !editing}
                                    onValueChange={(value) => {
                                      field.onChange(Number(value));
                                      form.setValue(`startDate.0.day`, undefined);
                                    }}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                          !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              name={`startDate.0.month`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    disabled={!creating && !editing}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                          !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        )}
                                      >
                                        <SelectValue placeholder="Month" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {monthNames.map((month, idx) => (
                                        <SelectItem key={idx} value={(idx + 1).toString()}>
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
                              name={`startDate.0.day`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    disabled={!creating && !editing || !form.watch(`startDate.0.month`)}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "w-[80px] border-gray-200 rounded-md shadow-sm transition-all",
                                          (!creating && !editing || !form.watch(`startDate.0.month`)) ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        )}
                                      >
                                        <SelectValue placeholder="Day" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getDaysInMonth(form.watch(`startDate.0.month`), form.watch(`startDate.0.year`)).map((day) => (
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
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-gray-700">End Date (Ethiopian Calendar)</FormLabel>
                          <div className="grid grid-cols-3 gap-2">
                            <FormField
                              control={form.control}
                              name={`endDate.0.year`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    disabled={!creating && !editing}
                                    onValueChange={(value) => {
                                      field.onChange(Number(value));
                                      form.setValue(`endDate.0.day`, undefined);
                                    }}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                          !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                              name={`endDate.0.month`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    disabled={!creating && !editing}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "w-[110px] border-gray-200 rounded-md shadow-sm transition-all",
                                          !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        )}
                                      >
                                        <SelectValue placeholder="Month" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {monthNames.map((month, idx) => (
                                        <SelectItem key={idx} value={(idx + 1).toString()}>
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
                              name={`endDate.0.day`}
                              render={({ field }) => (
                                <FormItem>
                                  <Select
                                    disabled={!creating && !editing || !form.watch(`endDate.0.month`)}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                    value={field.value?.toString() ?? ""}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className={cn(
                                          "w-[80px] border-gray-200 rounded-md shadow-sm transition-all",
                                          (!creating && !editing || !form.watch(`endDate.0.month`)) ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        )}
                                      >
                                        <SelectValue placeholder="Day" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {getDaysInMonth(form.watch(`endDate.0.month`), form.watch(`endDate.0.year`)).map((day) => (
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
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="paymentAmountPerMonth.base"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Base Payment Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={!creating && !editing}
                                {...field}
                                className={cn(
                                  "border-gray-200 rounded-md shadow-sm transition-all pl-10",
                                  !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                )}
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">ETB</span>
                            </div>
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
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={!creating && !editing}
                                {...field}
                                className={cn(
                                  "border-gray-200 rounded-md shadow-sm transition-all pl-10",
                                  !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                )}
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">ETB</span>
                            </div>
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
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={!creating && !editing}
                                {...field}
                                className={cn(
                                  "border-gray-200 rounded-md shadow-sm transition-all pl-10",
                                  !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                )}
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">ETB</span>
                            </div>
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
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                disabled={!creating && !editing}
                                {...field}
                                className={cn(
                                  "border-gray-200 rounded-md shadow-sm transition-all pl-10",
                                  !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                )}
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">ETB</span>
                            </div>
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
                                  !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <FormField
                      control={form.control}
                      name="rooms"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-gray-700">Rooms</FormLabel>
                          <div className="space-y-4">
                            {fields.map((field, index) => (
                              <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField
                                  control={form.control}
                                  name={`rooms.${index}.buildingId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        disabled={!creating && !editing}
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          form.setValue(`rooms.${index}.roomId`, "");
                                        }}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className={cn(
                                              "border-gray-200 rounded-md shadow-sm transition-all",
                                              !creating && !editing ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            )}
                                          >
                                            <SelectValue placeholder="Select building" />
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
                                      <FormMessage className="text-red-500 text-sm" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name={`rooms.${index}.roomId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        disabled={!creating && !editing || !form.watch(`rooms.${index}.buildingId`)}
                                        onValueChange={field.onChange}
                                        value={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger
                                            className={cn(
                                              "border-gray-200 rounded-md shadow-sm transition-all",
                                              !creating && !editing || !form.watch(`rooms.${index}.buildingId`) ? "bg-gray-100 opacity-70 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            )}
                                          >
                                            <SelectValue placeholder="Select room" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {rooms
                                            .filter((room) => {
                                              if (editing && lease?.roomIds?.includes(room.id)) return true;
                                              return !room.occupied && room.buildingId?.toString() === form.watch(`rooms.${index}.buildingId`);
                                            })
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
                                      disabled={fields.length === 1}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => append({ buildingId: "", roomId: "" })}
                              disabled={!creating && !editing}
                            >
                              <span className="hidden sm:inline">Add </span>Room
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {lease && (
                  <>
                    <Card className="border-none shadow-md rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold">Lease Details</CardTitle>
                        <CardDescription>Lease information and status</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Tenant</h3>
                            <p className="text-gray-900">{lease.tenant?.name}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Start Date</h3>
                            <p className="text-gray-900">
                              {lease.startDate ? toEthiopianDateString(new Date(lease.startDate)) : "N/A"}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">End Date</h3>
                            <p className="text-gray-900">
                              {lease.endDate ? toEthiopianDateString(new Date(lease.endDate)) : "N/A"}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Status</h3>
                            <Badge variant={lease.active ? "default" : "destructive" }>{lease.active ? "Active" : "Inactive"}</Badge>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Base Payment Amount</h3>
                            <p className="text-gray-900">{lease.paymentAmountPerMonth?.base || "0"} ETB</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Utility Payment Amount</h3>
                            <p className="text-gray-900">{lease.paymentAmountPerMonth?.utility || "0"} ETB</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Deposit Amount</h3>
                            <p className="text-gray-900">{lease.deposit || "0"} ETB</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Late Fee (Daily)</h3>
                            <p className="text-gray-900">{lease.lateFee || "1"} {lease.lateFeeType === "PERCENTAGE" ? "%" : "ETB"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-md rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold">Rented Rooms</CardTitle>
                        <CardDescription>Rooms associated with this lease</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <RoomsDataTable columns={roomsColumn} data={rentedRooms} />
                      </CardContent>
                    </Card>
                    <Card className="border-none shadow-md rounded-lg">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold">Documents</CardTitle>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {file.name.split(".").pop()?.toUpperCase()}
                                        </Badge>
                                        <span>{file.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      <div className="flex items-center gap-2">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenFile(file.url)}
                                          disabled={uploading}
                                        >
                                          <Eye className="h-4 w-4" />
                                          <span className="sr-only">View</span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDownloadFile(file.url, file.name)}
                                          disabled={uploading}
                                        >
                                          <Download className="h-4 w-4" />
                                          <span className="sr-only">Download</span>
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleDeleteFile(file)}
                                          disabled={uploading}
                                        >
                                          <Trash2Icon className="h-4 w-4" />
                                          <span className="sr-only">Delete</span>
                                        </Button>
                                      </div>
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
                    {lease.paymentSchedule && lease.paymentSchedule.length > 0 && (
                      <Card className="border-none shadow-md rounded-lg">
                        <CardHeader>
                          <CardTitle className="text-xl font-semibold">Payment Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <DataTable columns={columns} data={lease.paymentSchedule} />
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* File Upload Dialog */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Files</DialogTitle>
                <DialogDescription>Upload lease-related documents</DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="file"
                  multiple
                  accept="application/pdf,image/*,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <Badge variant="outline" className="text-sm">
                            {file.type.split("/")[0].toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadDialog(false);
                    setSelectedFiles([]);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleFileUpload}
                  disabled={selectedFiles.length === 0 || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Files"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Terminate Lease</DialogTitle>
                <DialogDescription>Are you sure you want to terminate this lease? This action cannot be undone.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleTerminate} disabled={isDeleting}>
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Terminating...
                    </>
                  ) : (
                    "Terminate Lease"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </form>
      </Form>
    </div>
  );
}