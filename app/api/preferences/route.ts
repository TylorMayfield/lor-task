import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserPreferences from '@/lib/models/UserPreferences';
import { getSession } from '@/lib/api/getSession';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let preferences = await UserPreferences.findOne({ userId: session.user.id }).lean();

    if (!preferences) {
      // Create default preferences
      preferences = (await UserPreferences.create({
        userId: session.user.id,
      })).toObject() as any;
    }

    return NextResponse.json({ preferences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();

    let preferences = await UserPreferences.findOne({ userId: session.user.id });

    if (!preferences) {
      preferences = await UserPreferences.create({
        userId: session.user.id,
        ...body,
      });
    } else {
      Object.assign(preferences, body);
      await preferences.save();
    }

    return NextResponse.json({ preferences });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

