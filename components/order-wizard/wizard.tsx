"use client"

import { useState } from "react"
import { Step1Customer } from "./step1-customer"
import { Step2Products } from "./step2-products"
import { Step3Review } from "./step3-review"
import { Step4Success } from "./step4-success"

export type OrderItemData = {
  id: string // temporary internal id
  categoryId: string
  categoryName: string
  productId: string
  productName: string
  variantId: string
  variantName: string
  quantity: number
  unitCostPrice: number
  unitSellingPrice: number
  totalRevenue: number
  totalProfit: number
  minSellingPrice?: number | null
  maxSellingPrice?: number | null
}

export type SelectedCustomer = {
  id: string
  shop_name: string
  city: string
  address?: string | null
  phone?: string | null
}

import { User, Package, CheckSquare, CheckCircle2 } from "lucide-react"

export function OrderWizard({ catalogData }: { catalogData: any }) {
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null)
  const [items, setItems] = useState<OrderItemData[]>([])
  const [orderData, setOrderData] = useState<any>(null)

  const stepLabels = [
    { num: 1, label: "Customer", icon: User },
    { num: 2, label: "Products", icon: Package },
    { num: 3, label: "Review", icon: CheckSquare },
    { num: 4, label: "Complete", icon: CheckCircle2 },
  ]

  return (
    <div className="max-w-4xl mx-auto w-full p-2 md:p-4 pb-12">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {stepLabels.map((s) => {
            const Icon = s.icon
            const isCurrent = step === s.num
            const isCompleted = step > s.num
            return (
              <div
                key={s.num}
                className={`flex items-center gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-primary/5 border-primary/40 text-foreground font-semibold shadow-xs"
                    : isCompleted
                    ? "bg-muted/40 border-border/60 text-muted-foreground"
                    : "bg-muted/10 border-border/30 text-muted-foreground/60"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isCompleted
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? "✓" : <Icon className="w-3.5 h-3.5" />}
                </div>
                <div className="hidden sm:block min-w-0">
                  <p className="text-xs text-muted-foreground leading-none">Step {s.num}</p>
                  <p className="text-xs font-semibold truncate mt-0.5">{s.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {step === 1 && (
        <Step1Customer 
          onNext={(cust, preloadItems) => { 
            setCustomer(cust)
            if (preloadItems) setItems(preloadItems)
            setStep(2) 
          }} 
        />
      )}
      
      {step === 2 && (
        <Step2Products 
          catalogData={catalogData} 
          customer={customer!} 
          items={items} 
          setItems={setItems} 
          onBack={() => setStep(1)} 
          onNext={() => setStep(3)} 
        />
      )}
      
      {step === 3 && (
        <Step3Review 
          customer={customer!} 
          items={items} 
          onBack={() => setStep(2)} 
          onSuccess={(result) => { 
            setOrderData(result)
            setStep(4) 
          }} 
        />
      )}
      
      {step === 4 && (
        <Step4Success orderData={orderData} />
      )}
    </div>
  )
}
