import { SignupStep3Form } from '@/components/auth/SignupStep3Form';

export default function SignupStep3Page() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h3 className="text-2xl font-display font-semibold text-gray-900">Tell us about yourself</h3>
        <p className="text-xs text-gray-400">Complete your profile to finish setup</p>
      </div>
      
      <SignupStep3Form />
    </div>
  );
}
