import connectDB from '../mongodb';
import Board from '../models/Board';
import BoardMember, { BoardPermission } from '../models/BoardMember';

export interface UserPermission {
  permission: BoardPermission | null;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canManageMembers: boolean;
}

/**
 * Get user's permission for a board
 */
export async function getUserBoardPermission(
  userId: string,
  boardId: string
): Promise<UserPermission> {
  await connectDB();

  const board = await Board.findById(boardId).lean();
  if (!board) {
    return {
      permission: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
      isViewer: false,
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
    };
  }

  // Check if user is the board owner
  if (board.createdBy.toString() === userId) {
    return {
      permission: BoardPermission.OWNER,
      isOwner: true,
      isAdmin: true,
      isMember: true,
      isViewer: true,
      canEdit: true,
      canDelete: true,
      canManageMembers: true,
    };
  }

  // Check board membership
  const membership = await BoardMember.findOne({
    boardId,
    userId,
  }).lean();

  if (!membership) {
    // Check if board is public
    if (board.isPublic) {
      return {
        permission: BoardPermission.VIEWER,
        isOwner: false,
        isAdmin: false,
        isMember: false,
        isViewer: true,
        canEdit: false,
        canDelete: false,
        canManageMembers: false,
      };
    }
    return {
      permission: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
      isViewer: false,
      canEdit: false,
      canDelete: false,
      canManageMembers: false,
    };
  }

  const permission = membership.permission;
  const isAdmin = permission === BoardPermission.ADMIN || permission === BoardPermission.OWNER;
  const isMember = isAdmin || permission === BoardPermission.MEMBER;
  const isViewer = isMember || permission === BoardPermission.VIEWER;

  return {
    permission,
    isOwner: false,
    isAdmin,
    isMember,
    isViewer,
    canEdit: isMember,
    canDelete: isAdmin,
    canManageMembers: isAdmin,
  };
}

/**
 * Check if user can perform an action on a board
 */
export async function canUserAccessBoard(
  userId: string,
  boardId: string,
  requiredPermission: 'view' | 'edit' | 'delete' | 'manage'
): Promise<boolean> {
  const userPermission = await getUserBoardPermission(userId, boardId);

  switch (requiredPermission) {
    case 'view':
      return userPermission.isViewer;
    case 'edit':
      return userPermission.canEdit;
    case 'delete':
      return userPermission.canDelete;
    case 'manage':
      return userPermission.canManageMembers;
    default:
      return false;
  }
}

/**
 * Get all boards a user has access to
 */
export async function getUserBoards(userId: string): Promise<any[]> {
  await connectDB();

  // Get boards user created
  const ownedBoards = await Board.find({ createdBy: userId }).lean();

  // Get boards user is a member of
  const memberships = await BoardMember.find({ userId })
    .populate('boardId')
    .lean();

  // Get public boards user is not a member of
  const publicBoards = await Board.find({
    isPublic: true,
    createdBy: { $ne: userId },
    _id: { $nin: memberships.map((m: any) => m.boardId?._id || m.boardId) },
  }).lean();

  // Combine and format
  const allBoards = [
    ...ownedBoards.map((b) => ({ ...b, permission: BoardPermission.OWNER })),
    ...memberships.map((m: any) => ({
      ...(m.boardId || {}),
      permission: m.permission,
    })),
    ...publicBoards.map((b) => ({ ...b, permission: BoardPermission.VIEWER })),
  ];

  return allBoards;
}

/**
 * Check if user can perform action on a task (considering board permissions)
 */
export async function canUserAccessTask(
  userId: string,
  task: any
): Promise<{ canView: boolean; canEdit: boolean; canDelete: boolean }> {
  // If task has no board, check if user owns it
  if (!task.boardId) {
    return {
      canView: task.userId.toString() === userId,
      canEdit: task.userId.toString() === userId,
      canDelete: task.userId.toString() === userId,
    };
  }

  // Check board permissions
  const boardPermission = await getUserBoardPermission(userId, task.boardId.toString());

  return {
    canView: boardPermission.isViewer || task.userId.toString() === userId,
    canEdit: boardPermission.canEdit || task.userId.toString() === userId,
    canDelete: boardPermission.canDelete || task.userId.toString() === userId,
  };
}

