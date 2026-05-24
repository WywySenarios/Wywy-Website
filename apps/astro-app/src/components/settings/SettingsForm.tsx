"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const settingsSchema = z.object({
  setting: z.string(),
})

type SettingsFormValues = z.infer<typeof settingsSchema>

interface Props {
  isElectron: boolean
}

export function SettingsForm({ isElectron }: Props) {
  const { register, handleSubmit } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { setting: "" },
  })

  function onSubmit(data: SettingsFormValues) {
    console.log("Settings submitted (no-op):", data.setting)
    toast("Settings saved (placeholder)")
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Label htmlFor="setting">Setting</Label>
      <Input
        id="setting"
        disabled={!isElectron}
        placeholder={isElectron ? "Enter setting..." : "Only available in Electron"}
        {...register("setting")}
      />
      <Button type="submit">Save</Button>
    </form>
  )
}
