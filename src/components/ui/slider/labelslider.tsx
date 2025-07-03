"use client";
import { Slider as BasicSlider } from "@/components/ui/slider";
import { Input } from "@/components/ui/formInput";

import { cn } from "@root/lib/utils"
import { useState } from "react";

type SliderProps = {
    onChange: (val: number) => void;
    defaultVal: number;
    min: number;
    max: number;
    step: number;
    className?: string;
    [key: string]: any;
}

export function Slider({onChange, defaultVal = 0, min, max, className = "", ...props}: SliderProps) {
  const [progress, setProgress] = useState([defaultVal]);
  return (
    <div className={cn("w-full flex items-center gap-2", className)}>
      <BasicSlider min={min} max={max} value={progress} onValueChange={(val) => {
        setProgress(val)
        onChange(val[0])
        }}  {...props}/>
      <Input className="h-full h-min-4 w-[10ch] text-center" min={min} max={max} placeholder={0} type="number" value={progress[0]} onChange={(val) => {
        setProgress([val ?? defaultVal])
        onChange(val ?? defaultVal)
      }}/>
      {/* <span className="w-[5ch]">{progress[0]}</span> */}
    </div>
  );
}