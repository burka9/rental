import { writeFileSync } from 'fs';
import {
  ROLES,
  User,
  Tenant,
  Building,
  Room,
  Partition,
  Lease,
  generatePaymentSchedule,
} from './index';
import { resolve } from 'path';
// test data
const users: User[] = [{ id: 1, phone: '123', role: ROLES.SUPERADMIN }];

const partitions: Partition[] = [
  { id: 1, name: 'Partition 1', roomId: 1, buildingId: 1, occupied: false },
  { id: 2, name: 'Partition 2', roomId: 1, buildingId: 1, occupied: false },
  { id: 3, name: 'Partition 3', roomId: 2, buildingId: 1, occupied: false },
  { id: 4, name: 'Partition 4', roomId: 2, buildingId: 1, occupied: false },
  { id: 5, name: 'Partition 5', roomId: 3, buildingId: 1, occupied: false },
  { id: 6, name: 'Partition 6', roomId: 3, buildingId: 1, occupied: false },
  { id: 7, name: 'Partition 7', roomId: 3, buildingId: 1, occupied: false },
  { id: 8, name: 'Partition 8', roomId: 3, buildingId: 1, occupied: false },
  { id: 9, name: 'Partition 9', roomId: 4, buildingId: 1, occupied: false },
];

const rooms: Room[] = [
  {
    id: 1,
    number: '101',
    floorNumber: 1,
    buildingId: 1,
    partitions: [partitions[0], partitions[1]],
  },
  {
    id: 2,
    number: '102',
    floorNumber: 1,
    buildingId: 1,
    partitions: [partitions[2], partitions[3]],
  },
  {
    id: 3,
    number: '201',
    floorNumber: 2,
    buildingId: 1,
    partitions: [partitions[4], partitions[5], partitions[6], partitions[7]],
  },
  {
    id: 4,
    number: '202',
    floorNumber: 2,
    buildingId: 1,
    partitions: [partitions[8]],
  },
];

const buildings: Building[] = [
  {
    id: 1,
    name: 'Building 1',
    address: 'Address 1',
    noOfFloors: 1,
    rooms: [rooms[0], rooms[1], rooms[2], rooms[3]],
  },
];

const leases: Lease[] = [
  {
    id: 1,
    startDate: new Date('2025-02-19'),
    endDate: new Date('2025-12-19'),
    tenantId: 1,
    partitionIds: [partitions[0].id, partitions[1].id],
    paymentType: 'PREPAID',
    paymentAmountPerMonth: {
      base: 1000,
      rent: 100,
      gas: 200,
      electricity: 300,
    },
    deposit: 1000,
    paymentIntervalInMonths: 3,
    lateFee: 10,
    lateFeeType: 'PERCENTAGE',
    lateFeeGracePeriodInDays: 10,
    files: ['path-to-file-1', 'path-to-file-2'],
    active: true,
    paymentSchedule: [],
    payments: [],
  },
];

const tenant: Tenant = {
  id: 1,
  name: 'Tenant 1',
  phone: '123',
  lease: [leases[0]],
};

leases.forEach((lease) => {
  lease.paymentSchedule = generatePaymentSchedule(lease);
});

const schedule = generatePaymentSchedule(leases[0]);
console.log(schedule);

// write to tmp/
// add indentation
writeFileSync(resolve('api/tmp/tenant.json'), JSON.stringify(tenant, null, 2));
writeFileSync(
  resolve('api/tmp/buildings.json'),
  JSON.stringify(buildings, null, 2),
);
writeFileSync(resolve('api/tmp/rooms.json'), JSON.stringify(rooms, null, 2));
writeFileSync(
  resolve('api/tmp/partitions.json'),
  JSON.stringify(partitions, null, 2),
);
writeFileSync(resolve('api/tmp/leases.json'), JSON.stringify(leases, null, 2));
