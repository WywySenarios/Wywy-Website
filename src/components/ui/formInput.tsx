"use client"

import { Input as BasicInput } from "@/components/ui/input"
import { useState } from "react"
type InputProps = {
    onChange: (val: number) => void
    defaultVal?: string
    [key: string]: any
}

export function Input({onChange, defaultVal, ...props}: InputProps) {
    const [value, setValue] = useState<string>(defaultVal || "")
    
    return (
        <BasicInput onChange={(e) => {
            setValue(e.target.value)
            onChange(parseInt(e.target.value, 0))
        }} {...props}
        />
    )
}