import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import { getSession } from '@/lib/api/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get('parentId');

    const query: any = { userId: session.user.id };
    if (parentId === 'null' || parentId === '') {
      query.parentId = { $exists: false };
    } else if (parentId) {
      query.parentId = parentId;
    }

    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .lean();

    // Build hierarchy
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    categories.forEach((cat: any) => {
      categoryMap.set(cat._id.toString(), { ...cat, children: [] });
    });

    categories.forEach((cat: any) => {
      const category = categoryMap.get(cat._id.toString());
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId.toString());
        if (parent) {
          parent.children.push(category);
        } else {
          rootCategories.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    return NextResponse.json({ categories: rootCategories, flat: categories });
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
    const { name, parentId, color, icon, description, order } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await Category.create({
      name,
      userId: session.user.id,
      parentId: parentId || undefined,
      color: color || '#3B82F6',
      icon,
      description,
      order: order || 0,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

