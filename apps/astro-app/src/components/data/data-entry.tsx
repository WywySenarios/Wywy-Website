import type { JSX } from "astro/jsx-runtime";
import { FormElement } from "@/components/data/input-elements";
import type { DataColumn, DescriptorInfo, TableInfo } from "@/env";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Columns({
  fieldsToEnter,
  form,
}: {
  fieldsToEnter: Array<DataColumn>;
  form: any;
}): JSX.Element {
  return (
    <div>
      {fieldsToEnter.map((columnInfo: DataColumn) => {
        return (
          <FormElement
            key={columnInfo.name + "-form-element"}
            form={form}
            columnInfo={columnInfo}
          />
        );
      })}
    </div>
  );
}

/**
 * The tagging related form component.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableName The name of the table that this form gathers data for.
 * @returns
 */
export function Tags({}: {
  databaseName: string;
  tableName: string;
  dbURL: string;
}): JSX.Element {
  return <></>;
}

/**
 * Renders the form components for a descriptor. ?????/
 * @param index The index of the Zod schema this relates to. Specifically, the controller name will be: "descriptors.${name}[${index}]..."
 * @param descriptorInfo The schema for the respective descriptor.
 * @param form The controller for the overarching form.
 * @returns
 */
function Descriptor({
  index,
  descriptorInfo,
  form,
}: {
  index: number;
  descriptorInfo: DescriptorInfo;
  form: any;
}): JSX.Element {
  return (
    <Card>
      {descriptorInfo.schema.map((columnInfo: DataColumn) => {
        return (
          <FormElement
            key={`${descriptorInfo.name}[${index}]-${columnInfo.name}-form-element`}
            form={form}
            columnInfo={columnInfo}
            controllerNamer={(strings: TemplateStringsArray, name: string) =>
              `descriptors.${descriptorInfo.name}[${index}].${strings[0]}${name}${strings[1]}`
            }
          />
        );
      })}
    </Card>
  );
}

/**
 * This component contains all the input components for the respective descriptor. It also interacts with the form controller.
 * @param databaseName The name of the database that this form gathers data for.
 * @param descriptorInfo The schema for the respective descriptor.
 * @param form The controller for the overarching form.
 * @returns
 */
function DescriptorType({
  descriptorInfo,
  form,
}: {
  descriptorInfo: DescriptorInfo;
  form: any;
}): JSX.Element {
  return null;
}

/**
 * The desciptor related form component. Dialogs are used to enter in the descriptors because it is assumed that each desciptor does not have a lot of associated information.
 * @param tableInfo The schema for the respective table.
 * @param form The controller for the overarching form.
 * @returns
 */
export function Descriptors({
  tableInfo,
  form,
}: {
  tableInfo: TableInfo;
  form: any;
}): JSX.Element {
  interface DescriptorElementInfo {
    index: number;
    descriptorInfo: DescriptorInfo;
  }
  // assume that tableInfo contains descriptors
  const [nextDescriptorName, setNextDescriptorName] = useState<string>(
    tableInfo.descriptors[0].name
  );
  const [activeDescriptors, setActiveDescriptors] = useState<
    Array<DescriptorElementInfo>
  >([]);
  const { fields, append, remove } = useFieldArray({
    form,
    name: "",
  });

  function addDescriptor() {
    setActiveDescriptors([
      {
        index: 0,
        // Since nextDescriptorName is guarenteed to be inside of taleInfo.descriptors (thanks to the Select component),
        // we guarentee that the find method will return a DescriptorInfo and will not return undefined.
        descriptorInfo: tableInfo.descriptors.find(
          (e) => e.name == nextDescriptorName
        ) as DescriptorInfo,
      },
      ...activeDescriptors,
    ]);
  }

  return (
    <Card className="flex flex-col justify-center items-center">
      {activeDescriptors.map((descriptorElementInfo: DescriptorElementInfo) => (
        <Descriptor {...descriptorElementInfo} form={form} />
      ))}
      <div className="w-[50%] min-w-[180px] flex flex-row justify-center">
        <Select
          value={nextDescriptorName}
          onValueChange={setNextDescriptorName}
        >
          <SelectTrigger className="w-[50%] min-w-[180px]">
            <SelectValue placeholder={tableInfo.descriptors[0].name} />
          </SelectTrigger>
          <SelectContent>
            {tableInfo.descriptors.map((descriptor: DescriptorInfo) => (
              <SelectItem key={descriptor.name} value={descriptor.name}>
                {descriptor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          disabled={!nextDescriptorName}
          onClick={addDescriptor}
          variant="outline"
        >
          <Plus />
        </Button>
      </div>
    </Card>
  );
}
