import { readFileSync } from 'fs';
import { Database } from './db';
import { DataSource } from 'typeorm';
import { Building } from './entities/Building.entity';
import { Room } from './entities/Room.entity';
import { Tenant } from './entities/Tenant.entity';
import { Lease } from './entities/Lease.entity';
import { PaymentSchedule } from './entities/PaymentSchedule.entity';
import { generatePaymentSchedule } from './types';
import { Bank } from './entities/Bank.entity';

const LeaseRepository = Database.getRepository(Lease)
const PaymentScheduleRepository = Database.getRepository(PaymentSchedule)


async function add_data(connection: DataSource, opt: string = "") {
	console.log('adding data')
	

	const roomRepo = connection.getRepository(Room)
	const tenantRepo = connection.getRepository(Tenant)
	const leaseRepo = connection.getRepository(Lease)
	
	// let roomCount = { pass: 0, fail: 0 }
	// let tenantCount = { pass: 0, fail: 0 }
	// let leaseCount = { pass: 0, fail: 0 }
	let rowCount = 2
	// let fails: any = []
	let skipped = 0
	
	let roomIds: number[] = []
	let tenantId = -1
	let leaseId = -1
	
	const datas = [
		{ data: `data/json/parsed${opt}.json`, share: true },
	]
	
	console.log(datas)
	
	for (const { data: _the_path, share } of datas) {
		const item = JSON.parse(readFileSync(_the_path, 'utf8'))
		
		// const filteredData = item.slice(40, 50)
		const filteredData = item

		console.log('filteredData', filteredData.length)
		
		let idx = 0
		for await (const data of filteredData) {
			roomIds = []
			console.log(idx)

			// first create room
			try {
				let rooms: any = data['office number']?.toString() ?? ""

				rooms = rooms.split(',').map((room: any) => room.trim())

				for await (const room of rooms) {
					const result = await roomRepo.save({
						name: room,
						floorNumber: data['floor number'],
						buildingId: data['block number'],
						occupied: false,
						sizeInSquareMeters: data['office size']
					})
					roomIds.push(result.id)
					// roomCount.pass++
				}
			} catch (error: any) {
				// fails.push({
				// 	row: rowCount,
				// 	type: 'room',
				// 	error: error.message,
				// 	data
				// })
				// roomCount.fail++
			}

			// then create tenant
			try {
				// if tenant name exists in database, skip
				const tenant = await tenantRepo.findOne({
					where: { name: data['tenant name'] }
				})

				if (tenant) {
					tenantId = tenant.id
				} else {
					let tinNumber = data['tenant tin number']
					
					if (tinNumber == "የለም") {
						tinNumber = null
					}

					// parse phone
					// split by comma, take the first one and remove all whitespaces
					let phone = data['tenant phone number']

					try {
						phone = phone.split(',')[0]?.replaceAll(" ", "").trim()
					} catch {}
					
					const result = await tenantRepo.save({
						name: data['tenant name'],
						phone,
						address: data['tenant address'],
						isShareholder: share,
						tinNumber,
					})
					tenantId = result.id
					// tenantCount.pass++
				}
			} catch (error: any) {
				tenantId = -1
				// fails.push({
				// 	row: rowCount,
				// 	type: 'tenant',
				// 	error: error.message,
				// 	data
				// })
				// tenantCount.fail++
			}

			if (data['tenant name'] == null) {
				console.log(data['remark'])
				console.log(tenantId)
				tenantId = -1
			}
			
			if (tenantId == -1) {
				skipped++
				rowCount++
				continue
			}
			
			// then create lease
			try {
				const deposit = Number(data['deposit amount'])
				
				const result = await LeaseRepository.save({
					tenantId,
					roomIds,
					startDate: new Date(data['start date']),
					endDate: new Date(data['end date']),
					initialPayment: {
						amount: Number(data['initial payment']),
						paymentDate: new Date()
					},
					paymentIntervalInMonths: data['payment interval'],
					paymentAmountPerMonth: {
						base: Number(data['rent per month']),
						utility: 0,
					},
					active: true,
					deposit: isNaN(deposit) ? 0 : deposit,
					files: [],
				})

				if (!result) {
					throw new Error("Lease creation failed")
				}

				leaseId = result.id
				
				// generate payment schedule
				const schedules = generatePaymentSchedule({
					startDate: new Date(data['start date']),
					endDate: new Date(data['end date']),
					paymentIntervalInMonths: Number(data['payment interval']),
					paymentAmountPerMonth: {
						base: Number(data['rent per month']),
						utility: 0,
					},
					id: leaseId
				} as any)
				
				for await (const schedule of schedules) {
					const payableAmount = Number(schedule.amount) ?? 0
					
					await PaymentScheduleRepository.save({
						dueDate: schedule.dueDate,
						leaseId: leaseId,
						payableAmount: isNaN(payableAmount) ? 0 : payableAmount,
						paidAmount: 0,
					})
				}

				// update room status
				for await (const roomId of roomIds) {
					await roomRepo.update(roomId, { occupied: true })
				}
				
				// leaseCount.pass++
			} catch (error: any) {
				// fails.push({
				// 	row: rowCount,
				// 	type: 'lease',
				// 	error: error.message,
				// 	data
				// })
				// leaseCount.fail++
			}
			
			// break
			rowCount++
			idx++
		}
	}

	// console.log('fails:', fails)
	// console.log('skipped:', skipped)
	// console.log('room count:', roomCount)
	// console.log('tenant count:', tenantCount)
	// console.log('lease count:', leaseCount)

	// writeFileSync(`data/failed/fails.json`, JSON.stringify(fails, null, 2))
	
	return connection
}


	Database.initialize()
		.then(conn => add_data(conn, process.argv[2] ?? ""))
		.then(() => {
			Database.destroy()
		})
		.catch(console.error)