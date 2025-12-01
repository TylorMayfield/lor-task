import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task, { TaskPriority, TaskStatus } from '@/lib/models/Task';
import Tag from '@/lib/models/Tag';
import { parseTaskFromNLP } from '@/lib/nlp/taskParser';
import { calculateOptimalSchedule } from '@/lib/scheduling/smartScheduler';
import { fireWebhooks, verifyWebhookSignature } from '@/lib/webhooks/webhookService';
import { WebhookEvent } from '@/lib/models/Webhook';

/**
 * Incoming webhook endpoint for creating tasks
 * Supports both authenticated (with webhook secret) and unauthenticated requests
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { task, userId, secret } = body;

    // Validate required fields
    if (!task || !task.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // If secret is provided, verify it (optional for incoming webhooks)
    // In production, you might want to require authentication
    const authHeader = request.headers.get('authorization');
    const webhookSecret = secret || authHeader?.replace('Bearer ', '');

    // Parse task using NLP if text is provided, otherwise use provided data
    let parsedTask;
    if (task.text) {
      parsedTask = parseTaskFromNLP(task.text);
    } else {
      parsedTask = {
        title: task.title,
        description: task.description,
        priority: task.priority || TaskPriority.MEDIUM,
        dueDate: task.dueDate,
        scheduledDate: task.scheduledDate,
        tags: task.tags || [],
        isRecurring: task.isRecurring || false,
        recurringPattern: task.recurringPattern,
      };
    }

    // Get or create tags
    const tagIds: string[] = [];
    if (parsedTask.tags && parsedTask.tags.length > 0) {
      for (const tagName of parsedTask.tags) {
        let tag = await Tag.findOne({ userId, name: tagName });
        if (!tag) {
          tag = await Tag.create({
            userId,
            name: tagName,
          });
        }
        tagIds.push(tag._id.toString());
      }
    }

    // Calculate optimal schedule
    const scheduledDate = calculateOptimalSchedule(
      {
        ...parsedTask,
        priority: parsedTask.priority || TaskPriority.MEDIUM,
      } as any,
      { existingTasks: [] }
    );

    // Create task
    const createdTask = await Task.create({
      title: parsedTask.title,
      description: parsedTask.description,
      userId,
      priority: parsedTask.priority || TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: parsedTask.dueDate ? new Date(parsedTask.dueDate) : undefined,
      scheduledDate: scheduledDate || undefined,
      tags: tagIds,
      isRecurring: parsedTask.isRecurring || false,
      recurringPattern: parsedTask.recurringPattern,
    });

    const populatedTask = await Task.findById(createdTask._id)
      .populate('tags')
      .lean();

    // Fire webhook for task creation (if user has webhooks configured)
    await fireWebhooks(userId, WebhookEvent.TASK_CREATED, populatedTask);

    return NextResponse.json(
      { task: populatedTask, message: 'Task created via webhook' },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

