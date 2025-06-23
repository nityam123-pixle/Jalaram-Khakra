"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Bell, Database, User, Moon, Sun } from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [businessName, setBusinessName] = useState("Khakhra & Patra Business")
  const [ownerName, setOwnerName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [notifications, setNotifications] = useState(true)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)

    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem("business-settings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setBusinessName(settings.businessName || "Khakhra & Patra Business")
      setOwnerName(settings.ownerName || "")
      setPhone(settings.phone || "")
      setEmail(settings.email || "")
      setNotifications(settings.notifications ?? true)
    }
  }, [])

  const handleSave = () => {
    const settings = {
      businessName,
      ownerName,
      phone,
      email,
      notifications,
    }

    localStorage.setItem("business-settings", JSON.stringify(settings))

    toast({
      title: "Success",
      description: "Settings saved successfully!",
    })
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your business settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Business Information
            </CardTitle>
            <CardDescription>Update your business details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Enter owner name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>Customize your app experience and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications for new orders and updates</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="flex items-center gap-2">
                {theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4" />
                    Light
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
            <CardDescription>Manage your order data and backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Orders</p>
                <p className="text-sm text-muted-foreground">Download all your orders as CSV file</p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  toast({ title: "Feature Coming Soon", description: "Export functionality will be available soon!" })
                }
              >
                Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Backup Data</p>
                <p className="text-sm text-muted-foreground">Create a backup of all your business data</p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  toast({ title: "Feature Coming Soon", description: "Backup functionality will be available soon!" })
                }
              >
                Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} size="lg">
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
