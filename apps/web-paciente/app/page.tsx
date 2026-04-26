import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('aciav_token')?.value;
  if (token) redirect('/portal');
  redirect('/login');
}
