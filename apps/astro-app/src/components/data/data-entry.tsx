import type { JSX } from "astro/jsx-runtime";
import {
  ConstantFormElement,
  FormElement,
} from "@/components/data/input-elements";
import type { DataColumn, DescriptorInfo, TableInfo } from "@/types/data";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@radix-ui/react-tabs";
import { useFieldArray, type UseFieldArrayRemove } from "react-hook-form";
import { getDefaultValues } from "./form-helper";
import { SearchSelect } from "./input-element/search-select";
import { useMemo, useState } from "react";
import type { TAG_NAMES_DATASET } from "@utils/data/schema";

export function Columns({
  fieldsToEnter,
  form,
}: {
  fieldsToEnter: Array<DataColumn>;
  form: any;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
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
 * The tagging section of the form. This includes the primary_tag and the secondary tags.
 * @param tags The respective tag_names dataset.
 * @returns
 */
export function Tags({
  form,
  tagNamesDataset,
}: {
  form: any;
  tagNamesDataset: TAG_NAMES_DATASET;
}): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `tags`,
  });
  const [nextTag, setNextTag] = useState<string>("");

  const values = useMemo(() => {
    return tagNamesDataset.data.map((row: [number, string]) => String(row[0]));
  }, [tagNamesDataset]);

  const labels = useMemo(() => {
    return tagNamesDataset.data.map((row: [number, string]) => row[1]);
  }, [tagNamesDataset]);

  const defaultValue = useMemo(() => {
    return String(tagNamesDataset.data[0][0]);
  }, [tagNamesDataset]);

  const searchSelectData = useMemo(() => {
    return tagNamesDataset.data.map((row: [number, string]) => {
      return {
        value: String(row[0]),
        label: row[1],
      };
    });
  }, [tagNamesDataset]);

  return (
    <Card>
      <CardHeader>Tags</CardHeader>
      <CardContent className="flex flex-col gap-2 justify-center">
        {/* Primary tag */}
        <FormElement
          form={form}
          columnInfo={{
            name: "Primary Tag",
            datatype: "enum",
            entrytype: "search-select",
            values: values as [string, ...string[]], // @TODO fix TAG_NAMES_DATASET type
            labels: labels,
            defaultValue: defaultValue,
          }}
          controllerNamer={(strings: TemplateStringsArray, name: string) => {
            return `data.primary_tag`;
          }}
        />
        {/* Secondary tags */}
        {fields.map((field: Record<"id", string>, index: number) => (
          <div
            key={field.id}
            className="flex flex-row items-center justify-center gap-2"
          >
            <ConstantFormElement
              form={form}
              columnInfo={{
                name: "Tag",
                datatype: "enum",
                entrytype: "search-select",
                values: values as [string, ...string[]], // @TODO fix TAG_NAMES_DATASET type
                labels: labels,
                defaultValue: defaultValue,
              }}
              controllerNamer={(
                strings: TemplateStringsArray,
                name: string,
              ) => {
                return `tags[${index}]`;
              }}
            />
            <Button
              onClick={() => {
                remove(index);
              }}
              type="button"
            >
              <Trash />
            </Button>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <SearchSelect
          data={searchSelectData}
          value={nextTag}
          onChange={setNextTag}
        />
        <Button
          onClick={() => {
            // @TODO better default value
            append(nextTag ? nextTag : defaultValue);
          }}
          className="w-full"
          type="button"
        >
          <Plus />
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Renders the form components for a descriptor.
 * @param index The index of the Zod schema this relates to. Specifically, the controller name will be: "descriptors.${name}[${index}]..."
 * @param descriptorInfo The schema for the respective descriptor.
 * @param form The controller for the overarching form.
 * @param remove The function that removes this descriptor's link to the form.
 * @returns
 */
function Descriptor({
  index,
  descriptorInfo,
  form,
  remove,
}: {
  index: number;
  descriptorInfo: DescriptorInfo;
  form: any;
  remove: UseFieldArrayRemove;
}): JSX.Element {
  return (
    <div>
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
      <Button onClick={() => remove(index)} className="w-full" type="button">
        <Trash />
      </Button>
    </div>
  );
}

/**
 * This component contains all the input components for the respective descriptor. It also interacts with the form controller.
 * @param databaseName The name of the database that this form gathers data for.
 * @param descriptorInfo The schema for the respective descriptor.
 * @param form The controller for the overarching form.
 * @returns
 */
function DescriptorTab({
  descriptorInfo,
  form,
}: {
  descriptorInfo: DescriptorInfo;
  form: any;
}): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `descriptors.${descriptorInfo.name}`,
  });

  return (
    <Card>
      <CardHeader>{descriptorInfo.name}</CardHeader>
      <CardContent>
        {fields.map((field: Record<"id", string>, index: number) => (
          <Descriptor
            key={field.id}
            index={index}
            descriptorInfo={descriptorInfo}
            form={form}
            remove={remove}
          />
        ))}
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => {
            append(getDefaultValues(descriptorInfo.schema));
          }}
          className="w-full"
          type="button"
        >
          <Plus />
        </Button>
      </CardFooter>
    </Card>
  );
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
  if (tableInfo.descriptors.length == 0) return null;

  console.log(form.getValues());

  return (
    <Card className="flex flex-col justify-center">
      <CardHeader>Descriptors</CardHeader>
      <CardContent>
        <Tabs defaultValue={tableInfo.descriptors[0].name}>
          <TabsList>
            {tableInfo.descriptors.map((descriptor: DescriptorInfo) => (
              <TabsTrigger
                key={`${descriptor.name}-tab-trigger`}
                value={descriptor.name}
              >
                {descriptor.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {tableInfo.descriptors.map((descriptor: DescriptorInfo) => (
            <TabsContent key={`${descriptor.name}-tab`} value={descriptor.name}>
              <DescriptorTab descriptorInfo={descriptor} form={form} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
