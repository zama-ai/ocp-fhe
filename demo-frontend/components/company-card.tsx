import Link from 'next/link';
import { Company } from '@/lib/types/company';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useFhevm } from '@/hooks/use-fhevm';

interface CompanyCardProps {
  company: Company;
  isOwner?: boolean;
  hasInvestment?: boolean;
  className?: string;
}

export function CompanyCard({
  company,
  isOwner = false,
  hasInvestment = false,
  className,
}: CompanyCardProps) {
  // Calculate total amount raised (mock calculation since we don't have actual amounts)
  const totalRounds = company.rounds.length;
  const totalInvestors = company.investors.length;

  //   const { data: fhevmInstance } = useFhevm();

  // Format founder address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Link href={`/company/${company.id}`}>
      <Card
        className={cn(
          'hover:shadow-md transition-shadow cursor-pointer group',
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg group-hover:text-primary transition-colors">
                {company.name}
              </CardTitle>
              <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{formatAddress(company.founder)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {isOwner && (
                <Badge variant="default" className="text-xs">
                  Owner
                </Badge>
              )}
              {hasInvestment && (
                <Badge variant="secondary" className="text-xs">
                  Invested
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{totalRounds}</div>
                <div className="text-xs text-muted-foreground">
                  {totalRounds === 1 ? 'Round' : 'Rounds'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{totalInvestors}</div>
                <div className="text-xs text-muted-foreground">
                  {totalInvestors === 1 ? 'Investor' : 'Investors'}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
            Created {new Date(company.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
