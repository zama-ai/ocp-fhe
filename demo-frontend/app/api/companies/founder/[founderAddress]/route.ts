import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';
import { isAddress } from 'viem';

// GET /api/companies/founder/[founderAddress] - Get companies by founder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ founderAddress: string }> }
) {
  try {
    const { founderAddress } = await params;

    if (!founderAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Founder address is required',
        },
        { status: 400 }
      );
    }

    // Basic Ethereum address validation
    if (!isAddress(founderAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Ethereum address format',
        },
        { status: 400 }
      );
    }

    const companies =
      await companyService.getCompaniesByFounder(founderAddress);

    return NextResponse.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    console.error('Error getting companies by founder:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get companies by founder',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
