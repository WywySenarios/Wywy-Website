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
import { getDefaultValues } from "@utils/data/default-values";
import { SearchSelect } from "./input-element/search-select";
import { useMemo, useState } from "react";
import type { TAG_NAMES_DATASET } from "@utils/data/schema";
import { toSnakeCase } from "@utils/parse";

export function Columns({
  fieldsToEnter,
  form,
  controllerNamer = (strings: TemplateStringsArray, name: string) =>
    `data.${strings[0]}${name}${strings[1]}`,
}: {
  fieldsToEnter: Array<DataColumn>;
  form: any;
  controllerNamer?: (strings: TemplateStringsArray, name: string) => string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      {fieldsToEnter.map((columnInfo: DataColumn) => {
        return (
          <FormElement
            key={columnInfo.name + "-form-element"}
            form={form}
            columnInfo={columnInfo}
            controllerNamer={controllerNamer}
          />
        );
      })}
    </div>
  );
}

/**
 * The input element for the primary tag.
 * @param controller The form controller.
 * @param fieldPath The path of the primary tag field.
 * @param tagsDataset The tags that are available to select.
 */
export function PrimaryTag({
  controller,
  fieldPath,
  tagsDataset,
}: {
  controller: any;
  tagsDataset: TAG_NAMES_DATASET;
  fieldPath: string;
}) {
  const values = useMemo(() => {
    return tagsDataset.data.map((row: [number, string]) => String(row[0]));
  }, [tagsDataset]);

  const labels = useMemo(() => {
    return tagsDataset.data.map((row: [number, string]) => row[1]);
  }, [tagsDataset]);

  const defaultValue = useMemo(() => {
    return String(tagsDataset.data[0][0]);
  }, [tagsDataset]);

  return (
    <FormElement
      form={controller}
      columnInfo={{
        name: "Primary Tag",
        datatype: "enum",
        entrytype: "search-select",
        values: values as [string, ...string[]], // @TODO fix TAG_NAMES_DATASET type
        labels: labels,
        defaultValue: defaultValue,
      }}
      controllerNamer={(strings: TemplateStringsArray, name: string) => {
        return fieldPath;
      }}
    />
  );
}

/**
 * The tagging section of the form. This includes the primary_tag and the secondary tags.
 * @param form The form contrller.
 * @param tagsDataset The tags that are available to select.
 * @returns
 */
export function Tags({
  form,
  tagsDataset,
}: {
  form: any;
  tagsDataset: TAG_NAMES_DATASET;
}): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `tags`,
  });
  const [nextTag, setNextTag] = useState<string>("");

  const values = useMemo(() => {
    return tagsDataset.data.map((row: [number, string]) => String(row[0]));
  }, [tagsDataset]);

  const labels = useMemo(() => {
    return tagsDataset.data.map((row: [number, string]) => row[1]);
  }, [tagsDataset]);

  const defaultValue = useMemo(() => {
    return String(tagsDataset.data[0][0]);
  }, [tagsDataset]);

  const searchSelectData = useMemo(() => {
    return tagsDataset.data.map((row: [number, string]) => {
      return {
        value: String(row[0]),
        label: row[1],
      };
    });
  }, [tagsDataset]);

  return (
    <Card>
      <CardHeader>Tags</CardHeader>
      <CardContent className="flex flex-col gap-2 justify-center">
        {/* Primary tag */}
        <PrimaryTag
          controller={form}
          fieldPath="data.primary_tag"
          tagsDataset={tagsDataset}
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
          defaultValue={defaultValue}
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
  const descriptorName = toSnakeCase(descriptorInfo.name);
  return (
    <div>
      {descriptorInfo.schema.map((columnInfo: DataColumn) => {
        return (
          <FormElement
            key={`${descriptorName}[${index}]-${toSnakeCase(columnInfo.name)}-form-element`}
            form={form}
            columnInfo={columnInfo}
            controllerNamer={(strings: TemplateStringsArray, name: string) =>
              `descriptors.${descriptorName}[${index}].${strings[0]}${name}${strings[1]}`
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
    name: `descriptors.${toSnakeCase(descriptorInfo.name)}`,
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
            append(getDefaultValues(descriptorInfo));
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
