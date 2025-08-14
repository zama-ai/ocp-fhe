import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';
import { CompanyCreateData } from '@/lib/types/company';
import { isAddress } from 'viem';

// GET /api/companies - Get all companies
export async function GET() {
  try {
    const companies = await companyService.getAllCompanies();
    return NextResponse.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, founder, contractAddress } = body;

    if (!name || !founder || !contractAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, founder, contractAddress',
        },
        { status: 400 }
      );
    }

    if (!isAddress(founder) || !isAddress(contractAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    const companyData: CompanyCreateData = { name, founder, contractAddress };
    const company = await companyService.createCompany(companyData);

    return NextResponse.json({ success: true, data: company }, { status: 201 });
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    );
  }
}
