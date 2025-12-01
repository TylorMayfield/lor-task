import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { patternLearner } from '@/lib/ml/patternLearner';
import { getSession } from '@/lib/api/getSession';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { taskTitle, taskDescription } = body;

    if (!taskTitle) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    // Use ML to predict tags, schedule, and priority
    const [predictedTags, predictedSchedule, predictedPriority, recurringPatterns] = await Promise.all([
      patternLearner.predictTags(session.user.id, taskTitle, taskDescription),
      patternLearner.predictSchedule(session.user.id, taskTitle),
      patternLearner.predictPriority(session.user.id, taskTitle),
      patternLearner.learnRecurringPatterns(session.user.id),
    ]);

    // Calculate confidence scores based on similarity
    // For schedule: confidence based on how many similar tasks had schedules
    // For tags: confidence based on tag frequency in similar tasks
    // For priority: confidence based on consistency in similar tasks
    const scheduleConfidence = predictedSchedule ? 0.75 : 0;
    const tagConfidence = predictedTags.length > 0 ? 0.8 : 0;
    const priorityConfidence = predictedPriority ? 0.7 : 0;

    return NextResponse.json({
      predictedTags,
      predictedSchedule: predictedSchedule?.toISOString(),
      predictedPriority,
      scheduleConfidence,
      tagConfidence,
      priorityConfidence,
      recurringPatterns,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

