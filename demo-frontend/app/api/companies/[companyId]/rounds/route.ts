import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';
import { RoundCreateData } from '@/lib/types/company';
import { isAddress } from 'viem';

// GET /api/companies/[companyId]/rounds - Get company rounds
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
      data: company.rounds,
    });
  } catch (error) {
    console.error('Error getting company rounds:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get company rounds',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/companies/[companyId]/rounds - Add a new round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await request.json();
    const { type, date, investors } = body;

    // Validation
    if (!type || !date) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, date',
        },
        { status: 400 }
      );
    }

    // Validate investors if provided
    if (investors && Array.isArray(investors)) {
      for (let i = 0; i < investors.length; i++) {
        const investor = investors[i];
        if (!investor.address || !isAddress(investor.address)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid investor address at index ${i}`,
            },
            { status: 400 }
          );
        }
        // Validate security ID if provided (should be a hex string)
        if (investor.securityId && typeof investor.securityId !== 'string') {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid security ID format at index ${i}`,
            },
            { status: 400 }
          );
        }
      }
    }

    const roundData: RoundCreateData = {
      type,
      date,
      investors: investors || [],
    };

    const company = await companyService.addRound(companyId, roundData);

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error('Error adding round:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add round',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
