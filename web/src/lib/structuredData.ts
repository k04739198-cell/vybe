export const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Vybe',
  url: 'https://vybe-two-gamma.vercel.app',
  description:
    'Vybe connects you to real people via live video, instantly. No sign up, no login. Just open and start.',
  applicationCategory: 'CommunicationApplication',
  operatingSystem: 'Any (Web Browser)',
  browserRequirements: 'Requires WebRTC, Camera, and Microphone support',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '1420',
    bestRating: '5',
    worstRating: '1',
  },
};

export const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How does Vybe work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Vybe connects you to real people across South Asia through instant 1-on-1 live video chat. Simply tap "Start Scrolling" to enter the matchmaking queue. Our lightning-fast peer-to-peer WebRTC network pairs you with a random stranger in seconds. If you want to meet someone new, just swipe up to skip to the next person—just like scrolling through Reels or TikTok.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Vybe free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Vybe is 100% free to use. There are no subscriptions, paywalls, or hidden charges. You can hop on, video chat with real people, and meet strangers whenever you want without ever entering credit card details.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to sign up for Vybe?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. You do not need to create an account, register, or sign in to use Vybe. We believe in total spontaneity and zero friction—just grant camera and microphone permission in your browser, and you are ready to start vybing instantly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Vybe safe?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Safety is our top priority. All video calls are transmitted directly peer-to-peer using encrypted WebRTC connections, meaning your live video is never stored on our servers. We enforce a strict 18+ age gate, automated PhotoDNA content scanning, proactive NCMEC CyberTipline escalation, zero personal data (PII) retention, and 1-tap instant user reporting with automatic ban enforcement.',
      },
    },
  ],
};
