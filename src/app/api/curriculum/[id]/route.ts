import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updatedPlan = await prisma.curriculumPlan.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? (description ? description.trim() : null) : undefined
      },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            ovuItems: true,
            gItems: true,
            kkItems: true,
            ptItems: true
          }
        }
      }
    });

    return NextResponse.json(updatedPlan);
  } catch (error: any) {
    console.error("PATCH /api/curriculum/[id] error:", error);
    return NextResponse.json({ error: "Failed to update curriculum plan" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.curriculumPlan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Curriculum plan deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/curriculum/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete curriculum plan" }, { status: 500 });
  }
}
