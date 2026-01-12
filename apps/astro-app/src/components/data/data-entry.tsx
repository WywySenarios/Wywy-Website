import type { JSX } from "astro/jsx-runtime";
import {
  ConstantFormElement,
  FormElement,
} from "@/components/data/input-elements";
import type { DataColumn, DescriptorInfo, TableInfo } from "@/env";
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
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SearchSelect } from "./input-element/search-select";

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

export interface TagName {
  id: string;
  tag_name: string;
}
interface TagNameRaw {
  id: number;
  tag_name: string;
}

function Tag({
  index,
  form,
  tags,
  remove,
}: {
  index: number;
  form: any;
  tags: Array<TagName>;
  remove: Function;
}): JSX.Element {
  const tagColumn: DataColumn = {
    name: index == 0 ? "Primary Tag" : "Tag",
    datatype: "enum",
    entrytype: "search-select",
    values: tags.map((tagInfo: TagName) => tagInfo.tag_name),
    defaultValue: tags[0].tag_name,
  };

  function controllerNamer(
    strings: TemplateStringsArray,
    name: string
  ): string {
    return `tags[${index}]`;
  }

  return (
    <div>
      {index == 0 ? (
        <FormElement
          form={form}
          columnInfo={tagColumn}
          controllerNamer={controllerNamer}
        />
      ) : (
        <div className="flex flex-row items-center justify-center gap-2">
          <ConstantFormElement
            form={form}
            columnInfo={tagColumn}
            controllerNamer={controllerNamer}
          />
          <Button
            onClick={() => {
              remove(index);
            }}
          >
            <Trash />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * The tagging related form component.
 * @param databaseName The name of the database that this form gathers data for.
 * @param tableName The name of the table that this form gathers data for.
 * @returns
 */
export function Tags({
  form,
  databaseName,
  tableInfo,
  dbURL,
}: {
  form: any;
  databaseName: string;
  tableInfo: TableInfo;
  dbURL: string;
}): JSX.Element {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `tags`,
  });
  const [tags, setTags] = useState<Array<TagName>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [nextTag, setNextTag] = useState<string>("");

  useEffect(() => {
    fetch(`${dbURL}/tags/${databaseName}/${tableInfo.tableName}`).then(
      (res: Response) => {
        if (res.ok)
          res
            .json()
            .then((data) => {
              setTags(
                data["tags"].map((item: TagNameRaw) => {
                  return {
                    id: String(item.id),
                    tag_name: item.tag_name,
                  };
                })
              );
              setLoading(false);
            })
            .catch(() => {
              toast(
                "Failed to get the tag names. Please reload the page to try again."
              );
              setLoading(false);
            });
      }
    );
  }, []);
  useEffect(() => {
    // @TODO better default value
    if (fields.length == 0 && tags.length > 0) append(tags[0].tag_name);
  }, [tags]);

  if (loading) {
    return <p>Loading...</p>;
  } else {
    return (
      <Card>
        <CardHeader>Tags</CardHeader>
        <CardContent className="flex flex-col gap-2 justify-center">
          {fields.map((field: Record<"id", string>, index: number) => (
            <Tag
              key={field.id}
              index={index}
              form={form}
              tags={tags}
              remove={remove}
            ></Tag>
          ))}
        </CardContent>
        <CardFooter>
          <SearchSelect
            data={tags.map((value: TagName) => {
              return {
                value: value.id,
                label: value.tag_name,
              };
            })}
            value={nextTag}
            onChange={setNextTag}
          />
          <Button
            onClick={() => {
              // @TODO better default value
              append(tags[0].tag_name);
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
      <Button
        onClick={() => {
          remove(index);
        }}
        className="w-full"
        type="button"
      >
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
    name: `descriptor.${descriptorInfo.name}`,
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
