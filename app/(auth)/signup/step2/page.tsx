import { SignupStep2Form } from '@/components/auth/SignupStep2Form';

export default function SignupStep2Page() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-display font-semibold text-gray-900">What can you help with?</h3>
        <p className="text-xs text-gray-400">Pick up to 5 skills. You can change these anytime.</p>
      </div>
      
      <SignupStep2Form />
    </div>
  );
}
