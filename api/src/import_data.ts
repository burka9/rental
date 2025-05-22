import { readFileSync, writeFileSync } from 'fs';
import * as XLSX from 'xlsx';
import { ImportDatabase } from './db';
import { DataSource, In, LessThan } from 'typeorm';
import { Building } from './entities/Building.entity';
import { Room } from './entities/Room.entity';
import { Tenant } from './entities/Tenant.entity';
import { Lease } from './entities/Lease.entity';
import { PaymentSchedule } from './entities/PaymentSchedule.entity';
import { toGregorian } from './lib/date-converter';
import { generatePaymentSchedule } from './types';
import { Bank } from './entities/Bank.entity';
import { Payment } from './entities/Payment.entity';
import { User } from './entities/User.entity';
import { hashSync } from 'bcrypt';
import { ROLES } from './entities/User.entity';

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

function import_tenant_sheets() {
  console.log('importing started...');

  for (const t of [
		'data/Brook Latest Block 1 and Block 3 data.xlsx',
		// 'data/Block 2 Data.xlsx',
		// 'data/Block 2 Shareholders data.xlsx',

		'data/latest.xlsx',
	]) {
    console.log('importing', t);
    const sheets = loadData(t);
    console.log('importing', t, 'finished');

    Object.entries(sheets).forEach(([sheetName, datas]: any) => {
			console.log('sheet name:', sheetName)
      const parsed = datas.map((data: any, idx: number) => {
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
					"id": idx ? (String(idx).toLowerCase() == "na" ? null : String(idx)) : null,
          "tenant name": data["tenant name"] ? (String(data["tenant name"]).toLowerCase() == "na" ? null : String(data["tenant name"])) : null,
          "tenant address": data["tenant address"] ? (String(data["tenant address"]).toLowerCase() == "na" ? null : String(data["tenant address"])) : null,
          "tenant phone number": data["tenant phone number"] ? (String(data["tenant phone number"]).toLowerCase() == "na" ? null : String(data["tenant phone number"])) : null,
          "office number": data["office number"] ? (String(data["office number"]).toLowerCase() == "na" ? null : String(data["office number"])) : null,
          "block number": data["block number"] ? (String(data["block number"]).toLowerCase() == "na" ? null : String(data["block number"])) : null,
          "office size": data["office size"] ? (String(data["office size"]).toLowerCase() == "na" ? null : String(data["office size"])) : null,
          "floor number": data["floor number"] ? (String(data["floor number"]).toLowerCase() == "na" ? null : String(data["floor number"])) : null,
          "start date": start_date ? (String(start_date).toLowerCase() == "na" ? null : String(start_date)) : null,
          "end date": end_date ? (String(end_date).toLowerCase() == "na" ? null : String(end_date)) : null,
          "rent per month": data["rent per month"] ? (String(data["rent per month"]).toLowerCase() == "na" ? null : String(data["rent per month"])) : null,
          "deposit amount": data["deposit amount"] ? (String(data["deposit amount"]).toLowerCase() == "na" ? null : String(data["deposit amount"])) : null,
          "initial payment": data["initial payment"] ? (String(data["initial payment"]).toLowerCase() == "na" ? null : String(data["initial payment"])) : null,
          "payment interval": data["payment interval"] ? (String(data["payment interval"]).toLowerCase() == "na" ? null : String(data["payment interval"])) : null,
          "tenant tin number": data["tenant tin number"] ? (String(data["tenant tin number"]).toLowerCase() == "na" ? null : String(data["tenant tin number"])) : null,
					"remark": data["remark"] ? (String(data["remark"]).toLowerCase() == "na" ? null : String(data["remark"])) : null,
        };
      });
			
      console.log('writing file', sheetName);
      writeFileSync(`data/json/${sheetName}.json`, JSON.stringify(parsed, null, 2));
      console.log('writing file', sheetName, 'finished');
    });
  }

  console.log('importing finished');
}

