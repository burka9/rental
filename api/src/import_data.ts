import { readFileSync, writeFileSync } from 'fs';
import * as XLSX from 'xlsx';
import { ImportDatabase } from './db';
import { DataSource } from 'typeorm';
import { Building } from './entities/Building.entity';
import { Room } from './entities/Room.entity';
import { Tenant } from './entities/Tenant.entity';
import { Lease } from './entities/Lease.entity';
import { PaymentSchedule } from './entities/PaymentSchedule.entity';
import { toGregorian } from './lib/date-converter';
import { generatePaymentSchedule } from './types';

const LeaseRepository = ImportDatabase.getRepository(Lease)
const PaymentScheduleRepository = ImportDatabase.getRepository(PaymentSchedule)

function loadFile(filename: string) {
	return XLSX.readFile(filename)
}

function excelSerialToDate(serial: number): string {
  const utcDays = Math.floor(serial - 25569); // Adjust for Excel's 1900 epoch and Unix epoch difference
  const utcValue = utcDays * 86400 * 1000; // Convert days to milliseconds
	const d = new Date(utcValue)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}


function loadData(filePath: string, sheetName?: string) {
  const workbook = loadFile(filePath);
  const sheets: Record<string, any[]> = {};

  if (sheetName) {
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { dateNF: 'dd/mm/yyyy' });
    sheets[sheetName] = rawData.map((row: any) => {
      const trimmedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        trimmedRow[key.trim()] = value; // Trim the column name
      }
      return trimmedRow;
    });
    return sheets;
  }

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { dateNF: 'dd/mm/yyyy' });
    sheets[sheetName] = rawData.map((row: any) => {
      const trimmedRow: Record<string, any> = {};
      for (const [key, value] of Object.entries(row)) {
        trimmedRow[key.trim()] = value; // Trim the column name
      }
      return trimmedRow;
    });
  });

  return sheets;
}

function import_sheets() {
  console.log('importing started...');

  for (const t of [
		'data/Brook Latest Block 1 and Block 3 data.xlsx',
		'data/Block 2 Data.xlsx',
		'data/Block 2 Shareholders data.xlsx',
	]) {
    const sheets = loadData(t);
    console.log('importing', t, 'finished');

    Object.entries(sheets).forEach(([sheetName, datas]: any) => {
			console.log(datas[0])
			
      const parsed = datas.map((data: any) => {
        let start_date = data["start date"];
        let end_date = data["end date"];

        // Convert Excel serial numbers to Dates
        if (typeof start_date === 'number') {
          start_date = excelSerialToDate(start_date);
        }
				
				if (start_date) {
          const [day, month, year] = start_date.split('/');
					const new_date = toGregorian([Number(year), Number(month), Number(day)])
          start_date = new Date(`${new_date[0]}-${new_date[1]}-${new_date[2]}`);
        }

        if (typeof end_date === 'number') {
          end_date = excelSerialToDate(end_date);
        }
				
				if (end_date) {
          const [day, month, year] = end_date.split('/');
					const new_date = toGregorian([Number(year), Number(month), Number(day)])
          end_date = new Date(`${new_date[0]}-${new_date[1]}-${new_date[2]}`);
        }

        return {
          "tenant name": data["tenant name"],
          "tenant address": data["tenant address"],
          "tenant phone number": data["tenant phone number"],
          "office number": data["office number"],
          "block number": data["block number"],
          "office size": data["office size"],
          "floor number": data["floor number"],
          "start date": start_date,
          "end date": end_date,
          "rent per month": data["rent per month"],
          "deposit amount": data["deposit amount"],
          "initial payment": data["initial payment"],
          "payment interval": data["payment interval"],
          "tenant tin number": data["tenant tin number"],
        };
      });

      console.log('writing file', sheetName);
      writeFileSync(`data/json/${sheetName}.json`, JSON.stringify(parsed, null, 2));
      console.log('writing file', sheetName, 'finished');
    });
  }

  console.log('importing finished');
}


// import_sheets()
ImportDatabase.initialize()
	.then(createBlocks)
	.then(add_data)
	.then(() => {
		ImportDatabase.destroy()
	})
	.catch(console.error)


const blocks: any[] = [
	{ name: 'Block 1', address: '', noOfFloors: 10, noOfBasements: 3 },
	{ name: 'Block 2', address: '', noOfFloors: 10, noOfBasements: 3 },
	{ name: 'Block 3', address: '', noOfFloors: 8 , noOfBasements: 3 },
]

export async function createBlocks(connection: DataSource) {
	console.log('creating blocks')
	const buildingRepo = connection.getRepository(Building)

	for await (const block of blocks) {
		const floors = []
	
		for (let i = (block.noOfBasements ?? 0); i > 0; i--) {
			floors.push({ order: floors.length, name: `Basement ${i}` })
		}

		floors.push({ order: floors.length, name: `Ground` })
		
		// floors
		for (let i = 1; i <= (block.noOfFloors ?? 0); i++) {
			floors.push({ order: floors.length, name: `Floor ${i}` })
		}
		
		const result = await buildingRepo.save({
			name: block.name,
			address: block.address,
			noOfFloors: block.noOfFloors,
			noOfBasements: block.noOfBasements,
			floors
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
				const deposit = Number(data['deposit amount'])
				
				const result = await LeaseRepository.save({
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
						base: data['rent per month'],
						utility: 0,
					},
					active: true,
					deposit: isNaN(deposit) ? 0 : deposit,
				})

				if (!result) {
					throw new Error("Lease creation failed")
				}

				leaseId = result.id
				
				// generate payment schedule
				const schedules = generatePaymentSchedule({
					startDate: new Date(data['start date']),
					endDate: new Date(data['end date']),
					paymentIntervalInMonths: data['payment interval'],
					paymentAmountPerMonth: {
						base: data['rent per month'],
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
				
				leaseCount.pass++
			} catch (error: any) {
				console.log(error)
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

	// console.log('fails:', fails)
	console.log('skipped:', skipped)
	console.log('room count:', roomCount)
	console.log('tenant count:', tenantCount)
	console.log('lease count:', leaseCount)

	return connection
}