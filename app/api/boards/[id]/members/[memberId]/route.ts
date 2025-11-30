import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BoardMember, { BoardPermission } from '@/lib/models/BoardMember';
import Board from '@/lib/models/Board';
import { canUserAccessBoard } from '@/lib/permissions/boardPermissions';
import { getSession } from '@/lib/api/getSession';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const hasAccess = await canUserAccessBoard(session.user.id, params.id, 'manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { permission } = body;

    if (!permission || !Object.values(BoardPermission).includes(permission)) {
      return NextResponse.json({ error: 'Invalid permission' }, { status: 400 });
    }

    const member = await BoardMember.findOne({
      _id: params.memberId,
      boardId: params.id,
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent changing owner permission
    if (member.permission === BoardPermission.OWNER) {
      return NextResponse.json(
        { error: 'Cannot change owner permission' },
        { status: 400 }
      );
    }

    // Only owner can assign owner permission
    const board = await Board.findById(params.id);
    if (permission === BoardPermission.OWNER && board?.createdBy.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Only board owner can assign owner permission' },
        { status: 403 }
      );
    }

    member.permission = permission;
    await member.save();

    const populatedMember = await BoardMember.findById(member._id)
      .populate('userId', 'name email image')
      .populate('invitedBy', 'name email')
      .lean();

    return NextResponse.json({ member: populatedMember });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const hasAccess = await canUserAccessBoard(session.user.id, params.id, 'manage');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const member = await BoardMember.findOne({
      _id: params.memberId,
      boardId: params.id,
    });

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Prevent removing owner
    if (member.permission === BoardPermission.OWNER) {
      return NextResponse.json(
        { error: 'Cannot remove board owner' },
        { status: 400 }
      );
    }

    // Allow users to remove themselves
    if (member.userId.toString() === session.user.id) {
      await BoardMember.deleteOne({ _id: params.memberId });
      return NextResponse.json({ success: true });
    }

    // Only admins/owners can remove others
    await BoardMember.deleteOne({ _id: params.memberId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

