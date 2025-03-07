'use client'
import { usePathname } from "next/navigation";
import { JSX, useCallback, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { DashboardProps } from "@/lib/types";
import Home from "../components/home";
import Buildings from "../components/buildings";
import ViewBuilding from "../components/buildings/view";
import Rooms from "../components/rooms";
import ViewRoom from '../components/rooms/view'
import Partitions from "../components/partitions";
import ViewPartition from "../components/partitions/view";
import Tenants from "../components/tenants";
import ViewTenant from "../components/tenants/view";
import Banks from '../components/banks';
import ViewBank from '../components/banks/view';

// Define the map outside the component to avoid re-creating it on each render.
const componentMap: { [key: string]: (props: DashboardProps) => JSX.Element } = {
	'home': Home,
	'buildings': Buildings,
	'buildings/view': ViewBuilding,
	'rooms': Rooms,
	'rooms/view': ViewRoom,
	'partitions': Partitions,
	'partitions/view': ViewPartition,
	'tenants': Tenants,
	'tenants/view': ViewTenant,
	'banks': Banks,
	'banks/view': ViewBank,
};

export default function Dashboard() {
	const pathname = usePathname();
	const router = useRouter()
	const { user, fetchUser } = useStore()

	const destroy = useCallback(() => {
		localStorage.clear()
		router.push('/auth/login')
	}, [router])
	
	useEffect(() => {
		fetchUser()
			.then(data => {
				if (data == null) {
					// destroy()
				}
			})
			.catch(destroy)
	}, [fetchUser, destroy])

	// Use useMemo to calculate the component to render based on pathname
  const view = useMemo(() => {
    const pathKey = pathname.split('/').splice(2).join('/');
    const Component = componentMap[pathKey] || Home;
    return <Component user={user} />;
  }, [pathname, user]);

	return view;
}