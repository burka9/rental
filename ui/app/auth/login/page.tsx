"use client";
import React, { useEffect, useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { axios } from "@/lib/axios";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

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

  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4 w-full max-w-[250px]"
        >
					<Label className="text-3xl">Login</Label>
					
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <Input
									{...field}
                  disabled={loading}
									placeholder="Phone number"
									type="text"
								/>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <Input
									{...field}
                  disabled={loading}
									placeholder="Password"
									type="password"
								/>
                <FormMessage></FormMessage>
              </FormItem>
            )}
          ></FormField>

          <Button type="submit" disabled={loading}>Login</Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginPage;
