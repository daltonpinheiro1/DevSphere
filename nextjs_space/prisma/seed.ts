import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.users.upsert({
    where: { email: "admin@centerai.com" },
    update: {},
    create: {
      id: uuidv4(),
      name: "Admin",
      email: "admin@centerai.com",
      password_hash: passwordHash,
      role: "ADMIN",
      updated_at: new Date()
    },
  });

  await prisma.settings.upsert({
    where: { user_id: admin.id },
    update: {},
    create: { 
      id: uuidv4(),
      user_id: admin.id,
      updated_at: new Date()
    },
  });

  console.log("Seed completed:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
