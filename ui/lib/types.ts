/* eslint-disable @typescript-eslint/no-explicit-any */

export type DashboardProps = any


export type CurrentUser = any


export type Building = {
	id: number;
	name: string;
	address: string;
	noOfFloors: number;
	rooms: Room[];
}

export type Room = {
	id: number;
	number: string;
	floorNumber: number;
	buildingId?: number;
	building?: Building;
	partitions: Partition[]
}

export type Partition = {
	id: number;
	name: string;
	roomId: number;
	buildingId: number;
	occupied: boolean;
	sizeInSquareMeters: number;
	room: Room;
}


export type Tenant = {
	id: number;
	name: string;
	phone: string;
	address: string;
	tinNumber: string;
	leases?: Lease[];
}

export type Lease = {
	id: number;
	startDate: Date;
	endDate: Date;
	tenantId: number;
	partitionIds: number[];
	paymentType: "PREPAID" | "POSTPAID";
	paymentAmountPerMonth: {
			base: number;
			utility: number;
			[key: string]: number;
	};
	deposit: number;
	paymentIntervalInMonths: number;
	initialPayment?: {
			amount: number;
			paymentDate: Date;
	};
	lateFee: number;
	lateFeeType: "PERCENTAGE" | "FIXED";
	lateFeeGracePeriodInDays: number;
	files: string[];
	active: boolean;
	tenant: Tenant;
	paymentSchedule: PaymentSchedule[];
	payments: Payment[];
}

export type PaymentSchedule = any
export type Payment = any

export type Bank = {
	id?: number;
	name: string;
	branch: string;
	accountNumber: string;
	ownerName: string;
	payments?: Payment;
}