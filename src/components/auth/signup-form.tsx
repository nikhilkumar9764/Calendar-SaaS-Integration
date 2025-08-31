// components/auth/signup-form.tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signIn } from "next-auth/react"
import { Building2, User, Mail, Chrome, Apple } from "lucide-react"

type AccountType = "PERSONAL" | "CORPORATE"

export function SignupForm() {
  const [accountType, setAccountType] = useState<AccountType>("PERSONAL")
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    companyName: "",
    domain: ""
  })
  const router = useRouter()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          accountType
        })
      })

      if (response.ok) {
        // Auto sign in after successful signup
        await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          callbackUrl: "/dashboard"
        })
      } else {
        const error = await response.json()
        throw new Error(error.message)
      }
    } catch (error) {
      console.error("Signup failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" })
  }

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={accountType} onValueChange={(value) => setAccountType(value as AccountType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="PERSONAL" className="flex items-center gap-2">
                <User size={16} />
                Personal
              </TabsTrigger>
              <TabsTrigger value="CORPORATE" className="flex items-center gap-2">
                <Building2 size={16} />
                Corporate
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSignup} className="space-y-4 mt-6">
              <div>
                <Input
                  type="text"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <TabsContent value="CORPORATE" className="space-y-4">
                <Input
                  type="text"
                  placeholder="Company Name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  required
                />
                <Input
                  type="text"
                  placeholder="Company Domain (optional)"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                />
              </TabsContent>

              <div>
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div>
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn("google")}
                  className="flex items-center gap-2"
                >
                  <Chrome size={16} />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn("azure-ad")}
                  className="flex items-center gap-2"
                >
                  <Mail size={16} />
                  Microsoft
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => handleOAuthSignIn("apple")}
                className="w-full mt-2 flex items-center gap-2"
              >
                <Apple size={16} />
                Continue with Apple
              </Button>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}