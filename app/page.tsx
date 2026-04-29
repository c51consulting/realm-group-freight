import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_NAME, APP_DESCRIPTION, MATERIAL_TYPE_LABELS, NAV_LINKS } from '@/lib/constants';

export const metadata: Metadata = {
    title: `${APP_NAME} — Agricultural Materials Marketplace`,
    description: APP_DESCRIPTION,
};

const FEATURE_CARDS = [
  {
        icon: '🌾',
        title: 'Hay, Grain & Fodder',
        description:
                'Browse and post listings for hay, straw, silage, grain, seed, pellets, fertiliser and more.',
        href: '/listings',
        cta: 'Browse Listings',
  },
  {
        icon: '🚛',
        title: 'REALM Group Freight',
        description:
                'Find carriers or post freight jobs for agricultural loads. Integrated with weighbridge data.',
        href: '/freight',
        cta: 'View Freight',
  },
  {
        icon: '🔬',
        title: 'Feed Testing & Quality',
        description:
                'AFIA-graded quality tiers with lab certificates, on-farm NIR results and verified feed tests.',
        href: '/quality',
        cta: 'Quality Tiers',
  },
  {
        icon: '🤝',
        title: 'Offers & Negotiations',
        description:
                'Submit, accept or negotiate offers directly on listings. Transparent pricing for all parties.',
        href: '/offers',
        cta: 'View Offers',
  },
  {
        icon: '📦',
        title: 'Secure Payments',
        description:
                'Payments held in trust until delivery is confirmed. 5% platform fee on completion.',
        href: '/orders',
        cta: 'View Orders',
  },
  {
        icon: '⚖️',
        title: 'Weighbridge Integration',
        description:
                'Ingest weigh events via API, CSV, OCR photo or manual entry. Full audit
