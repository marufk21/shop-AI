"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Sparkle, X } from "@phosphor-icons/react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useAuth } from "@/components/auth/auth-provider"
import { ApiError, apiClient } from "@/server/api-client"
import type { AuthResponse } from "@/types/auth"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

const signInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

const signUpSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be at most 50 characters")
      .regex(
        /^[A-Za-z0-9_-]+$/,
        "Only letters, numbers, underscores, and hyphens"
      ),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must include a letter")
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

type SignInValues = z.infer<typeof signInSchema>
type SignUpValues = z.infer<typeof signUpSchema>

const TEST_USER_EMAIL = "admin@shop.ai"
const TEST_USER_PASSWORD = "Admin@123"
export function AuthModal({ onAuthenticated }: { onAuthenticated?: () => void }) {
  const { closeAuthModal, isModalOpen, preferredTab, setAuthenticatedUser } = useAuth()
  const [activeTab, setActiveTab] = React.useState(preferredTab)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isModalOpen) {
      setActiveTab(preferredTab)
      setErrorMessage(null)
    }
  }, [isModalOpen, preferredTab])

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  })
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  })

  async function handleAuthSuccess(response: AuthResponse) {
    if (typeof window !== "undefined") {
      if (response.session_token) {
        localStorage.setItem("shopai_token", response.session_token)
      }
      localStorage.setItem("shopai_user", JSON.stringify(response.user))
    }
    setAuthenticatedUser(response.user)
    signInForm.reset()
    signUpForm.reset({ username: "", email: "", password: "", confirmPassword: "" })
    closeAuthModal()
    onAuthenticated?.()
  }

  async function handleSignInSubmit(values: SignInValues) {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const response = await apiClient.post<AuthResponse>("/api/auth/signin", values)
      await handleAuthSuccess(response)
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Unable to sign in right now"
      )
    } finally {
      setIsSubmitting(false)
    }
  }
async function handleTestSignIn() {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const response = await apiClient.post<AuthResponse>("/api/auth/signin", {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      })
      await handleAuthSuccess(response)
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Unable to sign in as test user"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSignUpSubmit(values: SignUpValues) {
    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      const response = await apiClient.post<AuthResponse>("/api/auth/signup", {
        username: values.username,
        email: values.email,
        password: values.password,
        confirm_password: values.confirmPassword,
      })
      await handleAuthSuccess(response)
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : "Unable to create your account"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent
        className="max-w-md overflow-hidden rounded-2xl p-0"
        showCloseButton={false}
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <DialogTitle className="font-heading text-lg font-semibold">
              Your account
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Sign in only when you need checkout or protected account actions.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={closeAuthModal}
            className="rounded-lg"
            aria-label="Close authentication dialog"
          >
            <X className="size-4" />
          </Button>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
          className="px-6 py-5"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Create Account</TabsTrigger>
          </TabsList>

          {errorMessage ? (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <TabsContent value="signin" className="mt-5">
            <form className="space-y-4" onSubmit={signInForm.handleSubmit(handleSignInSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" {...signInForm.register("email")} />
                <p className="text-xs text-destructive">
                  {signInForm.formState.errors.email?.message ?? ""}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" {...signInForm.register("password")} />
                <p className="text-xs text-destructive">
                  {signInForm.formState.errors.password?.message ?? ""}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>
            </form>
<div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase text-muted-foreground">
                  <span className="bg-background px-2">or</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => void handleTestSignIn()}
              >
                <Sparkle className="size-4" />
                Sign in as test user
              </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-5">
            <form className="space-y-4" onSubmit={signUpForm.handleSubmit(handleSignUpSubmit)}>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" {...signUpForm.register("email")} />
                <p className="text-xs text-destructive">
                  {signUpForm.formState.errors.email?.message ?? ""}
                </p>
              </div>
<div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input id="signup-username" type="text" {...signUpForm.register("username")} />
                <p className="text-xs text-destructive">
                  {signUpForm.formState.errors.username?.message ?? ""}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" {...signUpForm.register("password")} />
                <p className="text-xs text-destructive">
                  {signUpForm.formState.errors.password?.message ?? ""}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm password</Label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  {...signUpForm.register("confirmPassword")}
                />
                <p className="text-xs text-destructive">
                  {signUpForm.formState.errors.confirmPassword?.message ?? ""}
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
