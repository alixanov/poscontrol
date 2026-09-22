import { PrismaClient, Role, PaymentMethod, ShiftStatus, OrderStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинается сидирование базы данных...');

  // 1. Create Users
  const adminPassword = await argon2.hash('admin123');
  const cashierPassword = await argon2.hash('cashier123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@store.local' },
    update: {},
    create: {
      name: 'Александр (Администратор)',
      email: 'admin@store.local',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      pinCode: '1111',
    },
  });

  const cashier1 = await prisma.user.upsert({
    where: { email: 'cashier1@store.local' },
    update: {},
    create: {
      name: 'Елена (Кассир)',
      email: 'cashier1@store.local',
      passwordHash: cashierPassword,
      role: Role.CASHIER,
      pinCode: '2222',
    },
  });

  const cashier2 = await prisma.user.upsert({
    where: { email: 'cashier2@store.local' },
    update: {},
    create: {
      name: 'Дмитрий (Кассир)',
      email: 'cashier2@store.local',
      passwordHash: cashierPassword,
      role: Role.CASHIER,
      pinCode: '3333',
    },
  });

  console.log('✅ Пользователи созданы');

  // 2. Warehouses
  let mainWarehouse = await prisma.warehouse.findFirst({
    where: { isDefault: true },
  });

  if (!mainWarehouse) {
    mainWarehouse = await prisma.warehouse.create({
      data: {
        name: 'Основной склад',
        address: 'г. Москва, ул. Складская, стр. 12',
        isDefault: true,
      },
    });
  }

  const storeHall = await prisma.warehouse.upsert({
    where: { id: 'warehouse-hall-001' },
    update: {},
    create: {
      id: 'warehouse-hall-001',
      name: 'Торговый зал (Витрина)',
      address: 'ТЦ Центральный, 1 этаж',
      isDefault: false,
    },
  });

  console.log('✅ Склады созданы');

  // 3. Categories
  const catDrinks = await prisma.category.upsert({
    where: { slug: 'napitki' },
    update: {},
    create: { name: 'Напитки', slug: 'napitki' },
  });

  const catCoffee = await prisma.category.upsert({
    where: { slug: 'kofe-chay' },
    update: {},
    create: { name: 'Кофе и Чай', slug: 'kofe-chay' },
  });

  const catSnacks = await prisma.category.upsert({
    where: { slug: 'bakaleya-sneki' },
    update: {},
    create: { name: 'Снеки и Сладости', slug: 'bakaleya-sneki' },
  });

  const catDairy = await prisma.category.upsert({
    where: { slug: 'molochnaya-produktsiya' },
    update: {},
    create: { name: 'Молочная продукция', slug: 'molochnaya-produktsiya' },
  });

  const catHousehold = await prisma.category.upsert({
    where: { slug: 'bytovaya-khimiya' },
    update: {},
    create: { name: 'Бытовая химия', slug: 'bytovaya-khimiya' },
  });

  console.log('✅ Категории созданы');

  // 4. Demo Products
  const productsData = [
    {
      name: 'Кофе зерновой Arabica Premium 1кг',
      sku: 'COF-ARA-001',
      barcode: '4607001234567',
      categoryId: catCoffee.id,
      costPrice: 750,
      salePrice: 1290,
      stockQuantity: 45,
      minStockAlert: 5,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Чай черный листовой Ceylon 100г',
      sku: 'TEA-CEY-002',
      barcode: '4601234567890',
      categoryId: catCoffee.id,
      costPrice: 120,
      salePrice: 220,
      stockQuantity: 80,
      minStockAlert: 10,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Вода минеральная без газа 1.5л',
      sku: 'DRK-WAT-003',
      barcode: '4820000111223',
      categoryId: catDrinks.id,
      costPrice: 30,
      salePrice: 65,
      stockQuantity: 120,
      minStockAlert: 20,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Напиток газированный Cola Classic 0.5л',
      sku: 'DRK-COL-004',
      barcode: '5449000000996',
      categoryId: catDrinks.id,
      costPrice: 45,
      salePrice: 95,
      stockQuantity: 95,
      minStockAlert: 15,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Шоколад молочный с фундуком 90г',
      sku: 'SNK-CHO-005',
      barcode: '7622210123456',
      categoryId: catSnacks.id,
      costPrice: 60,
      salePrice: 115,
      stockQuantity: 60,
      minStockAlert: 10,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Чипсы картофельные с паприкой 140г',
      sku: 'SNK-CHP-006',
      barcode: '5900020011443',
      categoryId: catSnacks.id,
      costPrice: 85,
      salePrice: 160,
      stockQuantity: 50,
      minStockAlert: 8,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Молоко пастеризованное 3.2% 930мл',
      sku: 'MLK-PAS-007',
      barcode: '4607012345998',
      categoryId: catDairy.id,
      costPrice: 55,
      salePrice: 89,
      stockQuantity: 35,
      minStockAlert: 10,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Сыр Российский полутвердый 45% 200г',
      sku: 'MLK-CHS-008',
      barcode: '4607045612348',
      categoryId: catDairy.id,
      costPrice: 140,
      salePrice: 245,
      stockQuantity: 4, // Intentionally low to test lowStock alerts
      minStockAlert: 8,
      unit: 'уп',
      imageUrl: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Гель для мытья посуды Лимон 500мл',
      sku: 'HOU-GEL-009',
      barcode: '4601501239871',
      categoryId: catHousehold.id,
      costPrice: 90,
      salePrice: 175,
      stockQuantity: 3, // Low stock alert
      minStockAlert: 5,
      unit: 'шт',
      imageUrl: 'https://images.unsplash.com/photo-1585670270608-b404fb0801b6?w=500&auto=format&fit=crop&q=60',
    },
    {
      name: 'Салфетки влажные антибактериальные 60шт',
      sku: 'HOU-WIP-010',
      barcode: '4601987456123',
      categoryId: catHousehold.id,
      costPrice: 40,
      salePrice: 85,
      stockQuantity: 70,
      minStockAlert: 10,
      unit: 'уп',
      imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60',
    },
  ];

  const createdProducts = [];
  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { barcode: item.barcode },
      update: {},
      create: {
        ...item,
        stocks: {
          create: {
            warehouseId: mainWarehouse.id,
            quantity: item.stockQuantity,
          },
        },
      },
    });
    createdProducts.push(product);
  }

  console.log(`✅ Товаров создано: ${createdProducts.length}`);

  // 5. Sample Shift & Orders for initial analytics
  const shift = await prisma.cashShift.create({
    data: {
      cashierId: cashier1.id,
      startingCash: 5000,
      expectedCash: 8750,
      actualCash: 8750,
      cashDifference: 0,
      status: ShiftStatus.CLOSED,
      openedAt: new Date(Date.now() - 3600000 * 8),
      closedAt: new Date(Date.now() - 3600000 * 1),
      notes: 'Смена закрыта успешно',
    },
  });

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'CHK-901124-101',
      shiftId: shift.id,
      cashierId: cashier1.id,
      subtotal: 1290 + 95,
      discountAmount: 0,
      totalAmount: 1385,
      paymentMethod: PaymentMethod.CARD,
      status: OrderStatus.COMPLETED,
      createdAt: new Date(Date.now() - 3600000 * 5),
      items: {
        create: [
          {
            productId: createdProducts[0].id, // Coffee
            productName: createdProducts[0].name,
            sku: createdProducts[0].sku,
            barcode: createdProducts[0].barcode,
            quantity: 1,
            price: 1290,
            costPrice: 750,
            total: 1290,
          },
          {
            productId: createdProducts[3].id, // Cola
            productName: createdProducts[3].name,
            sku: createdProducts[3].sku,
            barcode: createdProducts[3].barcode,
            quantity: 1,
            price: 95,
            costPrice: 45,
            total: 95,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'CHK-901124-102',
      shiftId: shift.id,
      cashierId: cashier1.id,
      subtotal: 220 * 2 + 115,
      discountAmount: 15,
      totalAmount: 540,
      paymentMethod: PaymentMethod.CASH,
      cashReceived: 1000,
      changeGiven: 460,
      status: OrderStatus.COMPLETED,
      createdAt: new Date(Date.now() - 3600000 * 3),
      items: {
        create: [
          {
            productId: createdProducts[1].id, // Tea
            productName: createdProducts[1].name,
            sku: createdProducts[1].sku,
            barcode: createdProducts[1].barcode,
            quantity: 2,
            price: 220,
            costPrice: 120,
            total: 440,
          },
          {
            productId: createdProducts[4].id, // Chocolate
            productName: createdProducts[4].name,
            sku: createdProducts[4].sku,
            barcode: createdProducts[4].barcode,
            quantity: 1,
            price: 115,
            costPrice: 60,
            total: 115,
          },
        ],
      },
    },
  });

  console.log('✅ Тестовые заказы и чеки созданы');

  // 6. Audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INIT',
      entity: 'System',
      details: 'База данных успешно инициализирована тестовыми данными',
    },
  });

  console.log('🎉 Сидирование завершено успешно!');
  console.log('----------------------------------------------------');
  console.log('Администратор: admin@store.local | пароль: admin123 | PIN: 1111');
  console.log('Кассир 1:      cashier1@store.local | пароль: cashier123 | PIN: 2222');
  console.log('Кассир 2:      cashier2@store.local | пароль: cashier123 | PIN: 3333');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
