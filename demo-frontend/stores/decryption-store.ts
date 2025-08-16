import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DecryptedData {
  quantity: number;
  sharePrice: number;
  investment: number; // calculated: quantity * sharePrice
  timestamp: number; // when decrypted
}

interface DecryptionState {
  // Key format: `${companyAddress}:${securityId}`
  decryptedSecurities: Record<string, DecryptedData>;

  // Loading states - Key format: `${companyAddress}:${securityId}`
  loadingDecryption: Record<string, boolean>;

  // Actions
  setDecryptedData: (
    companyAddress: string,
    securityId: string,
    data: DecryptedData
  ) => void;
  setLoading: (
    companyAddress: string,
    securityId: string,
    loading: boolean
  ) => void;
  clearDecryptedData: (companyAddress: string, securityId?: string) => void;
  clearAllDecryptedData: () => void;
  isDecrypted: (companyAddress: string, securityId: string) => boolean;
  isLoading: (companyAddress: string, securityId: string) => boolean;
  getDecryptedData: (
    companyAddress: string,
    securityId: string
  ) => DecryptedData | null;
}

const generateKey = (companyAddress: string, securityId: string): string =>
  `${companyAddress.toLowerCase()}:${securityId}`;

export const useDecryptionStore = create<DecryptionState>()(
  persist(
    (set, get) => ({
      decryptedSecurities: {},
      loadingDecryption: {},

      setDecryptedData: (
        companyAddress: string,
        securityId: string,
        data: DecryptedData
      ) => {
        const key = generateKey(companyAddress, securityId);
        set(state => ({
          decryptedSecurities: {
            ...state.decryptedSecurities,
            [key]: data,
          },
        }));
      },

      setLoading: (
        companyAddress: string,
        securityId: string,
        loading: boolean
      ) => {
        const key = generateKey(companyAddress, securityId);
        set(state => ({
          loadingDecryption: {
            ...state.loadingDecryption,
            [key]: loading,
          },
        }));
      },

      clearDecryptedData: (companyAddress: string, securityId?: string) => {
        if (securityId) {
          // Clear specific security
          const key = generateKey(companyAddress, securityId);
          set(state => {
            const newDecrypted = { ...state.decryptedSecurities };
            const newLoading = { ...state.loadingDecryption };
            delete newDecrypted[key];
            delete newLoading[key];
            return {
              decryptedSecurities: newDecrypted,
              loadingDecryption: newLoading,
            };
          });
        } else {
          // Clear all securities for this company
          const companyPrefix = companyAddress.toLowerCase();
          set(state => {
            const newDecrypted = { ...state.decryptedSecurities };
            const newLoading = { ...state.loadingDecryption };

            Object.keys(newDecrypted).forEach(key => {
              if (key.startsWith(companyPrefix)) {
                delete newDecrypted[key];
              }
            });

            Object.keys(newLoading).forEach(key => {
              if (key.startsWith(companyPrefix)) {
                delete newLoading[key];
              }
            });

            return {
              decryptedSecurities: newDecrypted,
              loadingDecryption: newLoading,
            };
          });
        }
      },

      clearAllDecryptedData: () => {
        set(() => ({
          decryptedSecurities: {},
          loadingDecryption: {},
        }));
      },

      isDecrypted: (companyAddress: string, securityId: string): boolean => {
        const key = generateKey(companyAddress, securityId);
        return !!get().decryptedSecurities[key];
      },

      isLoading: (companyAddress: string, securityId: string): boolean => {
        const key = generateKey(companyAddress, securityId);
        return !!get().loadingDecryption[key];
      },

      getDecryptedData: (
        companyAddress: string,
        securityId: string
      ): DecryptedData | null => {
        const key = generateKey(companyAddress, securityId);
        return get().decryptedSecurities[key] || null;
      },
    }),
    {
      name: 'decryption-store', // localStorage key
      // Only persist decrypted data, not loading states
      partialize: state => ({
        decryptedSecurities: state.decryptedSecurities,
      }),
    }
  )
);
