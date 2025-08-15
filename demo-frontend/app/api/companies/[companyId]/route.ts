import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';

// GET /api/companies/[companyId] - Get company by ID (Ethereum address)
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
      data: company,
    });
  } catch (error) {
    console.error('Error getting company by ID:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get company',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
