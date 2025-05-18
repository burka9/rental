"use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import Link from "next/link";
// import { User } from "@/lib/types";
// import { useStore } from "@/lib/store";

export default function Users() {
  // const router = useRouter();
  // const { fetchUsers, users } = useStore();
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
    // fetchUsers().finally(() => setLoading(false));
  // }, [fetchUsers]);

  // if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button className="mr-2 p-1 px-2" size="sm">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Users</h1>
        </div>
      </div>
      <div className="grid gap-4">
        {/* {users.map((user: User) => (
          <Link key={user.id} href={`/dashboard/users/view?id=${user.id}`}>
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer">
              <p className="text-sm text-gray-700">ID: {user.id}</p>
              <p className="text-sm text-gray-700">Phone: {user.phone}</p>
              <p className="text-sm text-gray-700">Role: {user.role}</p>
              <p className="text-sm text-gray-700">
                Building ID: {user.buildingId || "None"}
              </p>
            </div>
          </Link>
        ))} */}
      </div>
    </div>
  );
}