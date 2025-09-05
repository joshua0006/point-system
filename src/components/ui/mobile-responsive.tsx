import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface MobileResponsiveProps {
  children: React.ReactNode
  mobile?: string
  desktop?: string
  className?: string
  asChild?: boolean
}

export function MobileResponsive({ 
  children, 
  mobile = "", 
  desktop = "",
  className = "",
  asChild = false 
}: MobileResponsiveProps) {
  const isMobile = useIsMobile()
  
  const combinedClassName = cn(
    isMobile ? mobile : desktop,
    className
  )

  if (asChild) {
    return (
      <div className={combinedClassName}>
        {children}
      </div>
    )
  }

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  )
}

// Utility component for mobile-first responsive containers
export function ResponsiveContainer({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn(
      isMobile 
        ? "container mx-auto px-2 py-4" 
        : "container mx-auto px-4 py-8",
      className
    )}>
      {children}
    </div>
  )
}

// Utility for responsive grid layouts
export function ResponsiveGrid({ 
  children, 
  mobile = "grid-cols-1",
  tablet = "md:grid-cols-2", 
  desktop = "lg:grid-cols-3",
  gap = "gap-4",
  className = ""
}: {
  children: React.ReactNode
  mobile?: string
  tablet?: string
  desktop?: string
  gap?: string
  className?: string
}) {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn(
      "grid",
      isMobile ? `${mobile} ${gap}` : `${mobile} ${tablet} ${desktop} ${gap}`,
      className
    )}>
      {children}
    </div>
  )
}

// Utility for responsive text sizing
export function ResponsiveText({
  children,
  mobile = "text-base",
  desktop = "text-lg",
  className = ""
}: {
  children: React.ReactNode
  mobile?: string
  desktop?: string
  className?: string
}) {
  const isMobile = useIsMobile()
  
  return (
    <div className={cn(
      isMobile ? mobile : desktop,
      className
    )}>
      {children}
    </div>
  )
}