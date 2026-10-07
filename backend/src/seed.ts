// Seed inicial — carga el tenant de Juegos del Siglo XXI y su catálogo completo
// Ejecutar con: npx tsx src/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ─── Tenant ────────────────────────────────────────────────────────────────

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'juegosdelsigloxxi' },
    update: {},
    create: {
      slug: 'juegosdelsigloxxi',
      name: 'Juegos del Siglo XXI',
      config: {
        personality: {
          tone: 'warm-professional',
          language: 'es-AR',
          botName: 'Asistente',
          useEmojis: true,
        },
        scoring: {
          hotThreshold: 71,
          warmThreshold: 31,
          weights: {
            askedPrice: 10,
            selectedProduct: 10,
            commercialUse: 15,
            askedShipping: 10,
            providedDate: 15,
            requestedQuote: 20,
            wantsToBuy: 25,
            providedName: 5,
            providedPhone: 10,
            providedCity: 5,
          },
        },
        followUp: {
          enabled: true,
          minScore: 31,
          delays: [240, 1440, 2880],
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

  const admin = await prisma.user.upsert({
    where: { id: 'admin-juegosdelsigloxxi' },
    update: {},
    create: {
      id: 'admin-juegosdelsigloxxi',
      tenantId: tenant.id,
      email: 'admin@juegosdelsigloxxi.com.ar',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Usuario admin: ${admin.email}`);

  // ─── Productos ─────────────────────────────────────────────────────────────

  const products = [
    // SALAS DE FIESTAS
    {
      code: 'PC1002',
      name: 'Laberinto Chico - Modelo 3.00 x 2.50 en dos niveles',
      category: 'Salas de Fiestas Infantiles',
      subcategory: 'Peloteros Laberintos',
      description: 'Con pelotero, escalonada, tubería de plástico de rotomoldeo, obstáculos y tobogán',
      dimensions: '2.50 x 3.00 mts – Alto 4.50 mts',
      materials: 'Plástico de rotomoldeo',
      use: 'commercial',
    },
    {
      code: 'PC1109',
      name: 'Laberinto Mediano - Modelo Arboleda',
      category: 'Salas de Fiestas Infantiles',
      subcategory: 'Peloteros Laberintos',
      description: 'Con pelotero, obstáculos, escalonada, tuberías de rotomoldeo, tobogán y rodillos',
      dimensions: '8.00 x 3.00 mts – Alto 2.50 mts',
      materials: 'Plástico de rotomoldeo',
      use: 'commercial',
    },
    {
      code: 'SMP1406',
      name: 'Laberinto Grande',
      category: 'Salas de Fiestas Infantiles',
      subcategory: 'Peloteros Laberintos',
      description: 'Con escalonadas, travesías, obstáculos, cabinas y tuberías de rotomoldeo, dos toboganes caracoles entrecruzados',
      dimensions: '15.00 x 4.00 mts – Alto 6.00 mts',
      materials: 'Plástico de rotomoldeo',
      use: 'commercial',
    },
    {
      code: 'ES6008',
      name: 'Tabla de surf mecánica y ola',
      category: 'Salas de Fiestas Infantiles',
      subcategory: 'Simuladores',
      description: 'Patas estabilizadoras, turbina 3/4 HP, colchón ola 4x5 mts, base, tabla con motor, tablero',
      dimensions: '4.00 x 5.00 mts – Alto 4.00 mts',
      use: 'commercial',
    },

    // GASTRONOMÍA
    {
      code: 'DES1319',
      name: 'Pelotero Fast Food - Modelo Mostaza Posadas',
      category: 'Juegos para Gastronomía',
      subcategory: 'Peloteros Laberintos Medianos',
      description: 'Modelo con torres decoradas, tobogán, tuberías, sector de discos en planta baja y paso de policarbonato',
      dimensions: '5.00 x 3.50 mts – Alto 2.50 mts',
      materials: 'Plástico de rotomoldeo, policarbonato',
      use: 'commercial',
    },

    // PARQUES INFANTILES
    {
      code: 'RY2039',
      name: 'Pelotero Rotoys',
      category: 'Parques Infantiles Recreativos',
      subcategory: 'Juegos de Rotoys Plaza Blanda',
      description: 'Pelotero ampliable con pares de placas según necesidad',
      dimensions: '1.01 x 1.01 mts – Alto 0.45 mts',
      materials: 'Plástico de rotomoldeo',
      use: 'all',
    },
    {
      code: 'RY2008',
      name: 'Tobogán 5 escalones',
      category: 'Parques Infantiles Recreativos',
      subcategory: 'Juegos de Rotoys Plaza Blanda',
      dimensions: '1.90 x 0.86 mts – Alto 1.17 mts',
      materials: 'Plástico de rotomoldeo',
      use: 'all',
    },
    {
      code: 'PB3003',
      name: 'Plaza Blanda Tradicional',
      category: 'Parques Infantiles Recreativos',
      subcategory: 'Plaza Blanda',
      description: 'Corralito contenedor de diversos juegos para niños menores de 3 años, piso de goma en todo el sector',
      use: 'all',
    },

    // PARQUES PARA SALTAR
    {
      code: 'CS001',
      name: 'Pileta de pelotitas',
      category: 'Parques para Saltar',
      description: 'Pileta de pelotitas con obstáculos',
      use: 'commercial',
    },
    {
      code: 'CS003',
      name: 'Parque de camas elásticas',
      category: 'Parques para Saltar',
      description: 'Parque de camas elásticas con variante de juegos',
      use: 'commercial',
    },
    {
      code: 'CS006',
      name: 'Circuito de obstáculos',
      category: 'Parques para Saltar',
      description: 'Circuito de obstáculos con ondas',
      use: 'commercial',
    },

    // JUEGOS EXTERIORES - TEMATIZADOS
    {
      code: 'TZ5000',
      name: 'Tematizado Arcor - Fábrica de chocolate',
      category: 'Juegos Exteriores',
      subcategory: 'Tematizados',
      description: 'Fábrica de chocolate con escalera, pasos, túneles y toboganes, juegos didácticos',
      dimensions: '7.00 x 6.00 mts – Alto 4.30 mts',
      use: 'commercial',
    },
    {
      code: 'TZ20026',
      name: 'Barco Galeón',
      category: 'Juegos Exteriores',
      subcategory: 'Tematizados',
      use: 'commercial',
    },
    {
      code: 'TZ20055',
      name: 'Estación de policía - Mini ciudad',
      category: 'Juegos Exteriores',
      subcategory: 'Tematizados',
      use: 'institutional',
    },

    // JUEGOS EXTERIORES - VANGUARDIA
    {
      code: 'VG17001',
      name: 'BEE – Trepador múltiple vanguardista',
      category: 'Juegos Exteriores',
      subcategory: 'Vanguardia',
      description: 'Trepador múltiple con soga acerada trenzada, caño principal 3" x 2mm, bulonería anti-vandálica cabeza allen galvanizada, pintura epoxi en polvo poliuretánica',
      dimensions: '6.50 x 4.00 mts – Alto 2.50 mts',
      materials: 'Acero galvanizado, soga acerada, pintura epoxi poliuretánica',
      use: 'institutional',
    },

    // JUEGOS EXTERIORES - INTEGRADORES
    {
      code: 'INT-001',
      name: 'Hamaca para silla de ruedas',
      category: 'Juegos Exteriores',
      subcategory: 'Integradores',
      description: 'Hamaca adaptada para niños con discapacidad en silla de ruedas',
      use: 'institutional',
    },
    {
      code: 'INT-002',
      name: 'Calesita integradora',
      category: 'Juegos Exteriores',
      subcategory: 'Integradores',
      description: 'Calesita accesible para niños con y sin discapacidad',
      use: 'institutional',
    },

    // LÍNEA FAMILIAR
    {
      code: 'LF0111',
      name: 'Tobogán familiar 4 escalones',
      category: 'Juegos Exteriores',
      subcategory: 'Línea Familiar',
      description: 'Tobogán para uso en jardines particulares',
      use: 'particular',
    },
    {
      code: 'LF0153',
      name: 'Hamaca familiar',
      category: 'Juegos Exteriores',
      subcategory: 'Línea Familiar',
      description: 'Hamaca para jardín doméstico',
      use: 'particular',
    },

    // LÍNEA PREMIUM
    {
      code: 'LP16030',
      name: 'Mangrullo Selva',
      category: 'Juegos Exteriores',
      subcategory: 'Línea Premium',
      description: 'Mangrullo temático selva de alta gama',
      dimensions: '4.20 x 5.60 mts – Alto 4.00 mts',
      use: 'commercial',
    },
    {
      code: 'LP16052',
      name: 'Castillo de Hadas Gigante',
      category: 'Juegos Exteriores',
      subcategory: 'Línea Premium',
      description: 'Mangrullo temático castillo de hadas con tres torres, puentes inclinados, sogas, toboganes rectos y helicoidales, tambores y paneles ta-te-ti',
      dimensions: '10.90 x 9.30 mts – Alto 6.10 mts',
      use: 'commercial',
    },
    {
      code: 'LP16040',
      name: 'Mangrullo Imperial Enrique V Gigante',
      category: 'Juegos Exteriores',
      subcategory: 'Línea Premium',
      description: 'Mangrullo imperial gigante de alta gama',
      dimensions: '11.00 x 6.50 mts – Alto 8.50 mts',
      use: 'commercial',
    },

    // PROYECTOS ESPECIALES
    {
      code: 'PE1214',
      name: 'Proyecto especial - Modelo San Rafael Mendoza',
      category: 'Proyectos Especiales',
      description: 'Toboganes de rotomoldeo 4 mts de altura, tobogán inflable, tuberías, tirolesa, variedad de circuitos de obstáculos, trepadoras',
      dimensions: '14.00 x 10.00 mts – Alto 5.50 mts',
      use: 'institutional',
    },
  ];

  // Insertar productos (upsert por código + tenantId)
  let created = 0;
  for (const product of products) {
    await prisma.product.upsert({
      where: {
        // Usamos una combinación única: creamos un campo compuesto
        // Como no tenemos @@unique en el schema, buscamos primero
        id: `${tenant.id}-${product.code}`,
      },
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
  console.log('\n🎉 Seed completado exitosamente.');
  console.log(`\n📋 Datos para usar en Postman:`);
  console.log(`   tenantId: ${tenant.id}`);
  console.log(`   Admin email: ${admin.email}`);
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
