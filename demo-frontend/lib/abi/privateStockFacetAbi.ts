export const privateStockFacetAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'role',
        type: 'bytes32',
      },
    ],
    name: 'AccessControlUnauthorized',
    type: 'error',
  },
  {
    inputs: [],
    name: 'EmptyParams',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'stakeholder_address',
        type: 'address',
      },
      {
        internalType: 'bytes16',
        name: 'stock_class_id',
        type: 'bytes16',
      },
    ],
    name: 'getPrivateStakeholderSecurities',
    outputs: [
      {
        internalType: 'bytes16[]',
        name: '',
        type: 'bytes16[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'securityId',
        type: 'bytes16',
      },
    ],
    name: 'getPrivateStockPosition',
    outputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'stakeholder_address',
            type: 'address',
          },
          {
            internalType: 'bytes16',
            name: 'stock_class_id',
            type: 'bytes16',
          },
          {
            internalType: 'euint64',
            name: 'quantity',
            type: 'bytes32',
          },
          {
            internalType: 'euint64',
            name: 'share_price',
            type: 'bytes32',
          },
          {
            internalType: 'euint64',
            name: 'pre_money_valuation',
            type: 'bytes32',
          },
        ],
        internalType: 'struct PrivateStockActivePosition',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'round_id',
        type: 'bytes16',
      },
    ],
    name: 'getRoundPreMoneyValuation',
    outputs: [
      {
        internalType: 'euint64',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes16',
        name: 'round_id',
        type: 'bytes16',
      },
    ],
    name: 'getRoundTotalAmount',
    outputs: [
      {
        internalType: 'euint64',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'bytes16',
            name: 'id',
            type: 'bytes16',
          },
          {
            internalType: 'bytes16',
            name: 'stock_class_id',
            type: 'bytes16',
          },
          {
            internalType: 'externalEuint64',
            name: 'share_price',
            type: 'bytes32',
          },
          {
            internalType: 'externalEuint64',
            name: 'quantity',
            type: 'bytes32',
          },
          {
            internalType: 'externalEuint64',
            name: 'pre_money_valuation',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'stakeholder_address',
            type: 'address',
          },
          {
            internalType: 'bytes16',
            name: 'security_id',
            type: 'bytes16',
          },
          {
            internalType: 'string',
            name: 'custom_id',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'stock_legend_ids_mapping',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'security_law_exemptions_mapping',
            type: 'string',
          },
          {
            internalType: 'address',
            name: 'admin_viewer',
            type: 'address',
          },
          {
            internalType: 'bytes16',
            name: 'round_id',
            type: 'bytes16',
          },
        ],
        internalType: 'struct IssuePrivateStockParams[]',
        name: 'params',
        type: 'tuple[]',
      },
      {
        internalType: 'bytes',
        name: 'inputProof',
        type: 'bytes',
      },
    ],
    name: 'issuePrivateStocks',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
