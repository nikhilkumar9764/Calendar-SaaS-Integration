// app/(dashboard)/layout.tsx
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { DashboardNav } from "@/components/dashboard/nav"
import { UserMenu } from "@/components/dashboard/user-menu"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    console.log("didn't load page ,only redirected");
    redirect("/auth/login")
  }

  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <div className="flex-1 flex flex-col">
        <header className="border-b">
          <div className="flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-semibold">Calendar Dashboard</h1>
            <UserMenu user={session.user} />
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}