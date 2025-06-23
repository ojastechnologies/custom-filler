This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.



## stripe payment test

Step 1: Get Stripe Test Keys (Free)
Go to https://dashboard.stripe.com/register
Sign up for a free Stripe account
Once logged in, you'll automatically be in Test Mode (look for the "Test Mode" toggle in the top right)
Go to Developers → API Keys
Copy your test keys:

Step 2: Add Test Keys to your .env.local
# Stripe Test Keys (Safe for development)
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Step 3: Test with Stripe's Test Card Numbers
When testing checkout, use these test card numbers:

Successful Payment Test Cards:
Visa: 4242424242424242
Visa (debit): 4000056655665556
Mastercard: 5555555555554444
American Express: 378282246310005
Test Card Details:
Expiry: Any future date (e.g., 12/34)
CVC: Any 3-digit number (e.g., 123)
ZIP: Any 5-digit number (e.g., 12345)
Cards for Testing Specific Scenarios:
Declined Card: 4000000000000002
Insufficient Funds: 4000000000009995
Expired Card: 4000000000000069






# Your admin URLs would be:

# /admin-portal-secure/auth/login
# /admin-portal-secure/auth/register