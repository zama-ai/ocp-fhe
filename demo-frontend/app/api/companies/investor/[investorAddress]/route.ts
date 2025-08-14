import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';
import { isAddress } from 'viem';

// GET /api/companies/investor/[investorAddress] - Get companies by investor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ investorAddress: string }> }
) {
  try {
    const { investorAddress } = await params;

    if (!investorAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Investor address is required',
        },
        { status: 400 }
      );
    }

    // Basic Ethereum address validation
    if (!isAddress(investorAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format',
        },
        { status: 400 }
      );
    }

    const companies =
      await companyService.getCompaniesByInvestor(investorAddress);

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Error getting companies by investor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get companies by investor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
