import { readFileSync, writeFileSync } from 'fs';
import * as XLSX from 'xlsx';
// import converter from 'ethiopian-date';
import mysql from 'mysql2/promise'
import { Database } from './db';
import { DataSource } from 'typeorm';
import { Building } from './entities/Building.entity';
import { Room } from './entities/Room.entity';
import { Tenant } from './entities/Tenant.entity';
import { Lease } from './entities/Lease.entity';

function loadFile(filename: string) {
	return XLSX.readFile(filename)
}

function loadData(filePath: string, sheetName?: string) {
  const workbook = loadFile(filePath);

	const sheets: Record<string, any[]> = {}

	if (sheetName) {
		const worksheet = workbook.Sheets[sheetName];
		sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
		return sheets
	}
	
	workbook.SheetNames.forEach(sheetName => {
		const worksheet = workbook.Sheets[sheetName];
		sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
	})

	return sheets
}


function import_sheets() {
	console.log('importing started...')

	for (const t of [
		'data/Brook Latest Block 1 and Block 3 data.xlsx',
		'data/Block 2 Data.xlsx',
		'data/Block 2 Shareholders data.xlsx',
	]) {
		const sheets = loadData(t)
		console.log('importing', t, 'finished')
		
		Object.entries(sheets).forEach(([sheetName, data]) => {
			console.log('writing file', sheetName)
			writeFileSync(`data/json/${sheetName}.j`, JSON.stringify(data, null, 2))
			console.log('writing file', sheetName, 'finished')
		})
	}

	console.log('importing finished')
}


// import_sheets()
// Database.initialize()
// 	.then(createBlocks)
// 	.then(add_data)
// 	.then(() => {
// 		Database.destroy()
// 	})
// 	.catch(console.error)


const blocks: any[] = [
	{ name: 'Block 1', address: '', noOfFloors: 10 },
	{ name: 'Block 2', address: '', noOfFloors: 10 },
	{ name: 'Block 3', address: '', noOfFloors: 8 },
]

export async function createBlocks(connection: DataSource) {
	const buildingRepo = connection.getRepository(Building)

	for await (const block of blocks) {
		const result = await buildingRepo.save({
			name: block.name,
			address: block.address,
			noOfFloors: block.noOfFloors
		})

		block.id = result.id
	}

	return connection
}

export async function add_data(connection: DataSource) {
	const tenants1 = JSON.parse(readFileSync('data/json/Block 1 Normal tenants.json', 'utf8'))
	const shareholders1 = JSON.parse(readFileSync('data/json/Block one shareholders.json', 'utf8'))

	const tenants2 = JSON.parse(readFileSync('data/json/Block 2 Data.json', 'utf8'))
	const shareholders2: any[] = []//JSON.parse(readFileSync('data/json/Block 2 Shareholders data.json', 'utf8'))
	
	const tenants3 = JSON.parse(readFileSync('data/json/B3 Normal tenants .json', 'utf8'))
	const holders3 = JSON.parse(readFileSync('data/json/Block 3 Share holders.json', 'utf8'))

	const roomRepo = connection.getRepository(Room)
	const tenantRepo = connection.getRepository(Tenant)
	const leaseRepo = connection.getRepository(Lease)
	
	let roomCount = { pass: 0, fail: 0 }
	let tenantCount = { pass: 0, fail: 0 }
	let leaseCount = { pass: 0, fail: 0 }
	let rowCount = 2
	let fails: any = []
	let skipped = 0
	
	let roomIds: number[] = []
	let tenantId = -1
	let leaseId = -1
	
	const datas = [
		{ data: tenants1, share: false },
		{ data: tenants2, share: false },
		{ data: tenants3, share: false },
		{ data: shareholders1, share: true },
		{ data: shareholders2, share: true },
		{ data: holders3, share: true },
	]
	// const datas = [
	// 	{ data: tenants1, share: false },
	// ]
	
	for (const { data: item, share } of datas) {
		for await (const data of item) {
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
					roomCount.pass++
				}
			} catch (error: any) {
				fails.push({
					row: rowCount,
					type: 'room',
					error: error.message
				})
				roomCount.fail++
			}

			// then create tenant
			try {
				let tinNumber = data['tenant tin number']
				
				if (tinNumber == "የለም") {
					tinNumber = null
				}
				
				const result = await tenantRepo.save({
					name: data['tenant name'],
					phone: data['tenant phone number'],
					address: data['tenant address'],
					isShareholder: share,
					tinNumber,
				})
				tenantId = result.id
				tenantCount.pass++
			} catch (error: any) {
				const tenant = await tenantRepo.findOne({
					where: { id: tenantId }
				})
				
				fails.push({
					row: rowCount,
					type: 'tenant',
					error: error.message
				})
				tenantCount.fail++
			}

			// if (roomId == -1 || tenantId == -1) {
			// 	skipped++
			// 	rowCount++
			// 	continue
			// }
			
			// then create lease
			try {
				const result = await leaseRepo.save({
					tenantId,
					roomIds,
					startDate: new Date(data['start date']),
					endDate: new Date(data['end date']),
					initialPayment: {
						amount: data['initial payment'],
						paymentDate: new Date()
					},
					paymentIntervalInMonths: data['payment interval'],
					paymentAmountPerMonth: {
						base: data['base amount'],
						utility: 0,
					},
					active: true,
					deposit: data['deposit'],
				})

				// update room status
				for await (const roomId of roomIds) {
					await roomRepo.update(roomId, { occupied: true })
				}
				
				leaseId = result.id
				leaseCount.pass++
			} catch (error: any) {
				fails.push({
					row: rowCount,
					type: 'lease',
					error: error.message
				})
				leaseCount.fail++
			}
			
			// break
			rowCount++
		}
	}

	console.log('fails:', fails)
	console.log('skipped:', skipped)
	console.log('room count:', roomCount)
	console.log('tenant count:', tenantCount)
	console.log('lease count:', leaseCount)
}