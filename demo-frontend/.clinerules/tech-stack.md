# Tech Stack Rules

This document defines the technical architecture, patterns, and conventions for the Web3 frontend application.

## Core Technologies

### Frontend Framework

- **Next.js 15.4.6** with App Router
- **React 19.1.0** with TypeScript 5
- **Turbopack** for development builds
- Use `'use client'` directive only when necessary for client-side features

### UI & Styling

- **Tailwind CSS v4** for utility-first styling
- **shadcn/ui** components for consistent design system
- **Radix UI** primitives for accessible, unstyled components
- **Lucide React** for icons
- **next-themes** for theme management

### Web3 Integration

- **Wagmi v2.16.2** for Ethereum interactions and hooks
- **Viem v2.33.3** for low-level Ethereum utilities
- **@reown/appkit** (WalletConnect v2) for wallet connections
- **Sepolia testnet** as default network for development

### State Management

- **Zustand v5.0.7** for client-side global state
- **TanStack React Query v5.84.2** for server state and caching
- **React Hook Form v7.62.0** with **Zod** validation for forms

### Backend & Storage

- **Next.js API Routes** for server-side logic
- **@upstash/redis v1.28.4** for serverless Redis storage
- **TypeScript** for type safety across frontend and backend

## Architecture Patterns

### File Organization

```
app/                    # Next.js App Router pages
├── api/               # API routes
├── [dynamic]/         # Dynamic routes
└── page.tsx           # Page components

components/            # Reusable UI components
├── ui/               # shadcn/ui components
└── [feature].tsx     # Feature-specific components

lib/                   # Utility libraries
├── services/         # Business logic services
├── types/           # TypeScript type definitions
├── utils.ts         # General utilities
└── redis.ts         # Redis configuration

config/               # Configuration files
stores/               # Zustand stores
hooks/                # Custom React hooks
context/              # React context providers
```

### Component Patterns

#### Page Components

- Use default exports for page components
- Keep pages thin - delegate logic to services and hooks
- Use proper TypeScript interfaces for props

```typescript
// app/company/[slug]/page.tsx
interface CompanyPageProps {
  params: { slug: string };
}

export default function CompanyPage({ params }: CompanyPageProps) {
  // Implementation
}
```

#### UI Components

- Use named exports for reusable components
- Follow shadcn/ui patterns for component structure
- Use `forwardRef` when components need ref forwarding

```typescript
// components/company-card.tsx
interface CompanyCardProps {
  company: Company;
  className?: string;
}

export function CompanyCard({ company, className }: CompanyCardProps) {
  // Implementation
}
```

### State Management Patterns

#### Zustand Stores

- Use TypeScript interfaces for store state
- Implement persistence for user preferences
- Keep stores focused on specific domains

```typescript
// stores/role-store.ts
interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    set => ({
      role: 'FOUNDER',
      setRole: (role: Role) => set({ role }),
    }),
    { name: 'app-role' }
  )
);
```

#### React Query

- Use query keys with consistent naming
- Implement proper error handling
- Use mutations for data modifications

```typescript
// hooks/use-companies.ts
export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.getAll(),
  });
}
```

### Web3 Integration Patterns

#### Wagmi Configuration

- Configure wagmi adapter in `config/wagmi.tsx`
- Use environment variables for project IDs
- Support multiple networks with Sepolia as default

#### Wallet Connection

- Use @reown/appkit for wallet connection UI
- Configure in context provider with proper SSR support
- Disable unnecessary features (swaps, onramp, etc.)

#### Contract Interactions

- Use wagmi hooks for contract interactions
- Implement proper error handling for transactions
- Use TypeScript for contract ABI types

### API Routes Patterns

#### Route Structure

- Use RESTful conventions for API endpoints
- Implement proper HTTP status codes
- Use TypeScript for request/response types

```typescript
// app/api/companies/route.ts
export async function GET() {
  try {
    const companies = await companyService.getAll();
    return Response.json(companies);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
```

#### Redis Integration

- Use organized key prefixes from `lib/redis.ts`
- Implement proper error handling
- Use utility functions for key generation

```typescript
// lib/redis.ts
export const KEY_PREFIXES = {
  COMPANY: 'company',
  COMPANY_BY_FOUNDER: 'founder',
  // ...
} as const;

export const generateKey = (prefix: string, identifier: string): string =>
  `${prefix}:${identifier}`;
```

### Form Handling

#### React Hook Form + Zod

- Use Zod schemas for validation
- Implement proper TypeScript types
- Use shadcn/ui form components

```typescript
// components/create-company-form.tsx
const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
});

type CreateCompanyForm = z.infer<typeof createCompanySchema>;

export function CreateCompanyForm() {
  const form = useForm<CreateCompanyForm>({
    resolver: zodResolver(createCompanySchema),
  });
  // Implementation
}
```

## Development Guidelines

### TypeScript

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Use proper typing for API responses and Web3 interactions
- Avoid `any` type - use `unknown` when necessary

### Styling

- Use Tailwind utility classes
- Follow shadcn/ui component patterns
- Use CSS variables for theme customization
- Implement responsive design with Tailwind breakpoints

### Error Handling

- Implement proper error boundaries
- Use React Query error handling for API calls
- Handle Web3 transaction errors gracefully
- Provide user-friendly error messages

### Performance

- Use React Query for caching and background updates
- Implement proper loading states
- Use Next.js Image component for optimized images
- Lazy load components when appropriate

### Security

- Validate all user inputs with Zod
- Use environment variables for sensitive data
- Implement proper CORS for API routes
- Validate Ethereum addresses using viem utilities

## Environment Configuration

### Required Environment Variables

```bash
# Wallet Connect
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

### Development Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Code Quality

### Linting & Formatting

- Use ESLint with Next.js and Prettier configurations
- Format code automatically with Prettier
- Use consistent import ordering
- Follow React and TypeScript best practices

### Testing (Future)

- Implement unit tests for utility functions
- Add integration tests for API routes
- Test Web3 interactions with mock providers
- Use React Testing Library for component tests

## Deployment

### Build Configuration

- Use Next.js static export when possible
- Optimize for serverless deployment
- Configure proper environment variables
- Implement proper error pages

This tech stack provides a solid foundation for building a modern, type-safe Web3 application with excellent developer experience and maintainability.
