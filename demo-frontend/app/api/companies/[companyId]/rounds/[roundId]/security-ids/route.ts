import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';

// GET /api/companies/[companyId]/rounds/[roundId]/security-ids - Get security IDs for a specific round
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; roundId: string }> }
) {
  try {
    const { companyId, roundId } = await params;

    // Verify the company exists
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

    // Verify the round exists in the company
    const round = company.rounds.find(r => r.id === roundId);
    if (!round) {
      return NextResponse.json(
        {
          success: false,
          error: 'Round not found',
        },
        { status: 404 }
      );
    }

    // Get security IDs for the round
    const securityIds = await companyService.getRoundSecurityIds(roundId);

    return NextResponse.json({
      success: true,
      data: {
        roundId,
        roundType: round.type,
        roundDate: round.date,
        securityIds,
        investmentCount: securityIds.length,
      },
    });
  } catch (error) {
    console.error('Error getting round security IDs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get round security IDs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