function import_payment_sheets() {
	console.log('payment importing started...');

	for (const t of [
		'data/payment_latest.xlsx'
	]) {
		const sheets = loadData(t);
		console.log('importing', t, 'finished');

		Object.entries(sheets).forEach(([sheetName, datas]: any) => {
			const parsed = datas.map((data: any, idx: number) => {
				let payment_date = data['payment date']

				// convert excel serial numbers to dates
				if (typeof payment_date === 'number') {
					payment_date = excelSerialToDate(payment_date)
				}

				if (payment_date) {
					const [day, month, year] = payment_date.split('/')
					const new_date = toGregorian([Number(year), Number(month), Number(day)])
					payment_date = new Date(`${new_date[0]}-${new_date[1]}-${new_date[2]}`);
				}

				return {
					"id": idx,
					"tenant_name": data["tenant name"] ? (String(data["tenant name"]).toLowerCase().trim() == "" ? null : String(data["tenant name"]).trim()) : null,
					"block_number": data["block number"] ? (String(data["block number"]).toLowerCase().trim() == "" ? null : String(data["block number"]).trim()) : null,
					"shop_number" : data["shop number"] ? (String(data["shop number"]).toLowerCase().trim() == "" ? null : String(data["shop number"]).trim()) : null,
					"payment_date": payment_date,
					"paid_amount": data["paid amount"] ? (String(data["paid amount"]).toLowerCase().trim() == "" ? null : String(data["paid amount"]).trim()) : null,
					"bank_name": data["bank name"] ? (String(data["bank name"]).toLowerCase().trim() == "" ? null : String(data["bank name"]).trim()) : null,
					"bank_account": data["bank account"] ? (String(data["bank account"]).toLowerCase().trim() == "" ? null : String(data["bank account"]).trim()) : null,
					"reference_number": data["reference number"] ? (String(data["reference number"]).toLowerCase().trim() == "" ? null : String(data["reference number"]).trim()) : null,
					"invoice_number": data["invoice number"] ? (String(data["invoice number"]).toLowerCase().trim() == "" ? null : String(data["invoice number"]).trim()) : null,
				}
			});

			console.log('writing file', sheetName);
			writeFileSync(`data/json/${sheetName}-payment.json`, JSON.stringify(parsed, null, 2));
			console.log('writing file', sheetName, 'finished');
		});
	}

	console.log('payment import finished')
}


