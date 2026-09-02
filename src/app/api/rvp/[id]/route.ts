import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { category, code, description, grade } = body;

    if (!category || !code?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "category, code and description are required" }, { status: 400 });
    }

    let record;
    switch (category) {
      case "ovu":
        record = await prisma.ocekavanyVystup.update({
          where: { id },
          data: {
            code: code.trim(),
            description: description.trim(),
            grade: grade ? parseInt(grade, 10) : null
          }
        });
        break;
      case "g":
        record = await prisma.gramotnost.update({
          where: { id },
          data: { code: code.trim(), description: description.trim() }
        });
        break;
      case "kk":
        record = await prisma.klicovaKompetence.update({
          where: { id },
          data: { code: code.trim(), description: description.trim() }
        });
        break;
      case "pt":
        record = await prisma.prurezoveTema.update({
          where: { id },
          data: { code: code.trim(), description: description.trim() }
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    return NextResponse.json({ ...record, category });
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kód již existuje v databázi" }, { status: 409 });
    }
    console.error("PATCH /api/rvp/[id] error:", error);
    return NextResponse.json({ error: "Failed to update RVP code" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    switch (category) {
      case "ovu":
        await prisma.ocekavanyVystup.delete({ where: { id } });
        break;
      case "g":
        await prisma.gramotnost.delete({ where: { id } });
        break;
      case "kk":
        await prisma.klicovaKompetence.delete({ where: { id } });
        break;
      case "pt":
        await prisma.prurezoveTema.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ error: "Invalid or missing category query param" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/rvp/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete RVP code" }, { status: 500 });
  }
}
