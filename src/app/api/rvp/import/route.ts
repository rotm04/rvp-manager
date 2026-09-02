import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, items } = body;

    if (!category || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "category and items array are required" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const item of items) {
      const { code, description, grade } = item;
      if (!code?.trim() || !description?.trim()) {
        errors.push(`Přeskočen neplatný řádek: "${code}"`);
        continue;
      }

      try {
        switch (category) {
          case "ovu": {
            const existing = await prisma.ocekavanyVystup.findUnique({ where: { code: code.trim() } });
            if (existing) {
              await prisma.ocekavanyVystup.update({
                where: { code: code.trim() },
                data: { description: description.trim(), grade: grade ? parseInt(grade, 10) : null }
              });
              updated++;
            } else {
              await prisma.ocekavanyVystup.create({
                data: { code: code.trim(), description: description.trim(), grade: grade ? parseInt(grade, 10) : null }
              });
              created++;
            }
            break;
          }
          case "g": {
            const existing = await prisma.gramotnost.findUnique({ where: { code: code.trim() } });
            if (existing) {
              await prisma.gramotnost.update({ where: { code: code.trim() }, data: { description: description.trim() } });
              updated++;
            } else {
              await prisma.gramotnost.create({ data: { code: code.trim(), description: description.trim() } });
              created++;
            }
            break;
          }
          case "kk": {
            const existing = await prisma.klicovaKompetence.findUnique({ where: { code: code.trim() } });
            if (existing) {
              await prisma.klicovaKompetence.update({ where: { code: code.trim() }, data: { description: description.trim() } });
              updated++;
            } else {
              await prisma.klicovaKompetence.create({ data: { code: code.trim(), description: description.trim() } });
              created++;
            }
            break;
          }
          case "pt": {
            const existing = await prisma.prurezoveTema.findUnique({ where: { code: code.trim() } });
            if (existing) {
              await prisma.prurezoveTema.update({ where: { code: code.trim() }, data: { description: description.trim() } });
              updated++;
            } else {
              await prisma.prurezoveTema.create({ data: { code: code.trim(), description: description.trim() } });
              created++;
            }
            break;
          }
          default:
            return NextResponse.json({ error: "Invalid category" }, { status: 400 });
        }
      } catch (itemErr: any) {
        errors.push(`Chyba u kódu "${code}": ${itemErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      errors
    });
  } catch (error: any) {
    console.error("POST /api/rvp/import error:", error);
    return NextResponse.json({ error: "Failed to import RVP codes" }, { status: 500 });
  }
}
