import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { autocompleteEngine } from '@/lib/ml/autocomplete';
import { getSession } from '@/lib/api/getSession';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const context = searchParams.get('context');

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const contextObj = context ? JSON.parse(context) : undefined;
    const suggestions = await autocompleteEngine.getSmartSuggestions(
      session.user.id,
      query,
      contextObj
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

