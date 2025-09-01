import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';

interface RouteParams {
  params: Promise<{
    companyId: string;
    roundId: string;
  }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { companyId, roundId } = await params;
    const body = await request.json();
    const { isPubliclyVisible, founderAddress } = body;

    // Validate required fields
    if (typeof isPubliclyVisible !== 'boolean') {
      return NextResponse.json(
        { error: 'isPubliclyVisible must be a boolean' },
        { status: 400 }
      );
    }

    if (!founderAddress) {
      return NextResponse.json(
        { error: 'founderAddress is required' },
        { status: 400 }
      );
    }

    // Get the company to verify ownership
    const company = await companyService.getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Verify that the requester is the company founder
    if (company.founder.toLowerCase() !== founderAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only company founder can change round visibility' },
        { status: 403 }
      );
    }

    // Update round visibility
    const updatedCompany = await companyService.updateRoundVisibility(
      companyId,
      roundId,
      isPubliclyVisible
    );

    return NextResponse.json({
      success: true,
      company: updatedCompany,
    });
  } catch (error) {
    console.error('Error updating round visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update round visibility' },
      { status: 500 }
    );
  }
}
