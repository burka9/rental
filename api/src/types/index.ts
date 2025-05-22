/* eslint-disable prettier/prettier */

import { randomInt } from "crypto"
import { addMonths, addYears } from "date-fns"
import { writeFileSync } from "fs"
import { resolve } from "path"
import { ROLES } from "../entities/User.entity"


export type User = {
	id: number
	phone: string
	role: ROLES
}

/*
	TASK definitions (CRUD):
		AdminUser
		Building
		Room
		Partition
		Tenant
		Lease
		Payment
		Bank
*/

/*
	ROLE definitions:
		SUPERADMIN:
			- *:*
		ADMIN:
			- ADMIN_USER:create, read, update, delete (exclude self and superadmin)
			- BUILDING:*
			- ROOM:*
			- PARTITION:*
			- TENANT:create, read, update
			- LEASE:create, read, update
			- PAYMENT:create, read, update
			- BANK:*
		BLDG_ADMIN: only for assciated buildings
			- BUILDING:*
			- ROOM:*
			- PARTITION:*
			- TENANT:create, read
			- PAYMENT:create, read
		FINANCE_ADMIN:
			- BANK:*
			- PAYMENT:*
*/


export type Building = {
	id: number
	name: string
	address: string
	noOfFloors: number
	rooms: Room[] // used to show relation
}

// each room will have 1 partition by default
export type Room = {
	id: number
	number: string
	floorNumber: number
	buildingId: number
	partitions: Partition[] // used to show relation
}

export type Partition = {
	id: number
	name: string
	roomId: number
	buildingId: number
	occupied: boolean
}

export type Tenant = {
	id: number
	name: string
	phone: string // unique
	lease: Lease[] // used to show relation
}

export type Lease = {
	id: number
	startDate: Date
	endDate: Date
	tenantId: number
	roomIds: number[]
	paymentType: ('PREPAID' | 'POSTPAID')
	paymentAmountPerMonth: {
		base: number
		utility: number
		[key: string]: number
	}
	deposit: number
	paymentIntervalInMonths: number
	initialPayment?: {
		amount: number
		paymentDate: Date
	}
	lateFee: number
	lateFeeType: ('PERCENTAGE' | 'FIXED')
	lateFeeGracePeriodInDays: number
	files: {
		filename: string
		path: string
	}[] // file path
	active: boolean
	paymentSchedule: PaymentSchedule[] // used to show relation
	payments: Payment[] // used to show relation
}

export type PaymentSchedule = {
	id: number
	amount: number
	dueDate: Date
	leaseId: number
	paymentDate?: Date
}

export type Bank = {
	id: number
	name: string
	branch: string
	accountNumber: string
	ownerName: string
	payments: Payment[] // used to show relation
}

export type Payment = {
	id: number
	leaseId: number
	scheduleId: number
	paidAmount: number
	paymentDate: Date
	paymentMethod: ('BANK_TRANSFER')
	bankId: number
	notes: string
	verified: boolean
	verificationDate: Date
}


// necessary function
let scheduleCounter = 0
export function generatePaymentSchedule(lease: Lease): PaymentSchedule[] {
	const { startDate, endDate, paymentIntervalInMonths, paymentAmountPerMonth } = lease;
	const schedule: PaymentSchedule[] = [];

	const leaseEndDate = new Date(endDate);

	// Calculate total amount per interval
	const totalAmountPerMonth = Object.values(paymentAmountPerMonth).reduce((sum, amount) => sum + amount, 0);
	const intervalAmount = totalAmountPerMonth * paymentIntervalInMonths;

	let paymentDate = new Date(startDate); // Payment is made at the start of each period
	const leaseId = lease.id;

	while (paymentDate <= leaseEndDate) {
			// Check if this is the final payment and needs proration
			const nextPaymentDate = new Date(paymentDate);
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + paymentIntervalInMonths);

			if (nextPaymentDate > leaseEndDate) {
					const remainingMonths = (leaseEndDate.getFullYear() - paymentDate.getFullYear()) * 12 
																+ (leaseEndDate.getMonth() - paymentDate.getMonth());

					const finalAmount = totalAmountPerMonth * remainingMonths;
					schedule.push({ dueDate: paymentDate, amount: finalAmount, id: scheduleCounter, leaseId });
					break;
			}

			schedule.push({ dueDate: new Date(paymentDate), amount: intervalAmount, id: scheduleCounter, leaseId });

			// Move to the next payment period
			paymentDate = nextPaymentDate;
			scheduleCounter++;
	}

	return schedule;
}

