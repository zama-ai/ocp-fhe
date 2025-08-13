import { NextRequest, NextResponse } from 'next/server';
import { companyService } from '@/lib/services/companyService';

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
                    error: 'Company not found'
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: company.investors
        });
    } catch (error) {
        console.error('Error getting company investors:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to get company investors',
                message: error instanceof Error ? error.message : 'Unknown error'
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
        const { address, name } = body;

        if (!address) {
            return NextResponse.json(
                { success: false, error: 'Investor address is required' },
                { status: 400 }
            );
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json(
                { success: false, error: 'Invalid Ethereum address format' },
                { status: 400 }
            );
        }

        const investor = { address, name };
        const company = await companyService.addInvestorToLastRound(companyId, investor);

        return NextResponse.json({ success: true, data: company });
    } catch (error) {
        console.error('Error adding investor:', error);

        return NextResponse.json(
            { success: false, error: 'Failed to add investor to last round' },
            { status: 500 }
        );
    }
}
