'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isAddress } from 'viem';
import { useCreateRound, InvestorFormData } from '@/hooks/use-create-round';
import { useCompany } from '@/hooks/use-company';

// Treasury shares constant (founder's initial shares)
const TREASURY_SHARES = 10_000;

interface CreateRoundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRound: () => void;
  companyId: string;
  contractAddress: string;
}

export function CreateRoundModal({
  open,
  onOpenChange,
  onCreateRound,
  companyId,
  contractAddress,
}: CreateRoundModalProps) {
  const [roundName, setRoundName] = useState('');
  const [roundDate, setRoundDate] = useState('');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');
  const [investors, setInvestors] = useState<InvestorFormData[]>([
    { name: '', address: '', shares: '', pricePerShare: '' },
  ]);

  const {
    createRound,
    saveToDatabase,
    reset,
    step,
    isPending,
    isConfirming,
    isEncrypting,
    isSaving,
    isFhevmLoading,
    error,
    canProceed,
  } = useCreateRound(companyId, contractAddress);

  // Fetch company data to get total shares issued
  const {
    data: company,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useCompany(companyId);

  // Calculate total shares issued including founder's treasury shares and all previous rounds
  const calculateTotalSharesIssued = (): number => {
    if (!company || !company.rounds) return TREASURY_SHARES;

    const investorShares = company.rounds.reduce((total, round) => {
      return (
        total +
        round.investments.reduce((roundTotal, investment) => {
          return roundTotal + investment.shareAmount;
        }, 0)
      );
    }, 0);

    return TREASURY_SHARES + investorShares;
  };

  // Calculate fixed price per share based on total shares and pre-money valuation
  const calculateFixedPricePerShare = (): number => {
    const totalShares = calculateTotalSharesIssued();
    const preMoneyValue = parseFloat(preMoneyValuation) || 0;

    if (totalShares === 0 || preMoneyValue === 0) return 0;

    return preMoneyValue / totalShares;
  };

  // Calculate rounded price per share (integer) for on-chain storage
  const getRoundedPricePerShare = (): number => {
    const exactPrice = calculateFixedPricePerShare();
    return Math.round(exactPrice);
  };

  // Check if rounding occurred
  const isPriceRounded = (): boolean => {
    const exactPrice = calculateFixedPricePerShare();
    const roundedPrice = getRoundedPricePerShare();
    return exactPrice > 0 && Math.abs(exactPrice - roundedPrice) > 0.001;
  };

  // Effect to update all investors' price per share when pre-money valuation changes
  useEffect(() => {
    const roundedPrice = getRoundedPricePerShare();
    if (roundedPrice > 0) {
      const roundedPriceString = roundedPrice.toString();
      setInvestors(prevInvestors =>
        prevInvestors.map(investor => ({
          ...investor,
          pricePerShare: roundedPriceString,
        }))
      );
    }
  }, [preMoneyValuation, company]);

  const addInvestor = () => {
    const roundedPrice = getRoundedPricePerShare();
    const roundedPriceString = roundedPrice > 0 ? roundedPrice.toString() : '';

    setInvestors([
      ...investors,
      { name: '', address: '', shares: '', pricePerShare: roundedPriceString },
    ]);
  };

  const removeInvestor = (index: number) => {
    if (investors.length > 1) {
      setInvestors(investors.filter((_, i) => i !== index));
    }
  };

  const updateInvestor = (
    index: number,
    field: keyof InvestorFormData,
    value: string
  ) => {
    const updated = [...investors];
    updated[index] = { ...updated[index], [field]: value };
    setInvestors(updated);
  };

  const calculateInvestment = (
    shares: string,
    pricePerShare: string
  ): string => {
    const sharesNum = parseFloat(shares) || 0;
    const priceNum = parseFloat(pricePerShare) || 0;
    const investment = sharesNum * priceNum;
    return investment > 0
      ? `$${investment.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : '$0';
  };

  const calculateTotalInvestment = (): number => {
    return investors.reduce((total, investor) => {
      const shares = parseFloat(investor.shares) || 0;
      const pricePerShare = parseFloat(investor.pricePerShare) || 0;
      return total + shares * pricePerShare;
    }, 0);
  };

  const calculatePostMoneyValuation = (): number => {
    const preMoneyValue = parseFloat(preMoneyValuation) || 0;
    const totalInvestment = calculateTotalInvestment();
    return preMoneyValue + totalInvestment;
  };

  const formatCurrency = (amount: number): string => {
    return amount > 0
      ? `$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      : '$0';
  };

  const validateForm = (): string | null => {
    if (!roundName.trim()) return 'Round name is required';
    if (!roundDate) return 'Round date is required';
    if (!preMoneyValuation || parseFloat(preMoneyValuation) <= 0)
      return 'Pre-money valuation must be greater than 0';

    // Check if company data is loaded and if there are previous rounds
    if (isLoadingCompany) return 'Loading company data. Please wait...';
    if (companyError) return 'Error loading company data. Please try again.';

    for (let i = 0; i < investors.length; i++) {
      const investor = investors[i];
      if (!investor.name.trim()) return `Investor ${i + 1}: Name is required`;
      if (!investor.address.trim())
        return `Investor ${i + 1}: Address is required`;
      if (!isAddress(investor.address))
        return `Investor ${i + 1}: Invalid Ethereum address`;
      if (!investor.shares || parseFloat(investor.shares) <= 0)
        return `Investor ${i + 1}: Shares must be greater than 0`;
      if (!investor.pricePerShare || parseFloat(investor.pricePerShare) <= 0)
        return `Investor ${i + 1}: Price per share must be greater than 0`;
    }

    return null;
  };

  // Handle step progression and auto-save when ready
  useEffect(() => {
    if (step === 'saving') {
      saveToDatabase(roundName, roundDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Handle completion
  useEffect(() => {
    if (step === 'complete') {
      onCreateRound();
      toast.success(`Round "${roundName}" created successfully!`);
      handleReset();
      onOpenChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Error creating round:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create round. Please try again.'
      );
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!canProceed.encrypt) {
      toast.error(
        'FHEVM not ready. Please ensure your wallet is connected and try again.'
      );
      return;
    }

    try {
      await createRound({
        roundName: roundName.trim(),
        roundDate,
        investors,
        preMoneyValuationForm: preMoneyValuation,
      });
    } catch (error) {
      console.error('Error creating round:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create round. Please try again.'
      );
    }
  };

  const handleReset = () => {
    setRoundName('');
    setRoundDate('');
    setPreMoneyValuation('');
    setInvestors([{ name: '', address: '', shares: '', pricePerShare: '' }]);
    reset();
  };

  const handleCancel = () => {
    setRoundName('');
    setRoundDate('');
    setPreMoneyValuation('');
    setInvestors([{ name: '', address: '', shares: '', pricePerShare: '' }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Round</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Round Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roundName">Round Name</Label>
                <Input
                  id="roundName"
                  placeholder="e.g., Seed, Series A"
                  value={roundName}
                  onChange={e => setRoundName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roundDate">Round Date</Label>
                <Input
                  id="roundDate"
                  type="date"
                  value={roundDate}
                  onChange={e => setRoundDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="preMoneyValuation">Pre-Money Valuation ($)</Label>
              <Input
                id="preMoneyValuation"
                type="number"
                placeholder="e.g., 5000000"
                min="0"
                step="0.01"
                value={preMoneyValuation}
                onChange={e => setPreMoneyValuation(e.target.value)}
                required
              />
            </div>

            {/* Calculation Information */}
            {isLoadingCompany ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-700">
                  Loading company data...
                </span>
              </div>
            ) : companyError ? (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  Error loading company data. Price per share cannot be
                  calculated.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-900">
                      Founder Shares (Treasury):
                    </span>
                    <span className="text-sm font-mono text-blue-700">
                      {TREASURY_SHARES.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-900">
                      Previous Investment Shares:
                    </span>
                    <span className="text-sm font-mono text-blue-700">
                      {(
                        calculateTotalSharesIssued() - TREASURY_SHARES
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm font-semibold text-blue-900">
                      Total Outstanding Shares:
                    </span>
                    <span className="text-sm font-mono text-blue-700 font-semibold">
                      {calculateTotalSharesIssued().toLocaleString()}
                    </span>
                  </div>
                  {preMoneyValuation && parseFloat(preMoneyValuation) > 0 ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">
                          Calculated Price per Share:
                        </span>
                        <span className="text-sm font-mono text-blue-700 font-semibold">
                          ${getRoundedPricePerShare()}
                        </span>
                      </div>
                      {isPriceRounded() && (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200">
                          <p className="text-sm text-amber-700">
                            Exact share price would be $
                            {calculateFixedPricePerShare().toFixed(2)}. Rounded
                            to ${getRoundedPricePerShare()} (required for
                            on-chain storage). This may slightly change
                            post-money totals.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-zinc-600">
                      Enter pre-money valuation to calculate price per share
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Investors Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Investors</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInvestor}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Investor
              </Button>
            </div>

            {/* Investors Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-zinc-50 px-4 py-4 border-b">
                <div className="flex gap-4 text-sm font-medium text-zinc-600">
                  <div className="w-40">Investor Name</div>
                  <div className="flex-1 min-w-0">Ethereum Address</div>
                  <div className="w-20">Shares</div>
                  <div className="w-24">Price/Share</div>
                  <div className="w-28">Investment</div>
                  <div className="w-10"></div>
                </div>
              </div>

              <div className="divide-y">
                {investors.map((investor, index) => (
                  <div key={index} className="p-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-40">
                        <Input
                          placeholder="Investor name"
                          value={investor.name}
                          onChange={e =>
                            updateInvestor(index, 'name', e.target.value)
                          }
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="0x..."
                          value={investor.address}
                          onChange={e =>
                            updateInvestor(index, 'address', e.target.value)
                          }
                          className={`h-10 font-mono text-sm ${
                            investor.address && !isAddress(investor.address)
                              ? 'border-red-300'
                              : ''
                          }`}
                          required
                        />
                        {investor.address && !isAddress(investor.address) && (
                          <p className="text-xs text-red-600 mt-1">
                            Invalid Ethereum address
                          </p>
                        )}
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="0"
                          min="0"
                          step="1"
                          value={investor.shares}
                          onChange={e =>
                            updateInvestor(index, 'shares', e.target.value)
                          }
                          className="h-10"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          value={investor.pricePerShare}
                          readOnly
                          className="h-10 bg-zinc-50 text-zinc-600 cursor-not-allowed"
                          title="Price per share is automatically calculated based on pre-money valuation and total shares issued"
                        />
                      </div>
                      <div className="w-28 flex items-center h-10">
                        <span className="text-sm font-mono text-zinc-700 font-medium truncate">
                          {calculateInvestment(
                            investor.shares,
                            investor.pricePerShare
                          )}
                        </span>
                      </div>
                      <div className="w-10 flex justify-end items-center h-10">
                        {investors.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInvestor(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Round Summary */}
          <div className="bg-zinc-50 border rounded-lg p-4 space-y-3">
            <Label className="text-base font-semibold text-zinc-900">
              Round Summary
            </Label>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="text-sm text-zinc-600">
                  Total Amount Invested
                </div>
                <div className="text-xl font-semibold text-zinc-900 font-mono">
                  {formatCurrency(calculateTotalInvestment())}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-zinc-600">
                  Post-Money Valuation
                </div>
                <div className="text-xl font-semibold text-zinc-900 font-mono">
                  {formatCurrency(calculatePostMoneyValuation())}
                </div>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          {(isEncrypting || isPending || isConfirming || isSaving) && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <div className="text-sm">
                {isEncrypting && 'Encrypting investor data...'}
                {isPending && 'Waiting for transaction confirmation...'}
                {isConfirming && 'Transaction confirming...'}
                {isSaving && 'Saving round data...'}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isEncrypting || isPending || isConfirming || isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isEncrypting ||
                isPending ||
                isConfirming ||
                isSaving ||
                isFhevmLoading
              }
              className="min-w-[120px]"
            >
              {isEncrypting && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Encrypting...
                </>
              )}
              {isPending && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirming...
                </>
              )}
              {isConfirming && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              )}
              {isSaving && (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              )}
              {!isEncrypting &&
                !isPending &&
                !isConfirming &&
                !isSaving &&
                'Create Round'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
