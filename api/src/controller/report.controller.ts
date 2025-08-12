import { TenantRepository } from './tenant.controller';
import { RoomRepository } from './room.controller';
import { Database } from '../db';
import { Room } from '../entities/Room.entity';
import { BuildingRepository } from './building.controller';
import { jsPDF } from 'jspdf';
import { PaymentScheduleRepository } from './lease.controller';
import { Payment } from '../entities/Payment.entity';
import { Lease } from '../entities/Lease.entity';
import { notoEthiopicBase64 } from "./NotoEthiopicBase64";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toEthiopianDateString } from '../lib/date-converter';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
      [key: string]: any;
    };
  }
}

export type BasicReport = {
    totalRooms: number;
    vacantRooms: number;
    totalTenants: number;
    overduePayments: {
        totalTenants: number;
        totalAmount: number;
        payments: {
            leaseId: string;
            tenantId: string;
            tenantName: string;
            dueDate: Date;
            paymentAmount: number;
        }[];
    };
    upcomingPayment: {
        tenantId: string;
        leaseId: string;
        tenantName: string;
        dueDate: Date;
        paymentAmount: number;
    }[];
}

export async function exportTenantsToExcel(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    // Get all tenants with their leases and rooms
    const tenants = await TenantRepository.find({
        relations: {
            leases: true
        }
    });

    // Prepare data for Excel
    const data = await Promise.all(tenants.map(async (tenant) => {
        const lease = tenant.leases?.[0]; // Assuming each tenant has one lease
        const rooms = await Promise.all(lease?.roomIds?.map(async (id) => {
            const room = await RoomRepository.findOne({ where: { id } });
            return room || null;
        }) || []);
        
        // Get office numbers and sizes
        const officeNumbers = rooms.map(room => room?.name || '');
        const officeSizes = rooms.map(room => room?.sizeInSquareMeters || '');
        
        return {
            'Tenant Name': tenant.name,
            'Address': tenant.address || '',
            'Phone': tenant.phone || '',
            'TIN Number': tenant.tinNumber || '',
            'Office Number 1': officeNumbers[0] || '',
            'Office Number 2': officeNumbers[1] || '',
            'Office Number 3': officeNumbers[2] || '',
            'Office Size 1': officeSizes[0] || '',
            'Office Size 2': officeSizes[1] || '',
            'Office Size 3': officeSizes[2] || '',
            'Rent per Month': lease?.paymentAmountPerMonth?.base || 0,
            'Utility per Month': lease?.paymentAmountPerMonth?.utility || 0,
            'Deposit Amount': lease?.deposit || 0,
            'Start Date': lease?.startDate ? new Date(lease.startDate).toISOString().split('T')[0] : '',
            'End Date': lease?.endDate ? new Date(lease.endDate).toISOString().split('T')[0] : '',
            'Payment Interval': lease?.paymentType || ''
        };
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tenants Report');

    // Generate Excel file
    const buffer = XLSX.write(workbook, {
        type: 'buffer',
        bookType: 'xlsx'
    });

    return buffer;
}

export async function getBasicReports(): Promise<BasicReport> {
    const currentDate = new Date();

    // Total rooms
    const totalRooms = await RoomRepository.count();

    // Vacant rooms
    const vacantRooms = await RoomRepository.count({ where: { occupied: false } });

    // Total tenants with active leases
    const totalTenants = await TenantRepository.count({
        where: { leases: { active: true } },
        relations: ['leases'],
    });

    // Overdue payments: unpaid/partially paid schedules with dueDate < current date
    const overduePayments = await PaymentScheduleRepository.createQueryBuilder("schedule")
        .leftJoinAndSelect("schedule.lease", "lease")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("schedule.dueDate < :currentDate", { currentDate })
        .andWhere("schedule.paidAmount < schedule.payableAmount")
        .getMany();

    // Upcoming payments: unpaid/partially paid schedules with dueDate > current date
    const upcomingPayments = await PaymentScheduleRepository.createQueryBuilder("schedule")
        .leftJoinAndSelect("schedule.lease", "lease")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("schedule.dueDate > :currentDate", { currentDate })
        .andWhere("schedule.paidAmount < schedule.payableAmount")
        .orderBy("schedule.dueDate", "ASC")
        .getMany();

    return {
        totalRooms,
        vacantRooms,
        totalTenants,
        overduePayments: {
            totalTenants: new Set(overduePayments.map(payment => payment.lease?.tenant?.name)).size,
            totalAmount: overduePayments.reduce((total, payment) => {
                const remaining = Number(payment.payableAmount) - (Number(payment.paidAmount) || 0);
                return total + remaining;
            }, 0),
            payments: overduePayments.map(payment => ({
                leaseId: payment.lease?.id?.toString() ?? "0",
                tenantId: payment.lease?.tenant?.id?.toString() ?? "0",
                tenantName: payment.lease?.tenant?.name ?? "Unknown",
                dueDate: payment.dueDate,
                paymentAmount: Number(payment.payableAmount) - (Number(payment.paidAmount) || 0),
            }))
        },
        upcomingPayment: upcomingPayments.map(payment => ({
            leaseId: payment.lease?.id?.toString() ?? "0",
            tenantId: payment.lease?.tenant?.id?.toString() ?? "0",
            tenantName: payment.lease?.tenant?.name ?? "Unknown",
            dueDate: payment.dueDate,
            paymentAmount: Number(payment.payableAmount) - (Number(payment.paidAmount) || 0),
        })),
    };
}


export async function getAllBuildingsReport(): Promise<BuildingReport[]> {
  const buildings = await BuildingRepository.find();

  return Promise.all(buildings.map(building => getBuildingReport(building.id)))
}


interface TenantDetail {
    tenantId: string;
    name: string;
    phone: string;
    rooms: string;
    building: string;
    hasPayment: boolean;
  }
  
  interface BuildingReport {
    totalTenants: number;
    totalRooms: number;
    totalRentedRooms: number;
    totalUnrentedRooms: number;
    totalPayments: {
      verified: {
        count: number;
        totalAmount: number;
      };
      unverified: {
        count: number;
        totalAmount: number;
      };
    };
    tenantsWithPayments: number;
    tenantsWithoutPayments: number;
    tenantDetails: TenantDetail[];
  }
  
  export async function getBuildingReport(buildingId: number): Promise<BuildingReport> {
    const roomRepo = Database.getRepository(Room);
    const leaseRepo = Database.getRepository(Lease);
    const paymentRepo = Database.getRepository(Payment);
    const buildingRepo = Database.getRepository(BuildingRepository.target);
  
    const building = await buildingRepo.findOneBy({ id: buildingId });
  
    const totalRooms = await roomRepo.count({ where: { buildingId } });
    const totalRentedRooms = await roomRepo.count({ where: { buildingId, occupied: true } });
    const totalUnrentedRooms = totalRooms - totalRentedRooms;
  
    const tenantData = await leaseRepo.query(`
      SELECT tenants.id as tenantId, tenants.name, tenants.phone, GROUP_CONCAT(rooms.name) as rooms
      FROM leases
      JOIN tenants ON tenants.id = leases.tenantId
      JOIN rooms ON FIND_IN_SET(rooms.id, leases.roomIds)
      WHERE rooms.buildingId = ?
      GROUP BY tenants.id
    `, [buildingId]);
  
    const tenantsWithPaymentsQuery = await leaseRepo.query(`
      SELECT DISTINCT leases.tenantId
      FROM leases
      JOIN payments ON payments.leaseId = leases.id
      JOIN rooms ON FIND_IN_SET(rooms.id, leases.roomIds)
      WHERE rooms.buildingId = ?
    `, [buildingId]);
  
    const tenantsWithPaymentsSet = new Set(tenantsWithPaymentsQuery.map((t: any) => t.tenantId));
  
    const tenantDetails: TenantDetail[] = tenantData.map((t: any) => ({
      tenantId: t.tenantId,
      name: t.name,
      phone: t.phone,
      rooms: t.rooms,
      building: building?.name ?? "N/A",
      hasPayment: tenantsWithPaymentsSet.has(t.tenantId),
    }));
  
    const totalTenants = tenantDetails.length;
    const tenantsWithPayments = Array.from(tenantsWithPaymentsSet).length;
    const tenantsWithoutPayments = totalTenants - tenantsWithPayments;
  
    const payments = await paymentRepo.query(`
      SELECT 
        payments.isVerified,
        COUNT(*) AS count,
        SUM(paidAmount) AS totalAmount
      FROM payments
      JOIN leases ON leases.id = payments.leaseId
      JOIN rooms ON FIND_IN_SET(rooms.id, leases.roomIds)
      WHERE rooms.buildingId = ?
      GROUP BY payments.isVerified
    `, [buildingId]);
  
    const totalPayments = {
      verified: { count: 0, totalAmount: 0 },
      unverified: { count: 0, totalAmount: 0 }
    };
  
    payments.forEach((p: any) => {
      if (p.isVerified) {
        totalPayments.verified.count = p.count;
        totalPayments.verified.totalAmount = p.totalAmount;
      } else {
        totalPayments.unverified.count = p.count;
        totalPayments.unverified.totalAmount = p.totalAmount;
      }
    });
  
    return {
      totalTenants,
      totalRooms,
      totalRentedRooms,
      totalUnrentedRooms,
      totalPayments,
      tenantsWithPayments,
      tenantsWithoutPayments,
      tenantDetails
    };
  }
  


interface Data {
  data: BuildingReport[];
}

function formatNumber(num: number | string): string {
  // Convert to number first in case it's a string
  const number = typeof num === 'string' ? parseFloat(num) || 0 : num;
  // Format with Ethiopian number grouping (1,000,000.00)
  return number.toLocaleString('en-US', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
}

// Format money amounts in ETB with Amharic text
function formatMoneyETB(amount: number | string): string {
  const number = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return `ብር ${formatNumber(number)}`;
}


const COLORS = {
  primary: '#1a365d',
  text: '#2d3748',
  textLight: '#718096',
  border: '#e2e8f0',
};

interface Data {
  data: BuildingReport[];
}

interface BuildingReport {
  totalTenants: number;
  totalRooms: number;
  totalRentedRooms: number;
  totalUnrentedRooms: number;
  totalPayments: {
    verified: { count: number; totalAmount: number };
    unverified: { count: number; totalAmount: number };
  };
  tenantsWithPayments: number;
  tenantsWithoutPayments: number;
  tenantDetails: TenantDetail[];
}

export function tempPDF(data: Data): string {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.addFileToVFS("NotoSansEthiopic-Regular.ttf", notoEthiopicBase64);
  doc.addFont("NotoSansEthiopic-Regular.ttf", "NotoEthiopic", "normal");
  doc.setFont("NotoEthiopic");

  const PAGE_HEIGHT = doc.internal.pageSize.height || 297;
  const MARGIN_TOP = 50;
  const MARGIN_BOTTOM = 20;

  let yPos = MARGIN_TOP;

  addHeader(doc);
  yPos = addIntro(doc, yPos);


  // total
  yPos = checkPageSpace(doc, yPos, 60, PAGE_HEIGHT, MARGIN_BOTTOM);
    yPos = addSectionHeader(doc, `አጠቃላይ`, yPos);

    // yPos += 10;
    doc.setFontSize(11);
    doc.text(`• አጠቃላይ ክፍሎች: ${data.data.reduce((acc, building) => acc + building.totalRooms, 0)}`, 20, yPos);
    yPos += 7;
    doc.text(`• የተከራዩ ክፍሎች: ${data.data.reduce((acc, building) => acc + building.totalRentedRooms, 0)}`, 20, yPos);
    yPos += 7;
    doc.text(`• ያልተከራዩ ክፍሎች: ${data.data.reduce((acc, building) => acc + building.totalUnrentedRooms, 0)}`, 20, yPos);
    yPos += 7;
    doc.text(`• ጠቅላላ ተከራዮች: ${data.data.reduce((acc, building) => acc + building.totalTenants, 0)}`, 20, yPos);
    yPos += 7;
    doc.text(`• ደረሰኝ ያለው ክፍያ: ${data.data.reduce((acc, building) => acc + Number(building.totalPayments.verified.count), 0)} (ብር ${data.data.reduce((acc, building) => acc + Number(building.totalPayments.verified.totalAmount), 0)})`, 20, yPos);
    yPos += 7;
    doc.text(`• ደረሰኝ የሌለው ክፍያ: ${data.data.reduce((acc, building) => acc + Number(building.totalPayments.unverified.count), 0)} (ብር ${data.data.reduce((acc, building) => acc + Number(building.totalPayments.unverified.totalAmount), 0)})`, 20, yPos);
    yPos += 10;
  

  data.data.forEach((building, index) => {
    yPos = checkPageSpace(doc, yPos, 60, PAGE_HEIGHT, MARGIN_BOTTOM);
    yPos = addSectionHeader(doc, `ህንፃ ${index + 1}`, yPos);

    // yPos += 10;
    doc.setFontSize(11);
    doc.text(`• አጠቃላይ ክፍሎች: ${building.totalRooms}`, 20, yPos);
    yPos += 7;
    doc.text(`• የተከራዩ ክፍሎች: ${building.totalRentedRooms}`, 20, yPos);
    yPos += 7;
    doc.text(`• ያልተከራዩ ክፍሎች: ${building.totalUnrentedRooms}`, 20, yPos);
    yPos += 7;
    doc.text(`• ጠቅላላ ተከራዮች: ${building.totalTenants}`, 20, yPos);
    yPos += 7;
    doc.text(`• ደረሰኝ ያለው ክፍያ: ${building.totalPayments.verified.count} (ብር ${building.totalPayments.verified.totalAmount})`, 20, yPos);
    yPos += 7;
    doc.text(`• ደረሰኝ የሌለው ክፍያ: ${building.totalPayments.unverified.count} (ብር ${building.totalPayments.unverified.totalAmount})`, 20, yPos);
    yPos += 15;

    // Paid Tenants Table
    // const paid = building.tenantDetails.filter(t => t.hasPayment);
    // if (paid.length > 0) {
    //   yPos = checkPageSpace(doc, yPos, 60, PAGE_HEIGHT, MARGIN_BOTTOM);
    //   doc.setFontSize(12);
    //   doc.text("የክፍያ ያላቸው ተከራዮች", 20, yPos);
    //   yPos += 7;

    //   autoTable(doc, {
    //     startY: yPos,
    //     head: [["ስም", "ስልክ", "ክፍል", "ህንፃ"]],
    //     body: paid.map(t => [t.name, t.phone, t.rooms, t.building]),
    //     margin: { left: 20, right: 20 },
    //     styles: { font: "NotoEthiopic", fontSize: 9 },
    //     didDrawPage: () => {
    //       addHeader(doc);
    //       addFooter(doc);
    //     }
    //   });
    //   yPos = (doc as any).lastAutoTable.finalY + 10;
    // }
  });

  data.data.forEach((building, index) => {
    yPos = checkPageSpace(doc, yPos, 60, PAGE_HEIGHT, MARGIN_BOTTOM);
    yPos = addSectionHeader(doc, `ህንፃ ${index + 1}`, yPos);
    
    // Unpaid Tenants Table
    const unpaid = building.tenantDetails.filter(t => !t.hasPayment);
    if (unpaid.length > 0) {
      yPos = checkPageSpace(doc, yPos, 60, PAGE_HEIGHT, MARGIN_BOTTOM);
      doc.setFontSize(12);
      doc.text("ክፍያ የሌላቸው ተከራዮች", 20, yPos);
      yPos += 7;

      autoTable(doc, {
        startY: yPos,
        head: [["ስም", "ስልክ", "ክፍል", "ህንፃ"]],
        body: unpaid.map(t => [t.name, t.phone, t.rooms, t.building]),
        margin: { left: 20, right: 20 },
        styles: { font: "NotoEthiopic", fontSize: 9 },
        didDrawPage: () => {
          addHeader(doc);
          addFooter(doc);
        }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  })

  doc.save("reports/SidamoTeraCommercialCenter.pdf");
  return "reports/SidamoTeraCommercialCenter.pdf";
}


function addIntro(doc: jsPDF, yPos: number) {
  const today = toEthiopianDateString(new Date());
  
  doc.setFontSize(14);
  doc.text("መግቢያ", 20, yPos);
  yPos += 8;
  doc.setFontSize(11);
  doc.text("የዚህ ሪፖርት ዓላማ የኪራይ ዝርዝር መረጃ መስጠት ነው።", 20, yPos);
  yPos += 8;
  doc.text(`ቀን: ${today}`, 20, yPos);
  yPos += 35;
  return yPos;
}

function addSectionHeader(doc: jsPDF, title: string, yPos: number) {
  doc.setFontSize(13);
  doc.setTextColor(COLORS.primary);
  doc.text(title, 20, yPos);
  doc.setTextColor(COLORS.text);
  return yPos + 8;
}

function checkPageSpace(doc: jsPDF, yPos: number, neededSpace: number, pageHeight: number, marginBottom: number) {
  if (yPos + neededSpace > pageHeight - marginBottom) {
    doc.addPage();
    addHeader(doc);
    addFooter(doc);
    return 50; // reset yPos after header
  }
  return yPos;
}

function addHeader(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.width || 210;
  doc.setFillColor(COLORS.primary);
  doc.rect(0, 0, pageWidth, 20, 'F');
  doc.setFontSize(12);
  doc.setTextColor(255);
  doc.text("ሲዳሞ ተራ የንግድ ማዕከል", pageWidth / 2, 12, { align: "center" });
  doc.setTextColor(COLORS.text);
}

function addFooter(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height || 297;
  const pageWidth = doc.internal.pageSize.width || 210;
  const pageCount = doc.getNumberOfPages();

  doc.setDrawColor(COLORS.border);
  doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.textLight);
  doc.text(`ገጽ ${doc.getCurrentPageInfo().pageNumber} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  doc.setTextColor(COLORS.text);
}
