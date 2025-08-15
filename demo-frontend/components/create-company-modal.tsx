'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';
import { Plus, Loader2 } from 'lucide-react';

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
import { useCreateCompany } from '@/hooks/use-companies';
import { toast } from 'sonner';

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  contractAddress: z
    .string()
    .min(1, 'Contract address is required')
    .refine(isAddress, 'Invalid Ethereum address format'),
});

type CreateCompanyForm = z.infer<typeof createCompanySchema>;

export function CreateCompanyModal() {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  const createCompanyMutation = useCreateCompany();

  const form = useForm<CreateCompanyForm>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      name: '',
      contractAddress: '',
    },
  });

  const onSubmit = async (data: CreateCompanyForm) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      await createCompanyMutation.mutateAsync({
        name: data.name,
        founder: address,
        contractAddress: data.contractAddress,
      });

      toast.success('Company created successfully!');
      form.reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create company'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Company</DialogTitle>
          <DialogDescription>
            Create a new company to manage cap table and funding rounds.
          </DialogDescription>
        </DialogHeader>

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
                      disabled={createCompanyMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contract Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      disabled={createCompanyMutation.isPending}
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
                onClick={() => setOpen(false)}
                disabled={createCompanyMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCompanyMutation.isPending}
                className="gap-2"
              >
                {createCompanyMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create Company
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
