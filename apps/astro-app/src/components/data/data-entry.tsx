import type { JSX } from "astro/jsx-runtime";
import { FormElement } from "@/components/data/input-elements";
import type { DataColumn } from "@/env";
import type { UseFormReturn } from "react-hook-form";

export function Columns({
    fieldsToEnter,
    form
}: {
    fieldsToEnter: Array<DataColumn>,
    form: UseFormReturn<{ [x: string]: any; }>,
}): JSX.Element {
    return (
        <div>
            {fieldsToEnter.map((columnInfo: DataColumn) => {
                return (
                    <FormElement key={columnInfo.name + "-form-element"} form={form} columnInfo={columnInfo} />
                )
            }
            )
            }
        </div>
    )
}