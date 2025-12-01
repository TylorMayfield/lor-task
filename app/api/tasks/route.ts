import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task, { TaskPriority, TaskStatus } from '@/lib/models/Task';
import Tag from '@/lib/models/Tag';
import { parseTaskFromNLP, extractTagsFromText } from '@/lib/nlp/taskParser';
import { calculateOptimalSchedule } from '@/lib/scheduling/smartScheduler';
import { fireWebhooks } from '@/lib/webhooks/webhookService';
import { WebhookEvent } from '@/lib/models/Webhook';
import { canUserAccessBoard, canUserAccessTask } from '@/lib/permissions/boardPermissions';
import { getSession } from '@/lib/api/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const tagId = searchParams.get('tagId');
    const boardId = searchParams.get('boardId');
    const inbox = searchParams.get('inbox');
    const search = searchParams.get('search');

    // Build query - include user's tasks and board tasks they have access to
    const query: any = {
      $or: [{ userId: session.user.id }],
    };

    // If boardId specified, check access and filter by board
    if (boardId) {
      const hasAccess = await canUserAccessBoard(session.user.id, boardId, 'view');
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      query.$or.push({ boardId });
    }

    if (status) {
      query.status = status;
    }

    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.$or.push(
        { scheduledDate: { $gte: targetDate, $lt: nextDay } },
        { dueDate: { $gte: targetDate, $lt: nextDay } }
      );
    }

    if (tagId) {
      query.tags = tagId;
    }

    if (inbox === 'true') {
      query.isInbox = true;
    }

    // Text search - add to existing query
    if (search) {
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.$or;
    }

    const tasks = await Task.find(query)
      .populate('tags')
      .populate('categoryId', 'name color')
      .populate('boardId', 'name color')
      .populate('userId', 'name email')
      .sort({ priority: 1, dueDate: 1, createdAt: -1 })
      .lean();

    // Filter tasks user has access to
    const accessibleTasks = [];
    for (const task of tasks) {
      const access = await canUserAccessTask(session.user.id, task);
      if (access.canView) {
        accessibleTasks.push(task);
      }
    }

    return NextResponse.json({ tasks: accessibleTasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { text, boardId, ...taskData } = body;

    // If boardId provided, check access
    if (boardId) {
      const hasAccess = await canUserAccessBoard(session.user.id, boardId, 'edit');
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied to board' }, { status: 403 });
      }
    }

    let parsedTask;
    try {
      if (text) {
        // Use NLP to parse the task
        parsedTask = parseTaskFromNLP(text);
      } else {
        parsedTask = taskData;
      }
    } catch (error) {
      console.error('Error parsing task:', error);
      // Fallback to basic task creation
      parsedTask = {
        title: text || taskData.title || 'Untitled Task',
        description: taskData.description,
        priority: taskData.priority || TaskPriority.MEDIUM,
        tags: taskData.tags || [],
      };
    }

    // Get or create tags - prioritize tags from body, then from NLP parsing
    const tagIds: string[] = [];
    const tagsToProcess = body.tags && body.tags.length > 0 
      ? body.tags 
      : (parsedTask.tags && parsedTask.tags.length > 0 ? parsedTask.tags : []);
    
    if (tagsToProcess.length > 0) {
      for (const tagName of tagsToProcess) {
        let tag = await Tag.findOne({ userId: session.user.id, name: tagName });
        if (!tag) {
          tag = await Tag.create({
            userId: session.user.id,
            name: tagName,
          });
        }
        tagIds.push(tag._id.toString());
      }
    }

    // Calculate optimal schedule (only if smart scheduling is enabled and no explicit date provided)
    let scheduledDate = parsedTask.scheduledDate ? new Date(parsedTask.scheduledDate) : undefined;
    if (!scheduledDate && !parsedTask.dueDate) {
      try {
        scheduledDate = calculateOptimalSchedule(
          {
            ...parsedTask,
            priority: parsedTask.priority || TaskPriority.MEDIUM,
          },
          { existingTasks: [] }
        ) || undefined;
      } catch (error) {
        console.error('Error calculating schedule:', error);
        scheduledDate = undefined;
      }
    }

    // Determine if task should be in inbox
    // Task is in inbox if it has no category, no board, no scheduled date, and no due date
    const isInbox = !body.categoryId && 
                    !boardId && 
                    !scheduledDate && 
                    !parsedTask.dueDate;

    const task = await Task.create({
      title: parsedTask.title,
      description: parsedTask.description,
      userId: session.user.id,
      priority: parsedTask.priority || TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: parsedTask.dueDate ? new Date(parsedTask.dueDate) : undefined,
      scheduledDate: scheduledDate || undefined,
      tags: tagIds,
      categoryId: body.categoryId || undefined,
      boardId: boardId || undefined,
      isInbox: isInbox,
      isRecurring: parsedTask.isRecurring || false,
      recurringPattern: parsedTask.recurringPattern,
    });

    const populatedTask = await Task.findById(task._id).populate('tags').lean();

    // Fire webhook for task creation
    await fireWebhooks(session.user.id, WebhookEvent.TASK_CREATED, populatedTask);

    return NextResponse.json({ task: populatedTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

