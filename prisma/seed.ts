import { PrismaClient, Role, ClosingStatus, StockStatus, FileCategory, ActivityAction } from "@prisma/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { hashPassword } from "../src/lib/security/password";

const prisma = new PrismaClient();

const storageDir = path.join(process.cwd(), "private_storage", "uploads");
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

function createDummyFile(filename: string, content: string): string {
  const filePath = path.join(storageDir, filename);
  fs.writeFileSync(filePath, Buffer.from(content));
  return filename;
}

async function main() {
  console.log("==================================================");
  console.log("🌱 Menjalankan Seeding Database Production-Ready");
  console.log("==================================================");

  // 1. Clean existing database
  await prisma.activityLog.deleteMany();
  await prisma.shareLink.deleteMany();
  await prisma.file.deleteMany();
  await prisma.closingRevision.deleteMany();
  await prisma.closingChecklist.deleteMany();
  await prisma.closing.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Create Branches
  const branchJogja = await prisma.branch.create({
    data: {
      name: "Cabang Yogyakarta",
      code: "JOG",
      active: true,
    },
  });

  const branchJakarta = await prisma.branch.create({
    data: {
      name: "Cabang Jakarta Pusat",
      code: "JKT",
      active: true,
    },
  });

  const branchBandung = await prisma.branch.create({
    data: {
      name: "Cabang Bandung",
      code: "BDG",
      active: true,
    },
  });

  console.log("✅ Data Cabang Berhasil Dibuat:");
  console.log(`   - ${branchJogja.name} (${branchJogja.code})`);
  console.log(`   - ${branchJakarta.name} (${branchJakarta.code})`);
  console.log(`   - ${branchBandung.name} (${branchBandung.code})`);

  // Default initial secure password for all seeded accounts
  const defaultPassword = "Closing2026!";
  const passwordHash = await hashPassword(defaultPassword);

  // 3. Create Users (Branch and Role based names - NO individual person names)
  const staffJogja = await prisma.user.create({
    data: {
      name: "Staff Cabang Yogyakarta",
      email: "staff.jogja@closinglm.id",
      passwordHash,
      role: Role.STAFF_CABANG,
      branchId: branchJogja.id,
      emailVerified: true,
      active: true,
    },
  });

  const staffJakarta = await prisma.user.create({
    data: {
      name: "Staff Cabang Jakarta",
      email: "staff.jakarta@closinglm.id",
      passwordHash,
      role: Role.STAFF_CABANG,
      branchId: branchJakarta.id,
      emailVerified: true,
      active: true,
    },
  });

  const staffBandung = await prisma.user.create({
    data: {
      name: "Staff Cabang Bandung",
      email: "staff.bandung@closinglm.id",
      passwordHash,
      role: Role.STAFF_CABANG,
      branchId: branchBandung.id,
      emailVerified: true,
      active: true,
    },
  });

  const staffPusat = await prisma.user.create({
    data: {
      name: "Staff Kantor Pusat",
      email: "staff.pusat@closinglm.id",
      passwordHash,
      role: Role.STAFF_PUSAT,
      authorizedBranchIds: `${branchJogja.id},${branchJakarta.id},${branchBandung.id}`,
      emailVerified: true,
      active: true,
    },
  });

  // 4. Sample Closing 1: Jogja, 15 September 2026 (SUBMITTED, 90.9% - 10/11 complete)
  const closingJogja15 = await prisma.closing.create({
    data: {
      branchId: branchJogja.id,
      closingDate: new Date("2026-09-15"),
      status: ClosingStatus.SUBMITTED,
      completenessPercentage: 90.9,
      notes: "Closing harian 15 September 2026 Cabang Yogyakarta siap diverifikasi.",
      createdById: staffJogja.id,
      submittedAt: new Date("2026-09-15T18:30:00Z"),
    },
  });

  const fileStorage1 = createDummyFile("seed_jogja_10g.jpg", "DUMMY_IMAGE_DATA_10G");
  await prisma.file.create({
    data: {
      closingId: closingJogja15.id,
      category: FileCategory.STOCK_PHOTO,
      gramasi: "10g",
      originalFilename: "foto-stok-10g.jpg",
      storageFilename: fileStorage1,
      mimeType: "image/jpeg",
      size: 1024 * 350,
      uploadedById: staffJogja.id,
    },
  });

  const fileStorageRecap = createDummyFile("seed_jogja_recap.jpg", "DUMMY_IMAGE_RECAP");
  await prisma.file.create({
    data: {
      closingId: closingJogja15.id,
      category: FileCategory.RECAP_PHOTO,
      gramasi: null,
      originalFilename: "rekap-closing-15sept.jpg",
      storageFilename: fileStorageRecap,
      mimeType: "image/jpeg",
      size: 1024 * 512,
      uploadedById: staffJogja.id,
    },
  });

  const gramasiSeedJogja = [
    { g: "0.5g", status: StockStatus.HAS_STOCK, complete: true, photo: "seed_0.5g.jpg" },
    { g: "1g", status: StockStatus.HAS_STOCK, complete: true, photo: "seed_1g.jpg" },
    { g: "2g", status: StockStatus.NO_STOCK, complete: true, photo: null },
    { g: "3g", status: StockStatus.HAS_STOCK, complete: true, photo: "seed_3g.jpg" },
    { g: "5g", status: StockStatus.NO_STOCK, complete: true, photo: null },
    { g: "10g", status: StockStatus.HAS_STOCK, complete: true, photo: null },
    { g: "25g", status: StockStatus.NO_STOCK, complete: true, photo: null },
    { g: "50g", status: StockStatus.NO_STOCK, complete: true, photo: null },
    { g: "100g", status: StockStatus.NO_STOCK, complete: true, photo: null },
  ];

  for (const item of gramasiSeedJogja) {
    if (item.photo) {
      const storageName = createDummyFile(item.photo, `IMAGE_${item.g}`);
      await prisma.file.create({
        data: {
          closingId: closingJogja15.id,
          category: FileCategory.STOCK_PHOTO,
          gramasi: item.g,
          originalFilename: `foto-stok-${item.g}.jpg`,
          storageFilename: storageName,
          mimeType: "image/jpeg",
          size: 1024 * 200,
          uploadedById: staffJogja.id,
        },
      });
    }

    await prisma.closingChecklist.create({
      data: {
        closingId: closingJogja15.id,
        gramasi: item.g,
        stockStatus: item.status,
        completed: item.complete,
      },
    });
  }

  await prisma.closingChecklist.create({
    data: { closingId: closingJogja15.id, gramasi: "stock_excel", stockStatus: StockStatus.NOT_SET, completed: false },
  });
  await prisma.closingChecklist.create({
    data: { closingId: closingJogja15.id, gramasi: "recap_photo", stockStatus: StockStatus.NOT_SET, completed: true },
  });

  await prisma.activityLog.create({
    data: {
      actorId: staffJogja.id,
      closingId: closingJogja15.id,
      action: ActivityAction.CREATE_CLOSING,
      description: "Membuat draft closing tanggal 15 September 2026",
    },
  });

  await prisma.activityLog.create({
    data: {
      actorId: staffJogja.id,
      closingId: closingJogja15.id,
      action: ActivityAction.SUBMIT_CLOSING,
      description: "Menyerahkan dokumentasi closing ke Kantor Pusat",
    },
  });

  // 5. Sample Closing 2: Jogja, 14 September 2026 (VERIFIED, 100%)
  const closingJogja14 = await prisma.closing.create({
    data: {
      branchId: branchJogja.id,
      closingDate: new Date("2026-09-14"),
      status: ClosingStatus.VERIFIED,
      completenessPercentage: 100,
      notes: "Closing 14 September 2026 telah diverifikasi lengkap oleh Kantor Pusat.",
      createdById: staffJogja.id,
      submittedAt: new Date("2026-09-14T19:00:00Z"),
      verifiedAt: new Date("2026-09-14T20:15:00Z"),
      verifiedById: staffPusat.id,
    },
  });

  const dummyExcel = createDummyFile("seed_stock_14sept.xlsx", "DUMMY_EXCEL_DATA");
  await prisma.file.create({
    data: {
      closingId: closingJogja14.id,
      category: FileCategory.STOCK_EXCEL,
      gramasi: null,
      originalFilename: "laporan-stok-14sept.xlsx",
      storageFilename: dummyExcel,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 1024 * 120,
      uploadedById: staffJogja.id,
    },
  });

  const dummyRecap14 = createDummyFile("seed_recap_14sept.jpg", "DUMMY_RECAP_14");
  await prisma.file.create({
    data: {
      closingId: closingJogja14.id,
      category: FileCategory.RECAP_PHOTO,
      gramasi: null,
      originalFilename: "foto-rekap-14sept.jpg",
      storageFilename: dummyRecap14,
      mimeType: "image/jpeg",
      size: 1024 * 400,
      uploadedById: staffJogja.id,
    },
  });

  for (const g of ["0.5g", "1g", "2g", "3g", "5g", "10g", "25g", "50g", "100g"]) {
    await prisma.closingChecklist.create({
      data: {
        closingId: closingJogja14.id,
        gramasi: g,
        stockStatus: StockStatus.NO_STOCK,
        completed: true,
      },
    });
  }
  await prisma.closingChecklist.create({
    data: { closingId: closingJogja14.id, gramasi: "stock_excel", stockStatus: StockStatus.NOT_SET, completed: true },
  });
  await prisma.closingChecklist.create({
    data: { closingId: closingJogja14.id, gramasi: "recap_photo", stockStatus: StockStatus.NOT_SET, completed: true },
  });

  // 6. Sample Closing 3: Jakarta, 15 September 2026 (VERIFIED, 100%)
  const closingJakarta15 = await prisma.closing.create({
    data: {
      branchId: branchJakarta.id,
      closingDate: new Date("2026-09-15"),
      status: ClosingStatus.VERIFIED,
      completenessPercentage: 100,
      notes: "Dokumentasi lengkap dan terverifikasi oleh Kantor Pusat.",
      createdById: staffJakarta.id,
      submittedAt: new Date("2026-09-15T17:00:00Z"),
      verifiedAt: new Date("2026-09-15T17:45:00Z"),
      verifiedById: staffPusat.id,
    },
  });

  for (const g of ["0.5g", "1g", "2g", "3g", "5g", "10g", "25g", "50g", "100g"]) {
    await prisma.closingChecklist.create({
      data: {
        closingId: closingJakarta15.id,
        gramasi: g,
        stockStatus: StockStatus.NO_STOCK,
        completed: true,
      },
    });
  }
  await prisma.closingChecklist.create({
    data: { closingId: closingJakarta15.id, gramasi: "stock_excel", stockStatus: StockStatus.NOT_SET, completed: true },
  });
  await prisma.closingChecklist.create({
    data: { closingId: closingJakarta15.id, gramasi: "recap_photo", stockStatus: StockStatus.NOT_SET, completed: true },
  });

  // 7. Sample Closing 4: Bandung, 15 September 2026 (REVISION_REQUIRED, 81.8%)
  const closingBandung15 = await prisma.closing.create({
    data: {
      branchId: branchBandung.id,
      closingDate: new Date("2026-09-15"),
      status: ClosingStatus.REVISION_REQUIRED,
      completenessPercentage: 81.8,
      notes: "Menunggu upload ulang foto stok 10g.",
      createdById: staffBandung.id,
      submittedAt: new Date("2026-09-15T16:00:00Z"),
    },
  });

  for (const g of ["0.5g", "1g", "2g", "3g", "5g", "10g", "25g", "50g", "100g"]) {
    await prisma.closingChecklist.create({
      data: {
        closingId: closingBandung15.id,
        gramasi: g,
        stockStatus: g === "10g" ? StockStatus.HAS_STOCK : StockStatus.NO_STOCK,
        completed: g !== "10g",
      },
    });
  }
  await prisma.closingChecklist.create({
    data: { closingId: closingBandung15.id, gramasi: "stock_excel", stockStatus: StockStatus.NOT_SET, completed: true },
  });
  await prisma.closingChecklist.create({
    data: { closingId: closingBandung15.id, gramasi: "recap_photo", stockStatus: StockStatus.NOT_SET, completed: false },
  });

  await prisma.closingRevision.create({
    data: {
      closingId: closingBandung15.id,
      revisionNumber: 1,
      requestedById: staffPusat.id,
      note: "Foto stok 10g belum tersedia dan foto rekap kurang jelas. Mohon upload foto stok 10g dan rekap baru.",
      requestedAt: new Date("2026-09-15T16:45:00Z"),
    },
  });

  // ShareLink for verified closing
  const sampleToken = "sample-secure-share-token-demo-1234567890abcdef";
  const sampleHash = crypto.createHash("sha256").update(sampleToken).digest("hex");
  const expireDate = new Date();
  expireDate.setDate(expireDate.getDate() + 7);

  await prisma.shareLink.create({
    data: {
      closingId: closingJakarta15.id,
      tokenHash: sampleHash,
      expiresAt: expireDate,
      createdById: staffPusat.id,
    },
  });

  console.log("\n==================================================");
  console.log("DAFTAR PENGGUNA TERDAFTAR (PRODUCTION INITIAL USERS)");
  console.log("==================================================");
  console.log(`Password default untuk semua akun: ${defaultPassword}\n`);
  console.log("1. Staff Cabang Yogyakarta");
  console.log("   - Email: staff.jogja@closinglm.id");
  console.log("   - Role:  STAFF_CABANG (Akses Cabang: Yogyakarta)");
  console.log("\n2. Staff Cabang Jakarta");
  console.log("   - Email: staff.jakarta@closinglm.id");
  console.log("   - Role:  STAFF_CABANG (Akses Cabang: Jakarta Pusat)");
  console.log("\n3. Staff Cabang Bandung");
  console.log("   - Email: staff.bandung@closinglm.id");
  console.log("   - Role:  STAFF_CABANG (Akses Cabang: Bandung)");
  console.log("\n4. Staff Kantor Pusat (HQ)");
  console.log("   - Email: staff.pusat@closinglm.id");
  console.log("   - Role:  STAFF_PUSAT (Otorisasi: Seluruh Cabang)");
  console.log("==================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
