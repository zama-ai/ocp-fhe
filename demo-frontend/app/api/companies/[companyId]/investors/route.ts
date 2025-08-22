import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';
import { isAddress } from 'viem';

// GET /api/companies/[companyId]/investors - Get company investors
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const company = await companyService.getCompanyById(companyId);

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company.investors,
    });
  } catch (error) {
    console.error('Error getting company investors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get company investors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/companies/[companyId]/investors - Add investor to last round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await request.json();
    const { address, name, shareAmount, sharePrice } = body;

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Investor address is required' },
        { status: 400 }
      );
    }

    if (!isAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    if (typeof shareAmount !== 'number' || shareAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid share amount is required' },
        { status: 400 }
      );
    }

    if (typeof sharePrice !== 'number' || sharePrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid share price is required' },
        { status: 400 }
      );
    }

    const investor = { address, name };
    const company = await companyService.addInvestorToLastRound(
      companyId,
      investor,
      shareAmount,
      sharePrice
    );

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    console.error('Error adding investor:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to add investor to last round' },
      { status: 500 }
    );
  }
}
