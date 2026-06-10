"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setIsLoggingIn(true);

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password.");
      } else {
        toast.success("Signed in successfully!", {
          description: "Welcome back to HelpNet.",
        });
        window.location.href = "/welcome";
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Password reset coming soon — contact support.", {
      description: "Support channel: support@helpnet.org",
    });
  };

  return (
    <div className="space-y-6 text-left">
      <div className="space-y-1 text-center">
        <h2 className="text-2xl font-display font-semibold text-gray-900">
          Welcome back
        </h2>
        <p className="text-xs text-gray-400">
          Sign in to request help or respond to matches
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-semibold animate-in fade-in duration-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
            Email Address
          </label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoggingIn}
          />
        </div>

        {/* Password field */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <button
              onClick={handleForgotPassword}
              className="text-[10px] font-bold text-primary hover:text-primary-hover focus:outline-none"
            >
              Forgot password?
            </button>
          </div>

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoggingIn}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoggingIn}
          className="w-full h-11 bg-primary text-white hover:bg-primary-hover font-semibold rounded-md shadow-card flex items-center justify-center pt-1"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="h-4.5 w-4.5 animate-spin mr-2" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Link to signup */}
      <div className="text-center pt-2 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup/step1"
            className="font-bold text-primary hover:text-primary-hover transition-colors"
          >
            Get started &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
