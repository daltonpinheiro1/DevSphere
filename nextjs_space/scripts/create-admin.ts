import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Criando usuário administrador...');

  const email = 'admin@devsphere.ai';
  const password = 'admin123';

  // Verificar se já existe
  const existing = await prisma.users.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('✅ Usuário admin já existe!');
    console.log('Email:', existing.email);
    console.log('Role:', existing.role);
    return;
  }

  // Hash da senha
  const passwordHash = await bcrypt.hash(password, 10);

  // Criar admin
  const admin = await prisma.users.create({
    data: {
      id: `cmhxo_admin_${Date.now()}`,
      name: 'Administrador DevSphere',
      email,
      password_hash: passwordHash,
      role: 'ADMIN',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  console.log('✅ Administrador criado com sucesso!');
  console.log('Email:', admin.email);
  console.log('Senha:', password);
  console.log('Role:', admin.role);
  console.log('\n🔐 Use estas credenciais para fazer login:');
  console.log('   Email: admin@devsphere.ai');
  console.log('   Senha: admin123');
}

main()
  .catch((error) => {
    console.error('❌ Erro ao criar admin:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
