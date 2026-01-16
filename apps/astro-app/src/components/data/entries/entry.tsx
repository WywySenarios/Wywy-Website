"use client";

import { Controller } from "react-hook-form";
import { SingleFormElement } from "../input-elements";
import { Input } from "@/components/ui/input";

export function TaggingTableEntry({
  controller,
  name,
}: {
  controller: any;
  name: string;
}) {
  let isNumber: boolean;
  switch (name) {
    case "id":
      return null;
    case "entry_id":
    case "tag_id":
      isNumber = true;
    default:
      isNumber = false;
  }
  return (
    <Controller
      control={controller.control}
      name={name}
      key={`${name}-field`}
      render={({ field }) => (
        <SingleFormElement
          body={
            <Input
              type={isNumber ? "number" : "text"}
              placeholder={isNumber ? "1" : ""}
              {...field}
            />
          }
          title={null}
        />
      )}
    />
  );
}
