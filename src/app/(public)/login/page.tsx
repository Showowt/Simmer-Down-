import { redirect } from 'next/navigation'

// Redirect old /login to new /auth/login
export default function OldLoginPage() {
  redirect('/auth/login')
}
