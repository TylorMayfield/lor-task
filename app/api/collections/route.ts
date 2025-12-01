import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/api/getSession';
import connectDB from '@/lib/mongodb';
import Collection from '@/lib/models/Collection';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const collections = await Collection.find({ userId: session.user.id })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ collections });
  } catch (error: any) {
    console.error('Failed to fetch collections:', error);
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
    const { name, description, color, icon, filterCriteria, parentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Collection name is required' }, { status: 400 });
    }

    // Get the highest order number to place new collection at the end
    const lastCollection = await Collection.findOne({ userId: session.user.id })
      .sort({ order: -1 })
      .lean();
    const order = lastCollection ? (lastCollection.order || 0) + 1 : 0;

    const collection = await Collection.create({
      name: name.trim(),
      userId: session.user.id,
      description: description?.trim(),
      color: color || '#3B82F6',
      icon: icon || 'Folder',
      filterCriteria: filterCriteria || {},
      parentId: parentId || undefined,
      order,
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create collection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

