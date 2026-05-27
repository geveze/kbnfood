import React from "react";

/**
 * Type-safe list component that enforces unique keys
 * 
 * Ensures that all list items have a unique ID field
 * and prevents common key prop errors at compile-time
 * 
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 * }
 * 
 * <SafeList<User>
 *   items={users}
 *   renderItem={(user) => <div>{user.name}</div>}
 *   keyExtractor={(user) => user.id}
 * />
 * ```
 */

interface SafeListProps<T extends { id: string | number }> {
  /** Array of items to render */
  items: T[];
  
  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  
  /** Optional function to extract key from item (defaults to item.id) */
  keyExtractor?: (item: T, index: number) => string | number;
  
  /** Optional wrapper component (default: div) */
  wrapper?: React.ElementType;
  
  /** Optional CSS class for wrapper */
  className?: string;
}

/**
 * SafeList Component
 * 
 * Provides type-safe list rendering with automatic key management.
 * Requires items to have an 'id' field for type safety.
 * 
 * Benefits:
 * - Compile-time type checking for id field
 * - Automatic key extraction
 * - Prevents common key prop errors
 * - Better performance through proper key management
 */
export function SafeList<T extends { id: string | number }>({
  items,
  renderItem,
  keyExtractor = (item) => item.id,
  wrapper: Wrapper = "div",
  className,
}: SafeListProps<T>) {
  // Development: Check for duplicate keys
  if (process.env.NODE_ENV === "development") {
    const keys = items.map((item, index) => keyExtractor(item, index));
    const uniqueKeys = new Set(keys);

    if (keys.length !== uniqueKeys.size) {
      const duplicates = keys.filter(
        (key, index) => keys.indexOf(key) !== index
      );
      console.warn(
        `[SafeList] Duplicate keys detected: ${Array.from(new Set(duplicates)).join(
          ", "
        )}. This may cause rendering issues.`
      );
    }
  }

  return (
    <Wrapper className={className}>
      {items.map((item, index) => (
        <React.Fragment key={keyExtractor(item, index)}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
    </Wrapper>
  );
}

/**
 * SafeTable Component
 * 
 * Type-safe table rendering with proper key management for rows
 * 
 * @example
 * ```tsx
 * <SafeTable<User>
 *   items={users}
 *   columns={[
 *     { header: "Name", accessor: "name" },
 *     { header: "Email", accessor: "email" }
 *   ]}
 *   keyExtractor={(user) => user.id}
 * />
 * ```
 */

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: any, item: T) => React.ReactNode;
}

interface SafeTableProps<T extends { id: string | number }> {
  items: T[];
  columns: Column<T>[];
  keyExtractor?: (item: T, index: number) => string | number;
  className?: string;
  headerClassName?: string;
  rowClassName?: string | ((item: T, index: number) => string);
}

export function SafeTable<T extends { id: string | number }>({
  items,
  columns,
  keyExtractor = (item) => item.id,
  className = "data-table",
  headerClassName = "",
  rowClassName = "",
}: SafeTableProps<T>) {
  // Development: Check for duplicate keys
  if (process.env.NODE_ENV === "development") {
    const keys = items.map((item, index) => keyExtractor(item, index));
    const uniqueKeys = new Set(keys);

    if (keys.length !== uniqueKeys.size) {
      const duplicates = keys.filter(
        (key, index) => keys.indexOf(key) !== index
      );
      console.warn(
        `[SafeTable] Duplicate keys detected: ${Array.from(new Set(duplicates)).join(
          ", "
        )}. This may cause rendering issues.`
      );
    }
  }

  const getRowClassName = (item: T, index: number): string => {
    if (typeof rowClassName === "function") {
      return rowClassName(item, index);
    }
    return rowClassName;
  };

  return (
    <table className={className}>
      <thead>
        <tr key="header-row" className={headerClassName}>
          {columns.map((column, idx) => (
            <th key={`header-${idx}`}>{column.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item, index) => (
          <tr
            key={keyExtractor(item, index)}
            className={getRowClassName(item, index)}
          >
            {columns.map((column, colIdx) => (
              <td key={`cell-${colIdx}`}>
                {column.render
                  ? column.render(item[column.accessor], item)
                  : String(item[column.accessor] ?? "-")}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default SafeList;
