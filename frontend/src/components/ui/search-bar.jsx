import * as React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar({ value, onChange, placeholder = "Buscar...", className }) {
  return (
    <div className={`relative w-full sm:w-64 ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-8 h-9 text-sm focus-visible:ring-1"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
