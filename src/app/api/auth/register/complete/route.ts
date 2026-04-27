import { sendEmail } from "@/lib/email";
import { EmailLayout } from "@/emails/EmailLayout";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { Text } from "@react-email/components";
import * as React from "react";

export const dynamic = "force-dynamic";

function panOk(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase());
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    email?: string;
    role?: Role;
    firstName?: string;
    lastName?: string;
    businessPhone?: string;
    sendSmsUpdates?: boolean;
    licenseType?: "GSTIN" | "PAN";
    gstin?: string;
    pan?: string;
    incorporationDate?: string;
    businessName?: string;
    gstVerified?: boolean;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    bankAccount?: string;
    ifscCode?: string;
    accountName?: string;
    termsAccepted?: boolean;
  };

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  if (!body.termsAccepted) {
    return NextResponse.json({ error: "Accept terms to continue" }, { status: 400 });
  }

  const role = body.role === "VENDOR" ? Role.VENDOR : Role.CUSTOMER;
  const firstName = body.firstName?.trim() ?? "";
  const lastName = body.lastName?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  const businessName = body.businessName?.trim() ?? "";
  const licenseType = body.licenseType ?? "GSTIN";

  if (!fullName || !businessName) {
    return NextResponse.json({ error: "Name and business name required" }, { status: 400 });
  }

  const line1 = body.address?.line1?.trim() ?? "";
  const city = body.address?.city?.trim() ?? "";
  const state = body.address?.state?.trim() ?? "";
  const pincode = body.address?.pincode?.trim() ?? "";
  if (!line1 || !city || !state || !pincode) {
    return NextResponse.json({ error: "Complete business address" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customerProfile: { select: { id: true } },
      vendorProfile: { select: { id: true } },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.emailVerified) {
    return NextResponse.json({ error: "Verify your email first" }, { status: 400 });
  }
  if (user.customerProfile || user.vendorProfile) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }

  if (role === "VENDOR") {
    if (!user.phoneVerified) {
      return NextResponse.json({ error: "Verify your mobile number" }, { status: 400 });
    }
    if (licenseType !== "GSTIN") {
      return NextResponse.json({ error: "Vendors must register with a GSTIN" }, { status: 400 });
    }
  }

  let gstinVal: string | null = null;
  let panVal: string | null = null;
  let gstVerified = false;

  if (licenseType === "GSTIN") {
    gstinVal = body.gstin?.trim().toUpperCase() ?? "";
    if (!gstinVal) {
      return NextResponse.json({ error: "GSTIN required" }, { status: 400 });
    }
    panVal = body.pan?.trim().toUpperCase() ?? null;
    gstVerified = !!body.gstVerified;
  } else {
    panVal = body.pan?.trim().toUpperCase() ?? "";
    if (!panOk(panVal)) {
      return NextResponse.json({ error: "Valid PAN required" }, { status: 400 });
    }
    if (role === "VENDOR") {
      return NextResponse.json({ error: "Vendors must register with a GSTIN" }, { status: 400 });
    }
  }

  if (role === "VENDOR") {
    const bankAccount = body.bankAccount?.trim() ?? "";
    const ifscCode = body.ifscCode?.trim().toUpperCase() ?? "";
    const accountName = body.accountName?.trim() ?? "";
    if (!bankAccount || !ifscCode || !accountName || !panVal || !panOk(panVal)) {
      return NextResponse.json({ error: "Complete bank details and PAN for vendor registration" }, { status: 400 });
    }

    const gstClash = await prisma.vendorProfile.findUnique({
      where: { gstin: gstinVal! },
      select: { id: true },
    });
    if (gstClash) {
      return NextResponse.json({ error: "GSTIN already registered" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          isVerified: true,
          phone: body.businessPhone?.replace(/\D/g, "").slice(-10) ?? user.phone,
        },
      });

      await tx.vendorProfile.create({
        data: {
          userId: u.id,
          companyName: businessName,
          gstin: gstinVal!,
          pan: panVal!,
          bankAccount,
          ifscCode,
          accountName,
        },
      });

      await tx.address.create({
        data: {
          userId: u.id,
          label: "Registered office",
          line1,
          line2: body.address?.line2?.trim() || null,
          city,
          state,
          pincode,
          isDefault: true,
        },
      });
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: user.id },
        data: {
          name: fullName,
          isVerified: true,
          phone: body.businessPhone?.replace(/\D/g, "").slice(-10) || user.phone,
        },
      });

      await tx.customerProfile.create({
        data: {
          userId: u.id,
          companyName: businessName,
          gstin: gstinVal,
          gstVerified,
        },
      });

      await tx.address.create({
        data: {
          userId: u.id,
          label: "Registered office",
          line1,
          line2: body.address?.line2?.trim() || null,
          city,
          state,
          pincode,
          isDefault: true,
        },
      });
    });
  }

  if (process.env.RESEND_API_KEY) {
    await sendEmail({
      to: email,
      subject: "Welcome to Rentfoxxy",
      react: React.createElement(
        EmailLayout,
        { preview: "Your account is ready", title: "Welcome aboard" },
        React.createElement(
          Text,
          { style: { fontSize: "15px", color: "#334155", lineHeight: "24px" } },
          `Hi ${firstName || fullName}, your Rentfoxxy ${role === "VENDOR" ? "vendor" : "buyer"} account is set up. You can sign in anytime.`,
        ),
      ),
    });
  }

  return NextResponse.json({
    success: true,
    redirectTo: role === "VENDOR" ? "/vendor/dashboard" : "/customer/dashboard",
  });
}
