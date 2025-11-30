import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import BoardMember, { BoardPermission } from '@/lib/models/BoardMember';
import User from '@/lib/models/User';
import { canUserAccessBoard, getUserBoardPermission } from '@/lib/permissions/boardPermissions';
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

    const members = await BoardMember.find({ boardId: params.id })
      .populate('userId', 'name email image')
      .populate('invitedBy', 'name email')
      .sort({ permission: 1, joinedAt: -1 })
      .lean();

    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const { userId, email, permission } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'userId or email is required' },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // If email provided, find user by email
    if (!targetUserId && email) {
      const user = await User.findOne({ email });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      targetUserId = user._id.toString();
    }

    // Check if user is already a member
    const existingMember = await BoardMember.findOne({
      boardId: params.id,
      userId: targetUserId,
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this board' },
        { status: 400 }
      );
    }

    const member = await BoardMember.create({
      boardId: params.id,
      userId: targetUserId,
      permission: permission || BoardPermission.MEMBER,
      invitedBy: session.user.id,
    });

    const populatedMember = await BoardMember.findById(member._id)
      .populate('userId', 'name email image')
      .populate('invitedBy', 'name email')
      .lean();

    return NextResponse.json({ member: populatedMember }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

