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
}

export type SelectedCustomer = {
  id: string
  shop_name: string
  city: string
  address?: string | null
  phone?: string | null
}

export function OrderWizard({ catalogData }: { catalogData: any }) {
  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState<SelectedCustomer | null>(null)
  const [items, setItems] = useState<OrderItemData[]>([])
  const [orderData, setOrderData] = useState<any>(null)

  return (
    <div className="max-w-4xl mx-auto w-full p-4 md:p-6 pb-24">
      {/* Step Indicator */}
      <div className="mb-8 flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
        </div>
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border-2 border-background'}`}>
            {s}
          </div>
        ))}
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
