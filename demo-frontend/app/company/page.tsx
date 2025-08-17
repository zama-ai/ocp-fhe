'use client';

import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { useRoleStore } from '@/stores/role-store';
import { useCompanies, useFounderCompanies } from '@/hooks/use-companies';
import { CreateCompanyModal } from '@/components/create-company-modal';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, AlertCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

const DynamicCompanyCard = dynamic(
  () => import('@/components/company-card').then(mod => mod.CompanyCard),
  {
    ssr: false,
  }
);

export default function CompaniesPage() {
  const { role } = useRoleStore();
  const { address, isConnected } = useAccount();

  const {
    data: allCompanies,
    isLoading: isLoadingAll,
    error: allCompaniesError,
  } = useCompanies();

  const {
    data: founderCompanies,
    isLoading: isLoadingFounder,
    error: founderCompaniesError,
  } = useFounderCompanies(role === 'FOUNDER' && address ? address : undefined);

  // Loading skeleton component
  const CompanyCardSkeleton = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-5 w-12" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-4 w-24 mt-3" />
      </CardContent>
    </Card>
  );

  // Error component
  const ErrorAlert = ({ error }: { error: Error }) => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {error.message || 'An error occurred while loading companies'}
      </AlertDescription>
    </Alert>
  );

  // Check if user has invested in a company
  const hasInvestment = (companyId: string) => {
    if (!address || role !== 'INVESTOR') return false;
    const company = allCompanies?.find(c => c.id === companyId);
    return (
      company?.investors.some(
        investor => investor.address.toLowerCase() === address.toLowerCase()
      ) || false
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground mt-1">
            Explore companies and their funding rounds
          </p>
        </div>
      </div>

      {/* My Companies Section - Only for FOUNDER role */}
      {role === 'FOUNDER' && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold">My Companies</h2>
              <p className="text-muted-foreground">
                Companies you have founded and manage
              </p>
            </div>
            {isConnected && <CreateCompanyModal />}
          </div>

          {!isConnected ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please connect your wallet to view and manage your companies.
              </AlertDescription>
            </Alert>
          ) : founderCompaniesError ? (
            <ErrorAlert error={founderCompaniesError as Error} />
          ) : isLoadingFounder ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <CompanyCardSkeleton key={i} />
              ))}
            </div>
          ) : founderCompanies && founderCompanies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {founderCompanies.map(company => (
                <DynamicCompanyCard
                  key={company.id}
                  company={company}
                  isOwner={true}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first company to start managing cap tables and
                funding rounds.
              </p>
              <CreateCompanyModal />
            </Card>
          )}
        </div>
      )}

      {/* All Companies Section */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold">
            {role === 'FOUNDER' ? 'All Companies' : 'Companies'}
          </h2>
          <p className="text-muted-foreground">
            Browse all companies and their public information
          </p>
        </div>

        {allCompaniesError ? (
          <ErrorAlert error={allCompaniesError as Error} />
        ) : isLoadingAll ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CompanyCardSkeleton key={i} />
            ))}
          </div>
        ) : allCompanies && allCompanies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allCompanies.map(company => (
              <DynamicCompanyCard
                key={company.id}
                company={company}
                isOwner={
                  address?.toLowerCase() === company.founder.toLowerCase()
                }
                hasInvestment={hasInvestment(company.id)}
              />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No companies found</h3>
            <p className="text-muted-foreground">
              No companies have been created yet. Be the first to create one!
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
