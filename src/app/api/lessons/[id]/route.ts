import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;
    const body = await request.json();
    
    const {
      date, // ISO string
      delkaTrvani, // duration in minutes
      status, // "scheduled", "completed", "cancelled"
      topic,
      description,
      ovuCode, ovuDescription,
      gCode, gDescription,
      kkCode, kkDescription,
      ptCode, ptDescription
    } = body;

    const dataToUpdate: any = {};
    
    let existingLesson = null;
    if (date !== undefined || delkaTrvani !== undefined) {
      existingLesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    }

    if (date !== undefined) dataToUpdate.date = new Date(date);
    if (delkaTrvani !== undefined) dataToUpdate.delkaTrvani = parseInt(delkaTrvani, 10);
    
    if (date !== undefined || delkaTrvani !== undefined) {
      if (existingLesson) {
        const activeDate = date !== undefined ? new Date(date) : new Date(existingLesson.date);
        const activeDuration = delkaTrvani !== undefined ? parseInt(delkaTrvani, 10) : existingLesson.delkaTrvani;
        dataToUpdate.konec = new Date(activeDate.getTime() + activeDuration * 60 * 1000);
      }
    }

    if (status !== undefined) dataToUpdate.status = status;
    if (topic !== undefined) dataToUpdate.topic = topic;
    if (description !== undefined) dataToUpdate.description = description;
    
    if (ovuCode !== undefined) dataToUpdate.ovuCode = ovuCode;
    if (ovuDescription !== undefined) dataToUpdate.ovuDescription = ovuDescription;
    if (gCode !== undefined) dataToUpdate.gCode = gCode;
    if (gDescription !== undefined) dataToUpdate.gDescription = gDescription;
    if (kkCode !== undefined) dataToUpdate.kkCode = kkCode;
    if (kkDescription !== undefined) dataToUpdate.kkDescription = kkDescription;
    if (ptCode !== undefined) dataToUpdate.ptCode = ptCode;
    if (ptDescription !== undefined) dataToUpdate.ptDescription = ptDescription;

    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedLesson);
  } catch (error: any) {
    console.error("PATCH /api/lessons/[id] error:", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 550 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lessonId } = await params;

    await prisma.lesson.delete({
      where: { id: lessonId }
    });

    return NextResponse.json({ success: true, message: "Lesson deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/lessons/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
