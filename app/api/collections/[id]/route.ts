import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/api/getSession';
import connectDB from '@/lib/mongodb';
import Collection from '@/lib/models/Collection';

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

    const collection = await Collection.findOne({
      _id: params.id,
      userId: session.user.id,
    }).lean();

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error: any) {
    console.error('Failed to fetch collection:', error);
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
    const { name, description, color, icon, filterCriteria, order, parentId } = body;

    const collection = await Collection.findOneAndUpdate(
      { _id: params.id, userId: session.user.id },
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(filterCriteria !== undefined && { filterCriteria }),
        ...(order !== undefined && { order }),
        ...(parentId !== undefined && { parentId: parentId || null }),
      },
      { new: true }
    ).lean();

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ collection });
  } catch (error: any) {
    console.error('Failed to update collection:', error);
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

    const collection = await Collection.findOneAndDelete({
      _id: params.id,
      userId: session.user.id,
    });

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete collection:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

