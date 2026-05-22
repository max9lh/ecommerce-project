import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, ClipboardList, TrendingUp } from "lucide-react"

export function NewClosureCard() {
  const navigate = useNavigate()

  return (
    <Card className="flex flex-col border-dashed border-2 border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Cierre de Caja</CardTitle>
            <CardDescription>Registrar ingresos del día</CardDescription>
          </div>
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <ClipboardList className="size-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col items-center justify-center gap-6 py-8">
        {/* Ícono central decorativo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute size-24 rounded-full bg-primary/10 animate-pulse" />
          <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/20">
            <TrendingUp className="size-8 text-primary" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-medium">¿Listo para registrar el día?</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Ingresá los ingresos de hoy desglosados por efectivo y banco.
          </p>
        </div>

        <Button
          size="lg"
          className="gap-2 w-full max-w-[220px] shadow-md"
          onClick={() => navigate("/cierres/nuevo")}
        >
          <PlusCircle className="size-5" />
          Nuevo Cierre de Caja
        </Button>
      </CardContent>
    </Card>
  )
}
