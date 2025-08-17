import {
  Building2,
  User,
  Briefcase,
  TrendingUp,
  Globe,
  Shield,
} from 'lucide-react';
import type { PredefinedWallet } from '@/lib/types/wallet';

// Helper function to get private key from environment variables
const getPrivateKey = (privateKey?: string): string => {
  if (!privateKey) {
    console.warn(
      `Private key not found for wallet. Environment variable is missing.`
    );
    return '';
  }

  return privateKey;
};

export const PREDEFINED_WALLETS: PredefinedWallet[] = [
  {
    id: 'founder-acme',
    name: 'Founder',
    company: 'Acme Inc',
    role: 'FOUNDER',
    privateKey: getPrivateKey(
      process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY_FOUNDER_ACME
    ),
    address: '0x69b13244B819F4C55A91ceD689b609754dc11577',
    icon: 'Building2',
  },
  {
    id: 'investor-angel',
    name: 'Investor',
    company: 'Angel M.',
    role: 'INVESTOR',
    privateKey: getPrivateKey(
      process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY_INVESTOR_ANGEL
    ),
    address: '0xB317dA007E2645174Fcad7887aDd3e69de9dAeE7',
    icon: 'User',
  },
  {
    id: 'investor-beta',
    name: 'Investor',
    company: 'Beta Fund',
    role: 'INVESTOR',
    privateKey: getPrivateKey(
      process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY_INVESTOR_BETA
    ),
    address: '0x265f8798D8f4CDEba76DEcAC93Ccf6975312ADe2',
    icon: 'Briefcase',
  },
  {
    id: 'investor-charlie',
    name: 'Investor',
    company: 'Charlie Strategy',
    role: 'INVESTOR',
    privateKey: getPrivateKey(
      process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY_INVESTOR_CHARLIE
    ),
    address: '0xB41e922CC090Db4A1b01Cb3DfDb39cc7f4653803',
    icon: 'TrendingUp',
  },
  {
    id: 'public',
    name: 'Public',
    company: 'Anonymous',
    role: 'PUBLIC',
    privateKey: getPrivateKey(
      process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY_PUBLIC
    ),
    address: '0x8CB352C920eD2fE32e0e3f774A98A82CAA0d4ba0',
    icon: 'Globe',
  },
  {
    id: 'admin',
    name: 'Admin',
    company: 'System',
    role: 'ADMIN',
    privateKey: getPrivateKey(process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY_ADMIN),
    address: '0x782E9f5336d64493E059Ff539b3dB51fd173275F',
    icon: 'Shield',
  },
];

export const getWalletIcon = (iconName: string) => {
  const icons = {
    Building2,
    User,
    Briefcase,
    TrendingUp,
    Globe,
    Shield,
  };
  return icons[iconName as keyof typeof icons] || User;
};
