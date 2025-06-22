"use client";
import React, { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { axios } from "@/lib/axios";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/loading-spinner";

const loginSchema = z.object({
  phone: z.string().min(2, "Phone number must be at least 10 characters"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const LoginPage = () => {
  const router = useRouter()
  const { setUser, setToken, fetchUser } = useStore()
  const [loading, setLoading] = useState(true)

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    }
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    setLoading(true)
    axios.post('/auth/login', data, { withCredentials: true })
      .then(res => {
        setToken(res.data.token)
        setUser(res.data.user)
        router.push('/dashboard/home')
      })
      .catch(error => {
        console.log(error)
        setLoading(false)
      })
  };

  useEffect(() => {
    fetchUser()
      .then(data => {
        if (data) {
          // redirect to dashboard
          router.push('/dashboard/home')
        } else {
          setLoading(false)
        }
      })
      .catch(console.error)
  }, [])

  // Show loading overlay when page is loading
  if (loading && !form.formState.isSubmitting) {
    return <LoadingSpinner fullScreen size="lg" text="Loading..." />;
  }

  return (
    <div className="w-screen h-screen flex">
      {/* Left side with image */}
      <div className="hidden md:flex w-1/2 h-full bg-gray-100 items-center justify-center">
        <div className="w-3/4 h-3/4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-90 rounded-2xl"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
            <h1 className="text-4xl font-bold mb-4">Welcome Back!</h1>
            <p className="text-center text-lg opacity-90">Manage your rental properties with ease and efficiency.</p>
          </div>
        </div>
      </div>

      {/* Right side with login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
            <LoadingSpinner size="md" text="Signing in..." />
          </div>
        )}
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Sign in to your account</h1>
            <p className="text-gray-500 mt-2">Enter your credentials to access your dashboard</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Phone Number</FormLabel>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Enter your phone number"
                      type="tel"
                      className="h-12 text-base"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />


              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-gray-700">Password</FormLabel>
                      <a href="#" className="text-sm font-medium text-blue-600 hover:underline">
                        Forgot password?
                      </a>
                    </div>
                    <Input
                      {...field}
                      disabled={loading}
                      placeholder="Enter your password"
                      type="password"
                      className="h-12 text-base"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />


              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <a href="#" className="font-medium text-blue-600 hover:underline">
                Contact administrator
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
