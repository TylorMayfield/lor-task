import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Board from '@/lib/models/Board';
import { getUserBoardPermission, canUserAccessBoard } from '@/lib/permissions/boardPermissions';
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

    const hasAccess = await canUserAccessBoard(session.user.id, params.id, 'view');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const board = await Board.findById(params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    const userPermission = await getUserBoardPermission(session.user.id, params.id);

    return NextResponse.json({ board, userPermission });
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

    const hasAccess = await canUserAccessBoard(session.user.id, params.id, 'edit');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const board = await Board.findById(params.id);

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    Object.assign(board, body);
    await board.save();

    const populatedBoard = await Board.findById(board._id)
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ board: populatedBoard });
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

    const hasAccess = await canUserAccessBoard(session.user.id, params.id, 'delete');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const board = await Board.findById(params.id);

    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Only owner can delete
    if (board.createdBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Only board owner can delete' }, { status: 403 });
    }

    await Board.deleteOne({ _id: params.id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

