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
    const { type, date, round_id, preMoneyValuation, investments } = body;

    // Validation
    if (!type || !date || !round_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: type, date, round_id',
        },
        { status: 400 }
      );
    }

    // Validate round_id format (should be a hex string)
    if (typeof round_id !== 'string' || !round_id.startsWith('0x')) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Invalid round_id format. Must be a hex string starting with 0x',
        },
        { status: 400 }
      );
    }

    // Validate preMoneyValuation if provided
    if (
      preMoneyValuation !== undefined &&
      (typeof preMoneyValuation !== 'number' || preMoneyValuation < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid preMoneyValuation. Must be a non-negative number',
        },
        { status: 400 }
      );
    }

    // Validate investments if provided
    if (investments && Array.isArray(investments)) {
      for (let i = 0; i < investments.length; i++) {
        const investment = investments[i];
        if (!investment.investor || !investment.investor.address || !isAddress(investment.investor.address)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid investor address at index ${i}`,
            },
            { status: 400 }
          );
        }
        if (typeof investment.shareAmount !== 'number' || investment.shareAmount <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid share amount at index ${i}. Must be a positive number`,
            },
            { status: 400 }
          );
        }
        if (typeof investment.sharePrice !== 'number' || investment.sharePrice <= 0) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid share price at index ${i}. Must be a positive number`,
            },
            { status: 400 }
          );
        }
        // Validate security ID if provided (should be a hex string)
        if (investment.investor.securityId && typeof investment.investor.securityId !== 'string') {
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
      round_id,
      preMoneyValuation,
      investments: investments || [],
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
