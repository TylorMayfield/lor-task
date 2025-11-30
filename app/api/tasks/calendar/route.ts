import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/lib/models/Task';
import { buildDailyCalendar } from '@/lib/scheduling/smartScheduler';
import { getSession } from '@/lib/api/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date') || new Date().toISOString();

    const targetDate = new Date(date);

    // Get all active tasks for the user
    const allTasks = await Task.find({
      userId: session.user.id,
      status: { $ne: 'completed' },
    })
      .populate('tags')
      .lean();

    // Build daily calendar
    const calendarTasks = buildDailyCalendar(session.user.id, allTasks as any, targetDate);

    return NextResponse.json({ tasks: calendarTasks, date: targetDate.toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

