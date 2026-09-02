import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gradeParam = searchParams.get("grade");
    
    // Only filter by grade if gradeParam is explicitly provided and not "all"
    const ovuWhere = (gradeParam && gradeParam !== "all") ? { grade: parseInt(gradeParam, 10) } : {};

    const [ovu, g, kk, pt] = await Promise.all([
      prisma.ocekavanyVystup.findMany({
        where: ovuWhere,
        orderBy: { code: "asc" }
      }),
      prisma.gramotnost.findMany({
        orderBy: { code: "asc" }
      }),
      prisma.klicovaKompetence.findMany({
        orderBy: { code: "asc" }
      }),
      prisma.prurezoveTema.findMany({
        orderBy: { code: "asc" }
      })
    ]);

    return NextResponse.json({ ovu, g, kk, pt });
  } catch (error: any) {
    console.error("GET /api/rvp error:", error);
    return NextResponse.json({ error: "Failed to fetch RVP codelists" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, code, description, grade } = body;

    if (!category || !code?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "category, code and description are required" }, { status: 400 });
    }

    let record;
    switch (category) {
      case "ovu":
        record = await prisma.ocekavanyVystup.create({
          data: {
            code: code.trim(),
            description: description.trim(),
            grade: grade ? parseInt(grade, 10) : null
          }
        });
        break;
      case "g":
        record = await prisma.gramotnost.create({
          data: { code: code.trim(), description: description.trim() }
        });
        break;
      case "kk":
        record = await prisma.klicovaKompetence.create({
          data: { code: code.trim(), description: description.trim() }
        });
        break;
      case "pt":
        record = await prisma.prurezoveTema.create({
          data: { code: code.trim(), description: description.trim() }
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    return NextResponse.json({ ...record, category }, { status: 201 });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kód již existuje v databázi" }, { status: 409 });
    }
    console.error("POST /api/rvp error:", error);
    return NextResponse.json({ error: "Failed to create RVP code" }, { status: 500 });
  }
}
