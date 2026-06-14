"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Printer, Share2, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import confetti from "canvas-confetti"
import { format } from "date-fns"

export function Step4Success({ orderData }: { orderData: any }) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Trigger confetti
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Show content slightly after animation starts
    const timer = setTimeout(() => setShowContent(true), 800)
    return () => clearTimeout(timer)
  }, [])

  if (!orderData) return null

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-center text-center animate-in fade-in py-12">
      
      {/* Animated SVG Check */}
      <div className="relative w-32 h-32 mb-8">
        <svg className="absolute inset-0 w-full h-full text-emerald-500 drop-shadow-md" viewBox="0 0 52 52">
          <circle 
            className="stroke-current animate-[drawCircle_0.6s_ease-out_forwards]" 
            cx="26" cy="26" r="25" fill="none" strokeWidth="2" 
            strokeDasharray="157" strokeDashoffset="157" 
          />
          <path 
            className="stroke-current animate-[drawCheck_0.4s_ease-out_0.6s_forwards]" 
            fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
            strokeDasharray="40" strokeDashoffset="40" 
            d="M14.1 27.2l7.1 7.2 16.7-16.8" 
          />
        </svg>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drawCircle {
          100% { stroke-dashoffset: 0; }
        }
        @keyframes drawCheck {
          100% { stroke-dashoffset: 0; }
        }
      `}} />

      <h2 className={`text-3xl font-bold tracking-tight mb-2 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        Order Created Successfully!
      </h2>
      
      <p className={`text-muted-foreground mb-8 transition-all duration-700 delay-100 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        Order has been saved to the database.
      </p>

      <div className={`w-full transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Card className="mb-8 border-emerald-100 bg-emerald-50/30">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-y-4 text-left">
              <div>
                <p className="text-sm text-muted-foreground">Order ID</p>
                <p className="font-mono text-sm font-medium mt-1">#{orderData.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-sm font-medium mt-1">{format(new Date(orderData.created_at), 'PPp')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-lg font-semibold mt-1">
                  ₹{(orderData.items ?? []).reduce((s: number, i: any) => s + Number(i.totalRevenue), 0).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="inline-flex mt-1">
                  <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">
                    {orderData.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href={`/orders/${orderData.id}`} className="w-full">
            <Button variant="outline" className="w-full" size="lg">
              <ExternalLink className="w-4 h-4 mr-2" /> View Details
            </Button>
          </Link>
          <Button variant="outline" className="w-full" size="lg">
            <Share2 className="w-4 h-4 mr-2 text-emerald-600" /> Share WhatsApp
          </Button>
          <Button variant="outline" className="w-full" size="lg">
            <Printer className="w-4 h-4 mr-2 text-blue-600" /> Print Invoice
          </Button>
          <Button className="w-full" size="lg" onClick={() => window.location.reload()}>
            <Plus className="w-4 h-4 mr-2" /> Create Another
          </Button>
        </div>
      </div>
    </div>
  )
}
