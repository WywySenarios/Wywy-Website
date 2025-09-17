import React from "react";
import { Input } from "@/components/ui/input";
import { parse } from "date-fns";

/**
 * This element allows the user to pick a time and send it off to a React Hook Form.
 * @todo refractor so that the parent controls the value
 * @param defaultValue @type {string} This is expected to be a valid time string in the format. The component creation may fail if it is not.
 * @returns @type {ReactElement}
 */
export function TimePicker({ defaultValue, onChange }: { defaultValue: string, onChange: (any: any) => void }) {
    const [date, setDate] = React.useState<Date | undefined>(() => {
        let output = new Date();
        if (defaultValue) {
            try {
                output = parse(defaultValue, "HH:mm:ss", output)
                onChange(output.toISOString().split("T")[1]);
                return output;
            } catch {
                output = new Date();
                onChange(output.toISOString().split("T")[1]);
                return output;
            }
        }

        output = new Date();
        onChange(output.toISOString().split("T")[1]);
        return output;
    });

    const onTimeChange = (val: string) => {
        if (!val) {
            return
        }
        let output: Date;
        if (date) {
            output = new Date(date);
        } else {
            output = new Date();
        }

        // copy over values if possible
        let copy = new Date(val);
        output.setHours(copy.getHours());
        output.setMinutes(copy.getMinutes());
        output.setSeconds(copy.getSeconds());

        setDate(output);
        onChange(output.toISOString().split("T")[1]);
    }

    return (
        <Input
            type="time"
            id="time-picker"
            step="1"
            defaultValue={defaultValue}
            onChange={(val: React.ChangeEvent<HTMLInputElement>) => {
                onTimeChange(val.target.value);
            }}
            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
    );
}