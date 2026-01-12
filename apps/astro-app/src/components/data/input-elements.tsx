import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@root/lib/utils";
import type { JSX, ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Slider } from "@/components/ui/slider/labelslider";
import {
  RadioGroup,
  RadioGroupItem,
} from "@root/src/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Calendar24 } from "@root/src/components/data/input-element/timestamp-picker";
import { TimePicker } from "@root/src/components/ui/time-picker";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { DataColumn } from "@root/src/env";
import {
  SearchSelect,
  type SearchSelectData,
} from "./input-element/search-select";
import { Controller } from "react-hook-form";

export interface FormElementProps {
  form: any;
  columnInfo: DataColumn;
  controllerNamer?: (strings: TemplateStringsArray, name: string) => string;
}

export function ConstantFormElement({
  form,
  columnInfo,
  controllerNamer = (strings: TemplateStringsArray, name: string) =>
    `data.${strings[0]}${name}${strings[1]}`,
}: FormElementProps): JSX.Element {
  return (
    <Controller
      control={form.control}
      name={controllerNamer`${columnInfo.name}`}
      key={columnInfo.name + "-field"}
      render={({ field }) => <p>{field.value}</p>}
    />
  );
}

export function SingleFormElement({
  title,
  orientation = "horizontal",
  description = undefined,
  body = null,
}: {
  title: string;
  description?: string | undefined;
  orientation?: "horizontal" | "vertical" | "responsive" | null | undefined;
  body?: ReactNode | null;
}) {
  return (
    <div>
      <Field
        className="w-full flex flex-col items-center gap-4"
        orientation={orientation}
      >
        <FieldLabel className="items-center">
          <span className="w-full text-center text-lg font-semibold">
            {title}
          </span>
        </FieldLabel>
        {body}
        {description && <FieldDescription>{description}</FieldDescription>}
      </Field>
    </div>
  );
}

export function SearchSelectField() {}

export function FormElement({
  form,
  columnInfo,
  controllerNamer = (strings: TemplateStringsArray, name: string) =>
    `data.${strings[0]}${name}${strings[1]}`,
}: {
  form: any;
  columnInfo: DataColumn;
  controllerNamer?: (strings: TemplateStringsArray, name: string) => string;
}) {
  return (
    <div className="rounded-lg border p-5 shadow-md" key={columnInfo.name}>
      <Controller
        control={form.control}
        name={controllerNamer`${columnInfo.name}`}
        key={columnInfo.name + "-field"}
        render={({ field }) => (
          <InputElement field={field} columnInfo={columnInfo} />
        )}
      />
      {columnInfo.comments ? (
        <Controller
          control={form.control}
          name={controllerNamer`${columnInfo.name}_comments`}
          key={columnInfo.name + "_comments-field"}
          render={({ field }) => (
            <Field>
              <div className="w-full flex flex-col items-center gap-4">
                <FieldLabel className="text-center text-base">
                  Comments
                </FieldLabel>
              </div>
              <Textarea {...field} />
            </Field>
          )}
        />
      ) : null}
    </div>
  );
}

function InputElement({
  field,
  columnInfo,
}: {
  field: any;
  columnInfo: DataColumn;
}): JSX.Element {
  let grouped: boolean;
  switch (columnInfo.entrytype) {
    case "radio":
      grouped = true;
      break;
    default:
      grouped = false;
  }

  if (grouped) {
    let body: JSX.Element;

    switch (columnInfo.entrytype) {
      case "radio":
        body = (
          <RadioGroup onValueChange={field.onChange} defaultValue={field.value}>
            {columnInfo.values.map((option: string) => (
              // note that if two options have the same key, they will also have the same values. Pretty strange, huh?
              <Field
                className="flex flex-row items-center gap-3"
                orientation="horizontal"
                key={columnInfo.name + "-" + option + "-radio"}
              >
                <RadioGroupItem value={option} />
                <FieldLabel>{option}</FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        );
        break;
      default:
        console.warn(
          `No input element found for column ${columnInfo.name} (entrytype: ${columnInfo.entrytype}). This is likely a bug.`
        );
        body = <></>;
        break;
    }

    return (
      <FieldSet>
        <FieldLabel>{columnInfo.name}</FieldLabel>
        {columnInfo.description && (
          <FieldDescription>{columnInfo.description}</FieldDescription>
        )}
        {body}
      </FieldSet>
    );
  } else {
    let body: JSX.Element;
    let fieldOrientation: "horizontal" | "vertical" | "responsive" | undefined =
      undefined;

    switch (columnInfo.entrytype) {
      case "textbox":
        body = <Textarea placeholder={columnInfo.defaultValue} {...field} />;
        break;
      case "linearSlider":
        body = (
          <Slider
            defaultVal={field.value}
            min={columnInfo.min ?? 0}
            max={columnInfo.max ?? 100}
            step={1}
            onChange={field.onChange}
          />
        );
        break;
      case "switch":
        fieldOrientation = "horizontal";
        body = (
          <Switch
            checked={field.value}
            onCheckedChange={field.onChange}
            // className="w-2/12"
          />
        );
        break;
      case "calendar":
        body = (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-60 pl-3 text-left font-normal",
                  !field.value && "text-muted-foreground"
                )}
              >
                {field.value ? (
                  format(field.value, "PPP")
                ) : (
                  <span>Pick a date</span>
                )}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
              </Button>
              {columnInfo.description && (
                <FieldDescription>{columnInfo.description}</FieldDescription>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                captionLayout="dropdown"
              />
            </PopoverContent>
          </Popover>
        );
        break;
      case "time":
        body = (
          <TimePicker
            defaultValue={columnInfo.defaultValue}
            onChange={field.onChange}
          />
        );
        break;
      case "calendar time":
        body = <Calendar24 className="w-full" {...field} />;
        break;
      case "select":
        body = (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder />
            </SelectTrigger>
            <SelectContent>
              {columnInfo.values.map((value: string) => (
                <SelectItem value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        break;
      case "search-select":
        body = (
          <SearchSelect
            data={columnInfo.values.map((value: string) => {
              return {
                value: value,
                label: value,
              };
            })}
            {...field}
          />
        );
        break;
      default:
        console.warn(
          `No input element found for column ${columnInfo.name} (entrytype: ${columnInfo.entrytype}). This is likely a bug.`
        );
        body = <></>;
        break;
    }

    return (
      <SingleFormElement
        key={columnInfo.name}
        orientation={fieldOrientation}
        title={columnInfo.name}
        body={body}
        description={columnInfo.description}
      />
    );
  }
}
