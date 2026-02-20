"use client";
import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

type InputProps = {
  value: number;
  onChange: (val: number) => void;
  [key: string]: any;
};

export function NumberBox({ value, onChange, ...props }: InputProps) {
  const [valid, setValid] = useState<boolean>(true);
  return (
    <Input
      value={value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) {
          setValid(true);
          return;
        }

        let output: number = parseInt(e.target.value);
        if (isNaN(output)) {
          setValid(false);
          return;
        }

        onChange(output);
        setValid(true);
      }}
      aria-invalid={valid}
      {...props}
    />
  );
}
