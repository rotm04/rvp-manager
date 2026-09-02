import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      maxPoints,
      maxGrade,
      filePlaceholder,
      datumZadani,
      dueDate
    } = body;

    // Fetch existing task to run date validations
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const finalAssignmentDate = datumZadani ? new Date(datumZadani) : new Date(existingTask.datumZadani);
    const finalDueDate = dueDate !== undefined 
      ? (dueDate ? new Date(dueDate) : null) 
      : (existingTask.dueDate ? new Date(existingTask.dueDate) : null);

    if (finalDueDate && finalDueDate.getTime() < finalAssignmentDate.getTime()) {
      return NextResponse.json({ 
        error: "Termín odevzdání (deadline) nesmí předcházet datu zadání." 
      }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (maxPoints !== undefined) dataToUpdate.maxPoints = maxPoints ? parseInt(maxPoints, 10) : null;
    if (maxGrade !== undefined) dataToUpdate.maxGrade = maxGrade || null;
    if (filePlaceholder !== undefined) dataToUpdate.filePlaceholder = filePlaceholder || null;
    if (datumZadani !== undefined) dataToUpdate.datumZadani = finalAssignmentDate;
    if (dueDate !== undefined) dataToUpdate.dueDate = finalDueDate;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate
    });

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 550 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
