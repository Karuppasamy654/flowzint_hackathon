import { SignupStep1Form } from '@/components/auth/SignupStep1Form';
import Link from 'next/link';

export default function SignupStep1Page() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-display font-semibold text-gray-900">Create your account</h3>
        <p className="text-xs text-gray-400">Join the community help network today</p>
      </div>
      
      <SignupStep1Form />

      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-bold text-primary hover:text-primary-hover transition-colors"
          >
            Sign in &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