export async function createBanks(connection: DataSource) {
	console.log('creating banks')
	const bankRepo = connection.getRepository(Bank)

	const banks = JSON.parse(readFileSync('data/json/Banks.json', 'utf8'))
	
	for await (const bank of banks) {
		await bankRepo.save({
			name: bank.name,
			branch: bank.branch,
			accountNumber: bank.accountNumber,
		})
	}

	console.log('banks created')

	return connection
}
export async function createBlocks(connection: DataSource) {
	const blocks: any[] = [
		{ name: 'Block 1', address: '', noOfFloors: 10, noOfBasements: 3 },
		{ name: 'Block 2', address: '', noOfFloors: 10, noOfBasements: 3 },
		{ name: 'Block 3', address: '', noOfFloors: 8 , noOfBasements: 3 },
	]

	console.log('creating blocks')
	const buildingRepo = connection.getRepository(Building)

	for await (const block of blocks) {
		const floors = []
	
		for (let i = (block.noOfBasements ?? 0); i > 0; i--) {
			floors.push({ order: floors.length, name: `BS${i}` })
		}

		floors.push({ order: floors.length, name: `GF` })
		
		// floors
		for (let i = 1; i <= (block.noOfFloors ?? 0); i++) {
			floors.push({ order: floors.length, name: `F${i}` })
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

	console.log('blocks created')

	return connection
}

export async function add_payment_data(connection: DataSource) {
	console.log('adding payment data')

	const data = JSON.parse(readFileSync('data/json/Sheet1-payment.json', 'utf8'))

	const paymentRepo = connection.getRepository(Payment)
	const scheduleRepo = connection.getRepository(PaymentSchedule)
	const bankRepo = connection.getRepository(Bank)
	const leaseRepo = connection.getRepository(Lease)
	const roomRepo = connection.getRepository(Room)

	let paymentCount = { pass: 0, fail: 0 }
	let fails: any[] = []
	let skipped = 0
	
	let bankId = -1
	let leaseId = -1
	
	for await (const payment of data) {
		// search bank
		const bank = await bankRepo.findOne({
			where: {
				accountNumber: payment.bank_account
			}
		})

		// search for rooms
		const rooms = await roomRepo.find({
			where: {
				buildingId: payment.block_number == 'B2' ? 2 : Number(payment.block_number),
				name: payment.shop_number
			}
		})

		// search for lease
		const lease = await leaseRepo.findOne({
			where: {
				roomIds: In(rooms.map(room => room.id)),
			}
		})

		if (!lease || !bank || !rooms.length) {
			skipped++
			continue
		}

		// get payment schedules until May 1, 2025
		const schdules = await scheduleRepo.find({
			where: {
				leaseId: lease.id,
				// dueDate: LessThan(new Date('2025-05-01'))
			}
		})

		console.log('====================================')
		console.log(payment)
		console.log(bank)
		console.log(lease)
		console.log(rooms)
		console.log(schdules)

		let i = 0
		for await (const schedule of schdules) {
			if (i == schdules.length) {
				// console.log(schedule)
			}

			i++
		}
		break
	}
}

export async function add_data(connection: DataSource) {
	console.log('adding data')
	
	// const tenants1 = JSON.parse(readFileSync('data/json/Block 1 Normal tenants.json', 'utf8'))
	// const shareholders1 = JSON.parse(readFileSync('data/json/Block one shareholders.json', 'utf8'))

	// const tenants2 = JSON.parse(readFileSync('data/json/Block 2 Normal Tenants.json', 'utf8'))
	// const shareholders2: any[] = JSON.parse(readFileSync('data/json/Block 2 Shareholders data.json', 'utf8'))
	
	// const tenants3 = JSON.parse(readFileSync('data/json/Block 3 Normal Tenants.json', 'utf8'))
	// const holders3 = JSON.parse(readFileSync('data/json/Block 3 Share holders.json', 'utf8'))

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
		{ data: 'data/json/Block 1 Normal tenants.json', share: false },
		// { data: 'data/json/Block one shareholders.json', share: false },
		{ data: 'data/json/Block 2 Normal Tenants.json', share: false },
		{ data: 'data/json/Block 3 Normal Tenants.json', share: true },
		// { data: shareholders2, share: true },
		// { data: 'data/json/Block 3 Share holders.json', share: true },
	]
	// const datas = [
	// 	{ data: tenants1, share: false },
	// ]
	
	for (const { data: _the_path, share } of datas) {
		const item = JSON.parse(readFileSync(_the_path, 'utf8'))
		
		// const filteredData = item.slice(40, 50)
		const filteredData = item
		
		for await (const data of filteredData) {
			roomIds = []

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
					error: error.message,
					data
				})
				roomCount.fail++
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
					tenantCount.pass++
				}
			} catch (error: any) {
				tenantId = -1
				fails.push({
					row: rowCount,
					type: 'tenant',
					error: error.message,
					data
				})
				tenantCount.fail++
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
				
				leaseCount.pass++
			} catch (error: any) {
				fails.push({
					row: rowCount,
					type: 'lease',
					error: error.message,
					data
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

	writeFileSync(`data/failed/fails.json`, JSON.stringify(fails, null, 2))
	
	return connection
}


const import_tenant_data = process.argv[2] === '--import-tenant'
console.log('importing data from excel:', import_tenant_data)

const import_payment_data = process.argv[2] === '--import-payment'
console.log('importing payment data from excel:', import_payment_data)

const drop_data = process.argv[2] === '--drop-data'
console.log('dropping data:', drop_data)

if (drop_data)
	ImportDatabase.initialize()
		.then(createBanks)
		.then(createBlocks)
		.then(() => {
			// create admin user
			const userRepository = ImportDatabase.getRepository(User)
					return userRepository.create([
						{
							phone: 'admin',
							password: hashSync('admin', 10),
							role: ROLES.SUPERADMIN
						},
						{
							phone: 'b1',
							password: hashSync('admin', 10),
							role: ROLES.BUILDING_ADMIN,
							buildingId: 1,
						},
						{
							phone: 'b2',
							password: hashSync('admin', 10),
							role: ROLES.BUILDING_ADMIN,
							buildingId: 2,
						},
						{
							phone: 'b3',
							password: hashSync('admin', 10),
							role: ROLES.BUILDING_ADMIN,
							buildingId: 3,
						},
						{
							phone: 'finance',
							password: hashSync('admin', 10),
							role: ROLES.FINANCE_ADMIN
						},
						{
							phone: 'board',
							password: hashSync('admin', 10),
							role: ROLES.BOARD_MEMBER
						},
					])
		})
		.then(async users => {
				const userRepository = ImportDatabase.getRepository(User)
				
				for await (const user of users) try {
					await userRepository.save(user)
				} catch {}
			})
		.then(() => {
			ImportDatabase.destroy()
		})
		.catch(console.error)
else if (import_tenant_data)
	import_tenant_sheets()
else if (import_payment_data)
	import_payment_sheets()
else
	ImportDatabase.initialize()
		.then(createBanks)
		.then(createBlocks)
		.then(add_data)
		// .then(add_payment_data)
		.then(() => {
			ImportDatabase.destroy()
		})
		.catch(console.error)