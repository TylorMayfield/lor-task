import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Board from '@/lib/models/Board';
import BoardMember, { BoardPermission } from '@/lib/models/BoardMember';
import { getUserBoards } from '@/lib/permissions/boardPermissions';
import { getSession } from '@/lib/api/getSession';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const boards = await getUserBoards(session.user.id);

    return NextResponse.json({ boards });
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
    const { name, description, color, isPublic } = body;

    if (!name) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const board = await Board.create({
      name,
      description,
      color: color || '#3B82F6',
      isPublic: isPublic || false,
      createdBy: session.user.id,
    });

    // Automatically add creator as owner member
    await BoardMember.create({
      boardId: board._id,
      userId: session.user.id,
      permission: BoardPermission.OWNER,
      invitedBy: session.user.id,
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({ board: populatedBoard }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

