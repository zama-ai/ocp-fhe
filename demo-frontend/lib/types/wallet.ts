export interface PredefinedWallet {
  id: string;
  name: string;
  company: string;
  role: 'FOUNDER' | 'INVESTOR' | 'PUBLIC' | 'ADMIN';
  privateKey: string;
  address: string;
  icon: string; // We'll use lucide icons
}

export interface WalletState {
  selectedWallet: PredefinedWallet | null;
  isOwnWallet: boolean;
}
