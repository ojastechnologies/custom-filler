import { redirect } from 'next/navigation';

export default function SecureLoginRedirect() {
  redirect('/auth/enter-portal-9f3b2');
  return null;
}
