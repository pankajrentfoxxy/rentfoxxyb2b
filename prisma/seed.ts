import "dotenv/config";

import { LotItemCondition, ProductCondition, Role, VendorStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  await prisma.lotBid.deleteMany();
  await prisma.asAsBid.deleteMany();
  await prisma.lotPurchase.deleteMany();
  await prisma.asAsPurchase.deleteMany();
  await prisma.lotInventoryItem.deleteMany();
  await prisma.lotListing.deleteMany();
  await prisma.asAsInventoryItem.deleteMany();
  await prisma.asAsListing.deleteMany();
  await prisma.verificationTask.deleteMany();
  await prisma.inspector.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.productListing.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.vendorProfile.deleteMany();
  await prisma.address.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  const [adminPass, vendorPass, customerPass, inspectorPass] = await Promise.all([
    hash("Admin@1234"),
    hash("Vendor@1234"),
    hash("Customer@1234"),
    hash("Inspector@1234"),
  ]);

  await prisma.user.create({
    data: {
      email: "admin@rentfoxxy.com",
      passwordHash: adminPass,
      role: Role.ADMIN,
      isVerified: true,
    },
  });

  const vendor1User = await prisma.user.create({
    data: {
      email: "vendor1@test.com",
      passwordHash: vendorPass,
      role: Role.VENDOR,
      isVerified: true,
      vendorProfile: {
        create: {
          companyName: "Northwind IT Supply",
          gstin: "22AAAAA1111A1Z1",
          pan: "ABCDE1234F",
          bankAccount: "123456789012",
          ifscCode: "HDFC0001234",
          accountName: "Northwind IT Supply",
          commissionRate: 8,
          status: VendorStatus.ACTIVE,
          approvedAt: new Date(),
          acceptedPaymentMethods: [
            "UPI",
            "NET_BANKING",
            "CARD",
            "RAZORPAY_LINK",
            "TOKEN_PAYMENT",
            "NEFT_RTGS",
          ],
          requiresFullAdvance: false,
          acceptsTokenPayment: true,
          minTokenPercentage: 2,
          minOrderForRTGS: null,
        },
      },
    },
    include: { vendorProfile: true },
  });

  const vendor2User = await prisma.user.create({
    data: {
      email: "vendor2@test.com",
      passwordHash: vendorPass,
      role: Role.VENDOR,
      isVerified: true,
      vendorProfile: {
        create: {
          companyName: "Konoha Peripherals Pvt Ltd",
          gstin: "22BBBBB2222B1Z2",
          pan: "FGHIJ5678K",
          bankAccount: "987654321098",
          ifscCode: "ICIC0005678",
          accountName: "Konoha Peripherals Pvt Ltd",
          commissionRate: 8,
          status: VendorStatus.ACTIVE,
          approvedAt: new Date(),
          acceptedPaymentMethods: ["UPI", "NET_BANKING", "CARD", "RAZORPAY_LINK"],
          requiresFullAdvance: false,
          acceptsTokenPayment: false,
          minTokenPercentage: 2,
          minOrderForRTGS: 120_000,
        },
      },
    },
    include: { vendorProfile: true },
  });

  await prisma.user.create({
    data: {
      email: "customer@test.com",
      passwordHash: customerPass,
      role: Role.CUSTOMER,
      isVerified: true,
      customerProfile: {
        create: {
          companyName: "Acme Retail Pvt Ltd",
          gstin: "22CCCCC3333C1Z3",
          gstVerified: true,
        },
      },
      addresses: {
        create: [
          {
            label: "HQ",
            line1: "221B Tech Park",
            city: "Bengaluru",
            state: "KA",
            pincode: "560001",
            isDefault: true,
          },
        ],
      },
    },
  });

  const inspectorUser = await prisma.user.create({
    data: {
      email: "inspector@rentfoxxy.com",
      passwordHash: inspectorPass,
      role: Role.INSPECTOR,
      isVerified: true,
    },
  });
  await prisma.inspector.create({
    data: {
      userId: inspectorUser.id,
      name: "Demo Field Inspector",
      type: "INHOUSE",
      isActive: true,
    },
  });

  await prisma.user.create({
    data: {
      email: "inspection.manager@rentfoxxy.com",
      passwordHash: inspectorPass,
      role: Role.INSPECTION_MANAGER,
      isVerified: true,
    },
  });

  const v1 = vendor1User.vendorProfile!;
  const v2 = vendor2User.vendorProfile!;

  const asasTotalUnits = 60;
  const asasTotalValue = 35 * 15_500 + 25 * 19_500;

  await prisma.lotListing.create({
    data: {
      vendorId: v1.id,
      title: "Spring corporate refresh — Dell & HP mix",
      description: "Demo LIVE lot for storefront (Addendum v1.3 seed).",
      totalQuantity: 60,
      lotSize: 10,
      totalLots: 6,
      lotsSold: 2,
      pricePerLot: 195_000,
      status: "LIVE",
      liveAt: new Date(),
      items: {
        create: [
          {
            brand: "Dell",
            model: "Latitude 5540",
            generation: "13th Gen",
            processor: "Intel Core i5-1335U",
            ramGb: 16,
            storageGb: 512,
            storageType: "SSD",
            displayInch: 15.6,
            os: "Windows 11 Pro",
            condition: LotItemCondition.REFURB_A,
            count: 30,
            unitPrice: 18_500,
          },
          {
            brand: "HP",
            model: "EliteBook 840 G10",
            generation: null,
            processor: "Intel Core i7-1355U",
            ramGb: 16,
            storageGb: 512,
            storageType: "SSD",
            displayInch: 14,
            os: "Windows 11 Pro",
            condition: LotItemCondition.REFURB_A_PLUS,
            count: 30,
            unitPrice: 21_500,
          },
        ],
      },
    },
  });

  await prisma.asAsListing.create({
    data: {
      vendorId: v2.id,
      title: "Verified business laptop fleet — Lenovo & Dell",
      description: "Demo LIVE AsAs listing for storefront (Addendum v1.3 seed).",
      highlights: ["Mixed grades", "B2B pricing", "Fast verification path"],
      totalUnits: asasTotalUnits,
      unitsSold: 10,
      avgUnitPrice: asasTotalValue / asasTotalUnits,
      totalValue: asasTotalValue,
      allowBidding: true,
      status: "LIVE",
      items: {
        create: [
          {
            brand: "Lenovo",
            model: "ThinkPad L14",
            generation: "Gen 4",
            processor: "AMD Ryzen 5 7530U",
            ramGb: 8,
            storageGb: 256,
            storageType: "SSD",
            condition: LotItemCondition.REFURB_B,
            count: 35,
            estimatedValue: 15_500,
          },
          {
            brand: "Dell",
            model: "Latitude 5440",
            generation: null,
            processor: "Intel Core i5-1335U",
            ramGb: 16,
            storageGb: 512,
            storageType: "SSD",
            condition: LotItemCondition.REFURB_A,
            count: 25,
            estimatedValue: 19_500,
          },
        ],
      },
    },
  });

  const categories = await prisma.$transaction([
    prisma.category.create({ data: { name: "Laptops", slug: "laptops", icon: "laptop" } }),
    prisma.category.create({
      data: { name: "Accessories", slug: "accessories", icon: "mouse" },
    }),
    prisma.category.create({ data: { name: "Networking", slug: "networking", icon: "wifi" } }),
    prisma.category.create({ data: { name: "Storage", slug: "storage", icon: "hard-drive" } }),
  ]);

  const [catLap, catAcc, catNet, catStor] = categories;

  const productsData = [
    {
      name: "ThinkPad P14s Gen 4",
      slug: "thinkpad-p14s-gen4",
      description: "14\" mobile workstation for developers and finance teams.",
      categoryId: catLap.id,
      brand: "Lenovo",
      specs: {
        cpu: "AMD Ryzen 7 PRO 7840U",
        ram: "32GB DDR5",
        storage: "1TB NVMe SSD",
        display: '14" WUXGA IPS',
        os: "Windows 11 Pro",
      },
      images: ["/placeholder/laptop-1.svg"],
      hsnCode: "8471",
    },
    {
      name: 'MacBook Pro 16" M3 Pro',
      slug: "macbook-pro-16-m3-pro",
      description: "Creative and engineering workloads with Liquid Retina XDR.",
      categoryId: catLap.id,
      brand: "Apple",
      specs: {
        chip: "Apple M3 Pro",
        ram: "36GB unified",
        storage: "512GB SSD",
        display: '16.2" XDR',
        ports: "HDMI, SD, Thunderbolt 4",
      },
      images: ["/placeholder/laptop-2.svg"],
      hsnCode: "8471",
    },
    {
      name: "Logitech MX Master 3S",
      slug: "logitech-mx-master-3s",
      description: "Silent clicks, multi-device flow, precision wheel.",
      categoryId: catAcc.id,
      brand: "Logitech",
      specs: {
        connectivity: "Bluetooth + Bolt USB",
        dpi: "8000",
        battery: "70 days",
        weight: "141g",
      },
      images: ["/placeholder/mouse.svg"],
      hsnCode: "8471",
    },
    {
      name: "Ubiquiti UniFi Dream Machine",
      slug: "ubiquiti-unifi-dream-machine",
      description: "All-in-one enterprise gateway, switch, and Wi-Fi controller.",
      categoryId: catNet.id,
      brand: "Ubiquiti",
      specs: {
        ports: "4× GbE LAN + 1× WAN",
        threatManagement: "3.5 Gbps",
        unifi: "Network application built-in",
      },
      images: ["/placeholder/network.svg"],
      hsnCode: "8517",
    },
    {
      name: "Samsung 990 PRO 2TB NVMe",
      slug: "samsung-990-pro-2tb",
      description: "PCIe Gen4 SSD for heavy read/write B2B workloads.",
      categoryId: catStor.id,
      brand: "Samsung",
      specs: {
        interface: "PCIe 4.0 ×4",
        seqRead: "7450 MB/s",
        seqWrite: "6900 MB/s",
        endurance: "1200 TBW",
      },
      images: ["/placeholder/ssd.svg"],
      hsnCode: "8523",
    },
  ];

  const condRot: ProductCondition[] = [
    ProductCondition.BRAND_NEW,
    ProductCondition.REFURB_A_PLUS,
    ProductCondition.REFURB_B,
    ProductCondition.REFURB_A,
    ProductCondition.REFURB_C,
  ];

  function listingConditionFields(condition: ProductCondition): {
    batteryHealth: number | null;
    warrantyMonths: number;
    warrantyType: string;
    conditionNotes: string | null;
  } {
    if (condition === ProductCondition.BRAND_NEW) {
      return {
        batteryHealth: null,
        warrantyMonths: 12,
        warrantyType: "Manufacturer (via supplier)",
        conditionNotes: null,
      };
    }
    if (condition === ProductCondition.REFURB_C) {
      return {
        batteryHealth: 82,
        warrantyMonths: 3,
        warrantyType: "Seller refurbishment — limited",
        conditionNotes: "Cosmetic wear; functionally tested by supplier.",
      };
    }
    return {
      batteryHealth: 93 + (condition === ProductCondition.REFURB_A_PLUS ? 3 : 0),
      warrantyMonths: 6,
      warrantyType: "Seller refurbishment warranty",
      conditionNotes: null,
    };
  }

  for (let i = 0; i < productsData.length; i++) {
    const p = productsData[i];
    const product = await prisma.product.create({ data: { ...p, isFeatured: i < 2 } });

    const condA = condRot[i % condRot.length]!;
    const condB = condRot[(i + 2) % condRot.length]!;
    const metaA = listingConditionFields(condA);
    const metaB = listingConditionFields(condB);

    await prisma.productListing.create({
      data: {
        productId: product.id,
        vendorId: v1.id,
        sku: `RFX-${v1.id.slice(0, 6)}-${product.slug}-A`.toUpperCase(),
        unitPrice: 95000 + i * 2500,
        stockQty: 24 - i * 2,
        minOrderQty: 2,
        minBidPrice: 88000 + i * 2000,
        bulkPricing: { tiers: [{ minQty: 10, pricePerUnit: 90000 + i * 2000 }] },
        condition: condA,
        ...metaA,
      },
    });

    await prisma.productListing.create({
      data: {
        productId: product.id,
        vendorId: v2.id,
        sku: `RFX-${v2.id.slice(0, 6)}-${product.slug}-B`.toUpperCase(),
        unitPrice: 93000 + i * 2400,
        stockQty: 30 - i * 3,
        minOrderQty: 1,
        minBidPrice: 86000 + i * 1900,
        bulkPricing: { tiers: [{ minQty: 8, pricePerUnit: 89000 + i * 1800 }] },
        condition: condB,
        ...metaB,
      },
    });
  }

  console.log("Seed complete. Users:");
  console.log("  admin@rentfoxxy.com / Admin@1234");
  console.log("  vendor1@test.com, vendor2@test.com / Vendor@1234");
  console.log("  customer@test.com / Customer@1234");
  console.log("  inspector@rentfoxxy.com, inspection.manager@rentfoxxy.com / Inspector@1234");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
