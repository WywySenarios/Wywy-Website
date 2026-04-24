"use client";
import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";

type InputProps = {
  value: number | null;
  onChange: (val: number) => void;
  placeholder?: string;
  [key: string]: any;
};

export function NumberBox({
  value,
  onChange,
  placeholder,
  ...props
}: InputProps) {
  const [valid, setValid] = useState<boolean>(true);
  return (
    <Input
      value={value === null ? "" : value}
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
      placeholder={placeholder}
      aria-invalid={!valid}
      {...props}
    />
  );
}
