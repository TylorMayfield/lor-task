import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task, { TaskStatus } from '@/lib/models/Task';
import RecurringTaskHistory from '@/lib/models/RecurringTaskHistory';
import { calculateNextRecurrence } from '@/lib/scheduling/smartScheduler';
import { fireWebhooks } from '@/lib/webhooks/webhookService';
import { WebhookEvent } from '@/lib/models/Webhook';
import { canUserAccessTask } from '@/lib/permissions/boardPermissions';
import { getSession } from '@/lib/api/getSession';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const task = await Task.findOne({ _id: params.id })
      .populate('tags')
      .populate('boardId', 'name color')
      .lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access permissions
    const access = await canUserAccessTask(session.user.id, task);
    if (!access.canView) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const task = await Task.findOne({ _id: params.id })
      .populate('boardId')
      .lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access permissions
    const access = await canUserAccessTask(session.user.id, task);
    if (!access.canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get task as document for updates
    const taskDoc = await Task.findById(params.id);
    if (!taskDoc) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const previousStatus = taskDoc.status;
    const statusChanged = body.status && body.status !== previousStatus;

    // Handle task completion
    if (body.status === TaskStatus.COMPLETED && taskDoc.status !== TaskStatus.COMPLETED) {
      taskDoc.status = TaskStatus.COMPLETED;
      taskDoc.completedAt = new Date();

      // If it's a recurring task, create history and generate next occurrence
      if (taskDoc.isRecurring && taskDoc.recurringPattern) {
        await RecurringTaskHistory.create({
          taskId: taskDoc._id,
          userId: session.user.id,
          originalTaskId: taskDoc._id,
          completedAt: new Date(),
          amount: body.amount,
          notes: body.notes,
          metadata: body.metadata,
        });

        // Create next occurrence
        const nextDate = calculateNextRecurrence(taskDoc as any, new Date());
        if (nextDate) {
          const nextTask = await Task.create({
            title: taskDoc.title,
            description: taskDoc.description,
            userId: session.user.id,
            priority: taskDoc.priority,
            status: TaskStatus.TODO,
            scheduledDate: nextDate,
            tags: taskDoc.tags,
            boardId: taskDoc.boardId,
            isRecurring: true,
            recurringPattern: taskDoc.recurringPattern,
          });
        }
      }
    } else {
      Object.assign(taskDoc, body);
      
      // Auto-remove from inbox if task gets organized (category, board, or scheduled)
      if (body.categoryId || body.boardId || body.scheduledDate || body.dueDate) {
        taskDoc.isInbox = false;
      }
    }

    await taskDoc.save();
    const populatedTask = await Task.findById(taskDoc._id)
      .populate('tags')
      .populate('boardId', 'name color')
      .lean();

    // Fire webhooks for status changes
    if (statusChanged) {
      await fireWebhooks(session.user.id, WebhookEvent.TASK_STATUS_CHANGED, {
        task: populatedTask,
        previousStatus,
        newStatus: task.status,
      });

      // Fire specific event for completion
      if (taskDoc.status === TaskStatus.COMPLETED) {
        await fireWebhooks(session.user.id, WebhookEvent.TASK_COMPLETED, populatedTask);
      }
    }

    // Fire webhook for general task update
    await fireWebhooks(session.user.id, WebhookEvent.TASK_UPDATED, populatedTask);

    return NextResponse.json({ task: populatedTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const task = await Task.findOne({ _id: params.id })
      .populate('tags')
      .populate('boardId')
      .lean();

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check access permissions
    const access = await canUserAccessTask(session.user.id, task);
    if (!access.canDelete) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await Task.deleteOne({ _id: params.id });

    // Fire webhook for task deletion
    await fireWebhooks(session.user.id, WebhookEvent.TASK_DELETED, task);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

