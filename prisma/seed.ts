import { PrismaClient, Role } from "@prisma/client";
import { hashPassword } from "../src/lib/security/password";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🌱 Menjalankan Seeding Database (User & Cabang Saja)");
  console.log("==================================================");

  // 1. Bersihkan database sebelumnya agar clean
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

  // 2. Buat Data Cabang
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

  // Default password untuk akun awal
  const defaultPassword = "Closing2026!";
  const passwordHash = await hashPassword(defaultPassword);

  // 3. Buat Akun Pengguna (Staff Cabang & Staff Pusat)
  await prisma.user.create({
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

  await prisma.user.create({
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

  await prisma.user.create({
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

  await prisma.user.create({
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

  console.log("\n==================================================");
  console.log("DAFTAR PENGGUNA TERDAFTAR (DATA CLOSING KOSONG)");
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
