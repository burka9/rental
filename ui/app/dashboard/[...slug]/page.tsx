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
import Tenants from "../components/tenants";
import ViewTenant from "../components/tenants/view";
import Banks from '../components/banks';
import ViewBank from '../components/banks/view';
// import Lease from "../components/leases";
import ViewLease from "../components/leases/view";
import AddPayment from "../components/leases/payment/add";
import Notification from "../components/notification";
import Report from "../components/report";
import Payments from "../components/payments";
import ViewPayments from "../components/payments/view";
import VerifyPayment from "../components/payments/verify";
import Leases from "../components/leases";

// Define the map outside the component to avoid re-creating it on each render.
const componentMap: { [key: string]: (props: DashboardProps) => JSX.Element } = {
	'home': Home,
	'buildings': Buildings,
	'buildings/view': ViewBuilding,
	'rooms': Rooms,
	'rooms/view': ViewRoom,
	'tenants': Tenants,
	'tenants/view': ViewTenant,
	'banks': Banks,
	'banks/view': ViewBank,
	'payments': Payments,
	'payments/view': ViewPayments,
	'payments/verify': VerifyPayment,
	'leases': Leases,
	'leases/view': ViewLease,
	'leases/payment/add': AddPayment,
	'notification': Notification,
	'report': Report,
};

export default function Dashboard() {
	const pathname = usePathname();
	const router = useRouter()
	const { user, fetchUser, logout } = useStore()

	const destroy = useCallback(() => {
		logout()
		router.push('/auth/login')
	}, [router, logout])
	
	useEffect(() => {
		fetchUser()
			.then(data => {
				if (!data) {
					destroy()
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