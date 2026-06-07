'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';

const Step1Schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must match'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type Step1Data = z.infer<typeof Step1Schema>;

export function SignupStep1Form() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Load existing session values if backtracked
  const [initialValues, setInitialValues] = React.useState<Step1Data | null>(null);

  React.useEffect(() => {
    const saved = sessionStorage.getItem('signup_step1');
    if (saved) {
      try {
        setInitialValues(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Step1Data>({
    resolver: zodResolver(Step1Schema),
    values: initialValues || undefined,
  });

  const onSubmit = (data: Step1Data) => {
    sessionStorage.setItem('signup_step1', JSON.stringify(data));
    router.push('/signup/step2');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Full Name
        </label>
        <Input
          type="text"
          placeholder="Jane Doe"
          {...register('name')}
          className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Email Address
        </label>
        <Input
          type="email"
          placeholder="jane@example.com"
          {...register('email')}
          className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Password
        </label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••"
            {...register('password')}
            className={errors.password ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••"
            {...register('confirmPassword')}
            className={errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500 pr-10' : 'pr-10'}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full h-11 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md shadow-card">
        Continue &rarr;
      </Button>
    </form>
  );
}
