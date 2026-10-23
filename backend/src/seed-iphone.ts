// Seed para tienda de iPhones — demo de segundo tenant
// Ejecutar con: npx tsx src/seed-iphone.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🍎 Iniciando seed tienda iPhone...');

  // ─── Tenant ────────────────────────────────────────────────────────────────

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'iphone-store' },
    update: {},
    create: {
      slug: 'iphone-store',
      name: 'iPhone Store Demo',
      config: {
        personality: {
          tone: 'modern-friendly',
          language: 'es-AR',
          botName: 'Siri Store',
          useEmojis: true,
        },
        scoring: {
          hotThreshold: 71,
          warmThreshold: 31,
          weights: {
            askedPrice: 10,
            selectedProduct: 15,
            askedFinancing: 15,
            providedBudget: 20,
            wantsToBuy: 25,
            providedName: 5,
            providedPhone: 10,
            hasOldPhone: 10,
          },
        },
        followUp: {
          enabled: true,
          minScore: 31,
          delays: [120, 1440, 2880],
          maxAttempts: 3,
          businessHours: {
            start: '09:00',
            end: '20:00',
            timezone: 'America/Argentina/Buenos_Aires',
          },
        },
        handoff: {
          hotThreshold: 71,
          notifyPhone: '',
          notifyEmail: '',
        },
      },
    },
  });

  console.log(`✅ Tenant: ${tenant.name} (${tenant.id})`);

  // ─── Usuario admin ─────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { id: 'admin-iphone-store' },
    update: {},
    create: {
      id: 'admin-iphone-store',
      tenantId: tenant.id,
      email: 'admin@iphonestore.com.ar',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Usuario admin: admin@iphonestore.com.ar`);

  // ─── Productos — Catálogo iPhone completo ──────────────────────────────────

  const products = [
    // ─── iPhone 16 ──────────────────────────────────────────────────────────
    {
      code: 'IP16-128-NEG',
      name: 'iPhone 16 128GB Negro',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla Super Retina XDR de 6,1", cámara principal 48MP con modo Foto y botón Cámara, Control de la cámara, USB-C, compatibilidad con Apple Intelligence.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Color: Negro | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP16-128-BLA',
      name: 'iPhone 16 128GB Blanco',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla Super Retina XDR de 6,1", cámara principal 48MP, Control de la cámara, USB-C, Apple Intelligence.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Color: Blanco | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP16-128-ROS',
      name: 'iPhone 16 128GB Rosa',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla Super Retina XDR de 6,1", cámara principal 48MP, Control de la cámara, USB-C, Apple Intelligence.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Color: Rosa | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP16-128-ULT',
      name: 'iPhone 16 128GB Ultramarino',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla Super Retina XDR de 6,1", cámara principal 48MP, Control de la cámara, USB-C, Apple Intelligence.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Color: Ultramarino | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP16-128-VER',
      name: 'iPhone 16 128GB Verde azulado',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla Super Retina XDR de 6,1", cámara principal 48MP, Control de la cámara, USB-C, Apple Intelligence.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Color: Verde azulado | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP16-256',
      name: 'iPhone 16 256GB',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla 6,1", 256GB de almacenamiento. Ideal para quienes guardan muchas fotos y videos. Disponible en negro, blanco, rosa, ultramarino y verde azulado.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Almacenamiento: 256GB | 5 colores disponibles',
      use: 'particular',
    },
    {
      code: 'IP16-512',
      name: 'iPhone 16 512GB',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Standard',
      description: 'Chip A18, pantalla 6,1", 512GB — la máxima capacidad. Para usuarios profesionales que necesitan mucho espacio.',
      dimensions: 'Pantalla 6,1" · 170,6 g',
      materials: 'Almacenamiento: 512GB | 5 colores disponibles',
      use: 'particular',
    },

    // ─── iPhone 16 Plus ──────────────────────────────────────────────────────
    {
      code: 'IP16P-128',
      name: 'iPhone 16 Plus 128GB',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Plus',
      description: 'Igual al iPhone 16 pero con pantalla más grande de 6,7". Ideal para quienes disfrutan ver contenido o trabajan con el celular. Chip A18, cámara 48MP, batería de larga duración.',
      dimensions: 'Pantalla 6,7" · 203 g',
      materials: 'Almacenamiento: 128GB | Colores: Negro, Blanco, Rosa, Ultramarino, Verde azulado',
      use: 'particular',
    },
    {
      code: 'IP16P-256',
      name: 'iPhone 16 Plus 256GB',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Plus',
      description: 'Pantalla 6,7", 256GB. Perfecto para quienes quieren pantalla grande y bastante espacio de almacenamiento.',
      dimensions: 'Pantalla 6,7" · 203 g',
      materials: 'Almacenamiento: 256GB | 5 colores disponibles',
      use: 'particular',
    },
    {
      code: 'IP16P-512',
      name: 'iPhone 16 Plus 512GB',
      category: 'iPhone 16',
      subcategory: 'iPhone 16 Plus',
      description: 'Pantalla 6,7", 512GB. Máxima capacidad en el modelo Plus.',
      dimensions: 'Pantalla 6,7" · 203 g',
      materials: 'Almacenamiento: 512GB | 5 colores disponibles',
      use: 'particular',
    },

    // ─── iPhone 16 Pro ───────────────────────────────────────────────────────
    {
      code: 'IP16PRO-128',
      name: 'iPhone 16 Pro 128GB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro',
      description: 'Chip A18 Pro, pantalla Super Retina XDR de 6,3" con ProMotion 120Hz, sistema de cámara Pro triple (48MP + 48MP + 12MP), zoom óptico 5x, grabación 4K a 120fps, cuerpo de titanio, Dynamic Island, USB-C 3.',
      dimensions: 'Pantalla 6,3" · 199 g',
      materials: 'Color: Titanio negro, blanco, natural o desierto | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP16PRO-256',
      name: 'iPhone 16 Pro 256GB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro',
      description: 'Chip A18 Pro, cámara triple profesional, pantalla 6,3" 120Hz ProMotion, titanio, 256GB. La opción más popular de la línea Pro.',
      dimensions: 'Pantalla 6,3" · 199 g',
      materials: 'Color: 4 acabados titanio | Almacenamiento: 256GB',
      use: 'particular',
    },
    {
      code: 'IP16PRO-512',
      name: 'iPhone 16 Pro 512GB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro',
      description: 'Chip A18 Pro, cámara triple profesional, 512GB. Para fotógrafos, videógrafos y usuarios exigentes.',
      dimensions: 'Pantalla 6,3" · 199 g',
      materials: 'Color: 4 acabados titanio | Almacenamiento: 512GB',
      use: 'particular',
    },
    {
      code: 'IP16PRO-1TB',
      name: 'iPhone 16 Pro 1TB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro',
      description: 'Chip A18 Pro, 1TB de almacenamiento. El máximo en la línea Pro estándar.',
      dimensions: 'Pantalla 6,3" · 199 g',
      materials: 'Color: 4 acabados titanio | Almacenamiento: 1TB',
      use: 'particular',
    },

    // ─── iPhone 16 Pro Max ───────────────────────────────────────────────────
    {
      code: 'IP16PROMAX-256',
      name: 'iPhone 16 Pro Max 256GB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro Max',
      description: 'El iPhone más grande y potente. Pantalla Super Retina XDR de 6,9", chip A18 Pro, cámara triple con zoom óptico 5x, batería de mayor duración, cuerpo de titanio. Ideal para uso profesional intensivo.',
      dimensions: 'Pantalla 6,9" · 227 g',
      materials: 'Color: Titanio negro, blanco, natural o desierto | Almacenamiento: 256GB',
      use: 'particular',
    },
    {
      code: 'IP16PROMAX-512',
      name: 'iPhone 16 Pro Max 512GB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro Max',
      description: 'Pantalla 6,9", chip A18 Pro, 512GB. Para quienes necesitan el mejor iPhone disponible con bastante espacio.',
      dimensions: 'Pantalla 6,9" · 227 g',
      materials: 'Color: 4 acabados titanio | Almacenamiento: 512GB',
      use: 'particular',
    },
    {
      code: 'IP16PROMAX-1TB',
      name: 'iPhone 16 Pro Max 1TB',
      category: 'iPhone 16 Pro',
      subcategory: 'iPhone 16 Pro Max',
      description: 'El iPhone más grande, potente y con más almacenamiento disponible. Pantalla 6,9", 1TB. El tope de línea absoluto.',
      dimensions: 'Pantalla 6,9" · 227 g',
      materials: 'Color: 4 acabados titanio | Almacenamiento: 1TB',
      use: 'particular',
    },

    // ─── iPhone 15 (entrada) ─────────────────────────────────────────────────
    {
      code: 'IP15-128',
      name: 'iPhone 15 128GB',
      category: 'iPhone 15',
      subcategory: 'iPhone 15 Standard',
      description: 'Chip A16 Bionic, pantalla Super Retina XDR de 6,1", cámara principal 48MP, Dynamic Island, USB-C. Excelente opción de entrada a la línea actual de Apple.',
      dimensions: 'Pantalla 6,1" · 171 g',
      materials: 'Colores: Negro, Azul, Verde, Amarillo, Rosa | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP15-256',
      name: 'iPhone 15 256GB',
      category: 'iPhone 15',
      subcategory: 'iPhone 15 Standard',
      description: 'Chip A16 Bionic, pantalla 6,1", 256GB. La opción más equilibrada de la familia iPhone 15.',
      dimensions: 'Pantalla 6,1" · 171 g',
      materials: 'Almacenamiento: 256GB | 5 colores disponibles',
      use: 'particular',
    },
    {
      code: 'IP15-512',
      name: 'iPhone 15 512GB',
      category: 'iPhone 15',
      subcategory: 'iPhone 15 Standard',
      description: 'Chip A16 Bionic, pantalla 6,1", 512GB. Máxima capacidad del modelo base iPhone 15.',
      dimensions: 'Pantalla 6,1" · 171 g',
      materials: 'Almacenamiento: 512GB | 5 colores disponibles',
      use: 'particular',
    },

    // ─── iPhone 15 Pro ───────────────────────────────────────────────────────
    {
      code: 'IP15PRO-128',
      name: 'iPhone 15 Pro 128GB',
      category: 'iPhone 15 Pro',
      subcategory: 'iPhone 15 Pro',
      description: 'Chip A17 Pro, pantalla 6,1" ProMotion 120Hz, cámara triple con zoom óptico 3x, cuerpo de titanio, Action Button, USB-C 3. Excelente relación calidad-precio en la línea Pro.',
      dimensions: 'Pantalla 6,1" · 187 g',
      materials: 'Color: Titanio negro, blanco, natural o azul | Almacenamiento: 128GB',
      use: 'particular',
    },
    {
      code: 'IP15PRO-256',
      name: 'iPhone 15 Pro 256GB',
      category: 'iPhone 15 Pro',
      subcategory: 'iPhone 15 Pro',
      description: 'Chip A17 Pro, cámara triple 48MP, titanio, 256GB. La opción Pro más popular del iPhone 15.',
      dimensions: 'Pantalla 6,1" · 187 g',
      materials: 'Almacenamiento: 256GB | 4 acabados titanio',
      use: 'particular',
    },

    // ─── iPhone SE ───────────────────────────────────────────────────────────
    {
      code: 'IPSE3-64',
      name: 'iPhone SE (3ra gen) 64GB',
      category: 'iPhone SE',
      subcategory: 'iPhone SE',
      description: 'El iPhone más económico. Chip A15 Bionic, pantalla de 4,7", Touch ID (lector de huella), sin notch ni Dynamic Island. Ideal para quienes buscan un iPhone a buen precio o para regalo.',
      dimensions: 'Pantalla 4,7" · 144 g',
      materials: 'Colores: Negro, Blanco, Rojo | Almacenamiento: 64GB',
      use: 'particular',
    },
    {
      code: 'IPSE3-128',
      name: 'iPhone SE (3ra gen) 128GB',
      category: 'iPhone SE',
      subcategory: 'iPhone SE',
      description: 'Chip A15 Bionic, pantalla 4,7", Touch ID, 128GB. Precio accesible con rendimiento Apple.',
      dimensions: 'Pantalla 4,7" · 144 g',
      materials: 'Colores: Negro, Blanco, Rojo | Almacenamiento: 128GB',
      use: 'particular',
    },
  ];

  let created = 0;
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: `${tenant.id}-${product.code}` },
      update: {},
      create: {
        id: `${tenant.id}-${product.code}`,
        tenantId: tenant.id,
        ...product,
      },
    });
    created++;
  }

  console.log(`✅ Productos cargados: ${created}`);
  console.log('\n🎉 Seed iPhone Store completado.');
  console.log(`\n📋 Datos para usar:`);
  console.log(`   tenantId: ${tenant.id}`);
  console.log(`   Admin email: admin@iphonestore.com.ar`);
  console.log(`   Admin password: admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
