'use client';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { BellIcon, SearchIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const pathKeyMap: { [key: string]: string } = {
	"home": "dashboard",
	"user": "user management",
	"building": "building management",
}

export default function AppNavbar() {
	const pathname = usePathname();
	// const router = useRouter();
	// const { toggleSidebar } = useSidebar();

	const hanldeLogout = () => {
		// router.push('/auth/sign-in');
		// TODO: handle logout
	}

	const name = useMemo(() => {
		const pathKey = pathname.split('/')[2];
		if (!pathKey) return 'Dashboard';
		return pathKey in pathKeyMap ? pathKeyMap[pathKey] : "Dashboard"
	}, [pathname]);

	return (
		<div className="flex items-center justify-between p-4 border-b-2 border-gray-200 sticky top-0 bg-white z-[999]">
			<div className="flex items-center gap-4">
				{/* <MenuIcon onClick={toggleSidebar} className="cursor-pointer" /> */}
				<h1 className="text-xl font-semibold capitalize hidden">{name}</h1>
				<h1 className="text-xl font-semibold capitalize">{"Dashboard"}</h1>
			</div>
			<div className="flex items-center space-x-4">
				<div className="relative">
					<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 transform scale-75 text-gray-400" />
					<Input
						placeholder="Search..."
						className="bg-gray-200 pl-10 rounded-full outline-none"
					/>
				</div>
				<button className="text-gray-300 hover:text-gray-700">
					<BellIcon size={24} />
				</button>
				<DropdownMenu>
					<DropdownMenuTrigger className="outline-none">
						<Avatar>
							<AvatarFallback className="bg-primary text-white shadow-lg">JD</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Button onClick={hanldeLogout} className="w-full" variant="outline">Logout</Button>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	)
}