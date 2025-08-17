'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAccount } from '@/hooks/wagmi-viem-proxy/use-account';
import { Plus, Loader2, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateCompanyFlow } from '@/hooks/use-companies';
import { toast } from 'sonner';

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
});

type CreateCompanyForm = z.infer<typeof createCompanySchema>;

export function CreateCompanyModal() {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const { address } = useAccount();
  const companyFlow = useCreateCompanyFlow();

  const form = useForm<CreateCompanyForm>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
    },
  });

  // Handle step transitions and auto-save
  useEffect(() => {
    if (companyFlow.step === 'saving' && companyName) {
      companyFlow.saveToDatabase(companyName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFlow.step, companyName]);

  // Handle completion
  useEffect(() => {
    if (companyFlow.step === 'complete') {
      console.log('Company created:', companyFlow);
      toast.success('Company created successfully!');
      form.reset();
      setCompanyName('');
      setOpen(false);
      companyFlow.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFlow.step]);

  // Handle errors
  useEffect(() => {
    if (companyFlow.error) {
      toast.error(
        companyFlow.error instanceof Error
          ? companyFlow.error.message
          : 'Failed to create company'
      );
    }
  }, [companyFlow.error]);

  const onSubmit = async (data: CreateCompanyForm) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setCompanyName(data.name);
      await companyFlow.createCompany(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create company'
      );
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Always allow opening
      setOpen(true);
    } else {
      // Only allow closing when idle
      if (companyFlow.step === 'idle') {
        setOpen(false);
        form.reset();
        setCompanyName('');
        companyFlow.reset();
      }
    }
  };

  const isLoading = companyFlow.step !== 'idle';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Create a new company cap table on-chain. This will deploy a new
            smart contract.
          </DialogDescription>
        </DialogHeader>

        {companyFlow.step === 'idle' && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company name"
                        {...field}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2">
                  Create Company
                </Button>
              </div>
            </form>
          </Form>
        )}

        {companyFlow.step === 'contract' && (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Creating Company Contract
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {companyFlow.isPending &&
                  'Waiting for transaction confirmation...'}
                {companyFlow.isConfirming &&
                  'Transaction confirmed, waiting for contract deployment...'}
              </p>
              {companyFlow.hash && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span>Transaction:</span>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${companyFlow.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {companyFlow.hash.slice(0, 10)}...
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {companyFlow.step === 'saving' && (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Saving Company Data
              </h3>
              <p className="text-sm text-muted-foreground">
                Contract deployed successfully! Saving company information...
              </p>
              {companyFlow.contractAddress && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-800">
                    Contract Address: {companyFlow.contractAddress.slice(0, 10)}
                    ...
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
