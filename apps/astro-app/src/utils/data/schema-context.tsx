import { createContext, useContext, type ReactNode } from "react";
import type { DatabaseInfo, TableInfo } from "@/types/data";

interface SchemaContextValue {
  databaseInfo: DatabaseInfo | null;
  tableInfo: TableInfo | null;
}

const SchemaContext = createContext<SchemaContextValue>({
  databaseInfo: null,
  tableInfo: null,
});

/**
 * Provides SchemaContext to a React subtree. Wraps at the page level so that
 * child components can access database/table info via hooks instead of prop drilling.
 */
export function SchemaProvider({
  databaseInfo,
  tableInfo = null,
  children,
}: {
  databaseInfo: DatabaseInfo | null;
  tableInfo?: TableInfo | null;
  children: ReactNode;
}) {
  return (
    <SchemaContext.Provider value={{ databaseInfo, tableInfo }}>
      {children}
    </SchemaContext.Provider>
  );
}

/**
 * Returns the current DatabaseInfo. Throws if called outside a SchemaProvider
 * or when databaseInfo is null (pages outside the data system).
 */
export function useDatabaseInfo(): DatabaseInfo {
  const ctx = useContext(SchemaContext);
  if (!ctx.databaseInfo) {
    throw new Error(
      "useDatabaseInfo must be used within a SchemaProvider with a valid databaseInfo",
    );
  }
  return ctx.databaseInfo;
}

/**
 * Returns the current database name. Shorthand for useDatabaseInfo().dbname.
 */
export function useDatabaseName(): string {
  return useDatabaseInfo().dbname;
}

/**
 * Returns the current TableInfo, or null on pages without a table scope (e.g. dashboard).
 */
export function useTableInfo(): TableInfo | null {
  return useContext(SchemaContext).tableInfo;
}

/**
 * Returns the current table name, or null on the dashboard.
 */
export function useTableName(): string | null {
  return useTableInfo()?.tableName ?? null;
}
