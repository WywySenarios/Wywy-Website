"use client";
import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

type InputProps = {
  value: number | null;
  onChange: (val: number) => void;
  [key: string]: any;
};

export function NumberBox({ value, onChange, ...props }: InputProps) {
  const [valid, setValid] = useState<boolean>(value === null);
  return (
    <Input
      value={value === null || !valid ? "" : value}
      onChange={(e: ChangeEvent<HTMLInputElement>) => {
        let output: number = parseInt(e.target.value);
        if (isNaN(output)) {
          setValid(false);
          return;
        }

        onChange(output);
        setValid(true);
      }}
      aria-invalid={!valid}
      {...props}
    />
  );
}
