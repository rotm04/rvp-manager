import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;

    await prisma.class.delete({
      where: { id: classId }
    });

    return NextResponse.json({ success: true, message: "Class deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/classes/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
