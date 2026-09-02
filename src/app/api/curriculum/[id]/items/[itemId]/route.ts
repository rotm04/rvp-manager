import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const {
      topic,
      description,
      pocetHodin,
      ovuIds, // array of strings (IDs)
      gIds,
      kkIds,
      ptIds
    } = body;

    // Filter out any empty strings or invalid IDs from inputs
    const cleanOvuIds = ovuIds && Array.isArray(ovuIds) ? ovuIds.filter((id: string) => id && id.trim() !== "") : null;
    const cleanGIds = gIds && Array.isArray(gIds) ? gIds.filter((id: string) => id && id.trim() !== "") : null;
    const cleanKkIds = kkIds && Array.isArray(kkIds) ? kkIds.filter((id: string) => id && id.trim() !== "") : null;
    const cleanPtIds = ptIds && Array.isArray(ptIds) ? ptIds.filter((id: string) => id && id.trim() !== "") : null;

    const updatedItem = await prisma.curriculumPlanItem.update({
      where: { id: itemId },
      data: {
        topic,
        description: description ?? undefined,
        pocetHodin: pocetHodin ? parseInt(pocetHodin, 10) : undefined,
        ovuItems: cleanOvuIds !== null ? {
          set: cleanOvuIds.map((id: string) => ({ id }))
        } : undefined,
        gItems: cleanGIds !== null ? {
          set: cleanGIds.map((id: string) => ({ id }))
        } : undefined,
        kkItems: cleanKkIds !== null ? {
          set: cleanKkIds.map((id: string) => ({ id }))
        } : undefined,
        ptItems: cleanPtIds !== null ? {
          set: cleanPtIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        ovuItems: true,
        gItems: true,
        kkItems: true,
        ptItems: true
      }
    });

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    console.error("PATCH /api/curriculum/[id]/items/[itemId] error:", error);
    return NextResponse.json({ error: "Failed to update curriculum item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;

    await prisma.curriculumPlanItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ success: true, message: "Curriculum item deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/curriculum/[id]/items/[itemId] error:", error);
    return NextResponse.json({ error: "Failed to delete curriculum item" }, { status: 500 });
  }
}
