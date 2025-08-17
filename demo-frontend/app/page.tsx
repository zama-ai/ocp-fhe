'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRoleStore, type Role } from '@/stores/role-store';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Database,
  Key,
  Building2,
  TrendingUp,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { PREDEFINED_WALLETS } from '@/lib/constants/wallets';

export default function Home() {
  const { role, switchToPredefinedWallet } = useRoleStore();

  const roleCards = [
    {
      role: 'FOUNDER' as Role,
      title: 'Founder',
      wallet: PREDEFINED_WALLETS[0],
      description: 'Company owners with full access',
      permissions: [
        { icon: Plus, text: 'Create companies, issue shares', allowed: true },
        { icon: Unlock, text: 'Can decrypt full cap table', allowed: true },
      ],
      color: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      role: 'INVESTOR' as Role,
      title: 'Investor',
      wallet: PREDEFINED_WALLETS[1],
      description: 'Stakeholders with limited access',
      permissions: [
        { icon: Eye, text: 'See own investments', allowed: true },
        {
          icon: EyeOff,
          text: "Cannot see other investors' allocations",
          allowed: false,
        },
      ],
      color:
        'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
      role: 'PUBLIC' as Role,
      title: 'Public',
      wallet: PREDEFINED_WALLETS[4],
      description: 'General users with read-only access',
      permissions: [
        { icon: Building2, text: 'Browse companies and rounds', allowed: true },
        { icon: Lock, text: 'Cannot decrypt any amounts', allowed: false },
      ],
      color: 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  const encryptionSteps = [
    {
      icon: Shield,
      title: 'Encrypt',
      description:
        'Shares, price/share and amounts are encrypted client-side before any on-chain interaction.',
    },
    {
      icon: Database,
      title: 'Store',
      description:
        'Smart contracts store ciphertexts only. Public can inspect structure without accessing values',
    },
    {
      icon: Key,
      title: 'Access Control',
      description:
        'Authorized roles derive keys to decrypt the parts they’re allowed to see – founder (all), investor (own), public (none).',
    },
  ];

  const quickLinks = [
    {
      href: '/company',
      title: 'Browse Companies',
      description: 'Explore all companies and their funding rounds',
      icon: Building2,
      showForRoles: ['FOUNDER', 'INVESTOR', 'PUBLIC'] as Role[],
    },
    {
      href: '/company',
      title: 'Create a Company',
      description: 'Start a new company and manage its cap table',
      icon: Plus,
      showForRoles: ['FOUNDER'] as Role[],
    },
    {
      href: '/investments',
      title: 'View My Investments',
      description: 'See your portfolio and investment history',
      icon: TrendingUp,
      showForRoles: ['INVESTOR'] as Role[],
    },
  ];

  return (
    <main className="flex-1 space-y-16 p-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <Badge variant="outline" className="text-xs px-3 py-1">
            Proof-of-Concept Demo – Not production
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Confidential Cap Tables
            <span className="block text-primary">on-chain</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Powered by Fully Homomorphic Encryption. Sensitive investment data
            remains private, while stakeholders keep access to what they need.
          </p>
        </div>
      </section>

      {/* Role Cards Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Choose Your Role</h2>
          <p className="text-muted-foreground">
            Each role has different access levels to demonstrate confidential
            data handling
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {roleCards.map(roleCard => (
            <Card
              key={roleCard.role}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                role === roleCard.role
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  : ''
              } ${roleCard.color}`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  {roleCard.title}
                  {role === roleCard.role && (
                    <Badge variant="default" className="text-xs">
                      Active
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{roleCard.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {roleCard.permissions.map((permission, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <permission.icon
                        className={`h-4 w-4 ${
                          permission.allowed
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500 dark:text-red-400'
                        }`}
                      />
                      <span
                        className={
                          permission.allowed ? '' : 'text-muted-foreground'
                        }
                      >
                        {permission.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => switchToPredefinedWallet(roleCard.wallet)}
                  className={`w-full ${roleCard.buttonColor} text-white`}
                  variant={role === roleCard.role ? 'default' : 'outline'}
                >
                  {role === roleCard.role
                    ? 'Current Role'
                    : `Try as ${roleCard.title}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How Encryption Works Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">How Encryption Works</h2>
          <p className="text-muted-foreground">
            Three simple steps backend by the Zama Protocol
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {encryptionSteps.map((step, index) => (
            <div key={index} className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Get Started</h2>
          <p className="text-muted-foreground">
            Explore the platform based on your current role:{' '}
            <Badge variant="outline">{role}</Badge>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {quickLinks
            .filter(link => link.showForRoles.includes(role))
            .map((link, index) => (
              <Link key={index} href={link.href}>
                <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <link.icon className="h-5 w-5 text-primary" />
                      {link.title}
                    </CardTitle>
                    <CardDescription>{link.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
        </div>
      </section>
    </main>
  );
}
