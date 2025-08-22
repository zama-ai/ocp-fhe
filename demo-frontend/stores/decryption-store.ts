import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DecryptedData {
  quantity: number;
  sharePrice: number;
  investment: number; // calculated: quantity * sharePrice
  timestamp: number; // when decrypted
}

export interface DecryptedRoundData {
  preMoneyValuation: number;
  totalAmount: number;
  postMoneyValuation: number; // calculated: preMoneyValuation + totalAmount
  timestamp: number; // when decrypted
}

interface DecryptionState {
  // Key format: `${companyAddress}:${securityId}`
  decryptedSecurities: Record<string, DecryptedData>;

  // Key format: `${companyAddress}:round:${roundId}`
  decryptedRounds: Record<string, DecryptedRoundData>;

  // Loading states - Key format: `${companyAddress}:${securityId}`
  loadingDecryption: Record<string, boolean>;

  // Loading states for rounds - Key format: `${companyAddress}:round:${roundId}`
  loadingRoundDecryption: Record<string, boolean>;

  // Actions for securities
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

  // Actions for rounds
  setDecryptedRoundData: (
    companyAddress: string,
    roundId: string,
    data: DecryptedRoundData
  ) => void;
  setRoundLoading: (
    companyAddress: string,
    roundId: string,
    loading: boolean
  ) => void;
  clearDecryptedRoundData: (companyAddress: string, roundId?: string) => void;
  isRoundDecrypted: (companyAddress: string, roundId: string) => boolean;
  isRoundLoading: (companyAddress: string, roundId: string) => boolean;
  getDecryptedRoundData: (
    companyAddress: string,
    roundId: string
  ) => DecryptedRoundData | null;
}

const generateKey = (companyAddress: string, securityId: string): string =>
  `${companyAddress.toLowerCase()}:${securityId}`;

const generateRoundKey = (companyAddress: string, roundId: string): string =>
  `${companyAddress.toLowerCase()}:round:${roundId}`;

export const useDecryptionStore = create<DecryptionState>()(
  persist(
    (set, get) => ({
      decryptedSecurities: {},
      decryptedRounds: {},
      loadingDecryption: {},
      loadingRoundDecryption: {},

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
          decryptedRounds: {},
          loadingDecryption: {},
          loadingRoundDecryption: {},
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

      // Round-related methods
      setDecryptedRoundData: (
        companyAddress: string,
        roundId: string,
        data: DecryptedRoundData
      ) => {
        const key = generateRoundKey(companyAddress, roundId);
        set(state => ({
          decryptedRounds: {
            ...state.decryptedRounds,
            [key]: data,
          },
        }));
      },

      setRoundLoading: (
        companyAddress: string,
        roundId: string,
        loading: boolean
      ) => {
        const key = generateRoundKey(companyAddress, roundId);
        set(state => ({
          loadingRoundDecryption: {
            ...state.loadingRoundDecryption,
            [key]: loading,
          },
        }));
      },

      clearDecryptedRoundData: (companyAddress: string, roundId?: string) => {
        if (roundId) {
          // Clear specific round
          const key = generateRoundKey(companyAddress, roundId);
          set(state => {
            const newDecrypted = { ...state.decryptedRounds };
            const newLoading = { ...state.loadingRoundDecryption };
            delete newDecrypted[key];
            delete newLoading[key];
            return {
              decryptedRounds: newDecrypted,
              loadingRoundDecryption: newLoading,
            };
          });
        } else {
          // Clear all rounds for this company
          const companyPrefix = `${companyAddress.toLowerCase()}:round:`;
          set(state => {
            const newDecrypted = { ...state.decryptedRounds };
            const newLoading = { ...state.loadingRoundDecryption };

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
              decryptedRounds: newDecrypted,
              loadingRoundDecryption: newLoading,
            };
          });
        }
      },

      isRoundDecrypted: (companyAddress: string, roundId: string): boolean => {
        const key = generateRoundKey(companyAddress, roundId);
        return !!get().decryptedRounds[key];
      },

      isRoundLoading: (companyAddress: string, roundId: string): boolean => {
        const key = generateRoundKey(companyAddress, roundId);
        return !!get().loadingRoundDecryption[key];
      },

      getDecryptedRoundData: (
        companyAddress: string,
        roundId: string
      ): DecryptedRoundData | null => {
        const key = generateRoundKey(companyAddress, roundId);
        return get().decryptedRounds[key] || null;
      },
    }),
    {
      name: 'decryption-store', // localStorage key
      // Only persist decrypted data, not loading states
      partialize: state => ({
        decryptedSecurities: state.decryptedSecurities,
        decryptedRounds: state.decryptedRounds,
      }),
    }
  )
);
