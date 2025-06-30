/* eslint-disable @typescript-eslint/no-explicit-any */

export type DashboardProps = any

export type User = {
  id: number;
  phone: string;
  role: ROLES;
	password?: string
  buildingId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum ROLES {
	SUPERADMIN = "SUPERADMIN",
	ADMIN = "ADMIN",
	BUILDING_ADMIN = "BUILDING_ADMIN",
	TENANT = "TENANT",
	BOARD_MEMBER = "BOARD_MEMBER",
	FINANCE_ADMIN = "FINANCE_ADMIN",
	EMPTY = "EMPTY",
}

export type CurrentUser = {
	buildingId: string | number | null
	id: number | string
	phone: string
	role: string
	token: string
}


export type Building = {
	id: number;
	name: string;
	address: string;
	noOfFloors: number;
	noOfBasements: number;
	floors: { order: number; name: string }[]
	rooms: Room[];
}

export type Room = {
	id: number;
	name: string;
	floorNumber: string;
	buildingId?: number;
	building?: Building;
	occupied: boolean;
	purpose?: string;
	sizeInSquareMeters?: number;
}


export type Tenant = {
	id: number;
	name: string;
	phone?: string;
	address?: string;
	tinNumber?: string;
	isShareholder?: boolean;
	leases?: Lease[];
}

export type Lease = {
	id: number;
	startDate: Date;
	endDate: Date;
	tenantId: number;
	roomIds: number[];
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
	files: {
		filename: string;
		path: string;
	}[];
	active: boolean;
	tenant: Tenant;
	paymentSchedule: PaymentSchedule[];
	payments: Payment[];
}

export type PaymentSchedule = {
	id: number;
	payableAmount: number;
	paidAmount: number;
	dueDate: Date;
	leaseId: number;
	paymentDate?: Date;
}

export type Payment = {
	id: number;
	leaseId: number;
	scheduleId: number;
	paidAmount: number;
	paymentDate: Date;
	paymentMethod: "BANK_TRANSFER";
	bankId: number;
	referenceNumber: string;
	notes: string;
	isVerified: boolean;
	verifiedAt: Date;
	invoiceNumber: string;
	bankSlipPath: string
	invoicePath: string
	lease: Lease;
	bank: Bank;
}

export type Bank = {
	id?: number;
	name: string;
	branch: string;
	accountNumber: string;
	payments?: Payment;
}

export type BasicReport = {
	totalRooms: number
	vacantRooms: number
	totalTenants: number
	overduePayments: {
		totalTenants: number
		totalAmount: number
	}
	upcomingPayment: {
		tenantId: string
		leaseId: string
		tenantName: string
		dueDate: Date
		paymentAmount: number
	}[]
}