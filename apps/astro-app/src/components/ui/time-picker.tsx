import React from "react";
import { Input } from "@/components/ui/input";
import { parseTime } from "@/utils";
import { getFallbackValue } from "@root/src/utils/data";

function convertToTimeString(date: Date): string {
  let output = date.toISOString().split("T")[1];
  output = output.substring(0, output.length - 1); // get rid of the trailing Z.
  return output;
}

/**
 * This element allows the user to pick a time and send it off to a React Hook Form.
 * @todo refractor so that the parent controls the value
 * @param defaultValue @type {string} This is expected to be a valid time string in the format. The component creation may fail if it is not.
 * @returns @type {ReactElement}
 */
export function TimePicker({
  defaultValue,
  onChange,
}: {
  defaultValue?: Date;
  onChange: (any: any) => void;
}) {
  const [date, setDate] = React.useState<Date>(() => {
    if (defaultValue) {
      onChange(convertToTimeString(defaultValue));
      return defaultValue;
    } else {
      const output = new Date();
      onChange(convertToTimeString(output));
      return output;
    }
  });

  const onTimeChange = (val: string) => {
    if (!val) {
      return;
    }
    let output: Date;
    if (date) {
      output = new Date(date);
    } else {
      output = new Date();
    }

    // copy over values if possible
    let copy = parseTime(val);
    if (copy && !isNaN(copy.getTime())) {
      output.setHours(copy.getHours());
      output.setMinutes(copy.getMinutes());
      output.setSeconds(copy.getSeconds());
    }

    setDate(output);
    onChange(convertToTimeString(output));
  };

  return (
    <Input
      type="time"
      id="time-picker"
      step="1"
      defaultValue={
        defaultValue
          ? convertToTimeString(defaultValue)
          : getFallbackValue("time")
      }
      onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
        onTimeChange(val.target.value);
      }}
      className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
    />
  );
}
