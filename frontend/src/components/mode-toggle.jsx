import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 flex items-center justify-center rounded-md border"
    >
      {theme === "dark" ? "🌙" : "☀️"}
      <span className="sr-only">Cambiar tema</span>
    </Button>
  )
}
