import { View, Text, ScrollView, Pressable } from 'react-native';
import { ArrowUp, ArrowDown } from 'lucide-react-native';
import { cn } from '@/lib/cn';

// ─── Types ──────────────────────────────────────────────────────

interface Column<T> {
  key: string;
  label: string;
  width?: number;         // fixed width in px
  minWidth?: number;      // min width in px
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sticky?: boolean;       // sticky first column on horizontal scroll
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowPress?: (item: T) => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

// ─── TableHeader ────────────────────────────────────────────────

function TableHeader<T>({
  columns,
  sortKey,
  sortDirection,
  onSort,
}: {
  columns: Column<T>[];
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}) {
  return (
    <View className="flex-row border-b border-border-subtle bg-bg-secondary">
      {columns.map((col) => {
        const isSorted = sortKey === col.key;
        const SortIcon = sortDirection === 'asc' ? ArrowUp : ArrowDown;

        return (
          <Pressable
            key={col.key}
            onPress={() => col.sortable && onSort?.(col.key)}
            disabled={!col.sortable}
            className={cn(
              'flex-row items-center px-3 py-2.5',
              col.align === 'right' && 'justify-end',
              col.align === 'center' && 'justify-center',
            )}
            style={{
              width: col.width,
              minWidth: col.minWidth || 80,
              flex: col.width ? undefined : 1,
            }}
          >
            <Text className="font-inter-medium text-caption uppercase tracking-wide text-text-tertiary">
              {col.label}
            </Text>
            {col.sortable && isSorted && (
              <SortIcon size={12} color="#999999" style={{ marginLeft: 4 }} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── TableRow ───────────────────────────────────────────────────

function TableRowComponent<T>({
  item,
  columns,
  onPress,
}: {
  item: T;
  columns: Column<T>[];
  onPress?: (item: T) => void;
}) {
  const Row = (
    <View className="flex-row border-b border-border-subtle">
      {columns.map((col) => (
        <View
          key={col.key}
          className={cn(
            'justify-center px-3 py-3',
            col.align === 'right' && 'items-end',
            col.align === 'center' && 'items-center',
          )}
          style={{
            width: col.width,
            minWidth: col.minWidth || 80,
            flex: col.width ? undefined : 1,
          }}
        >
          {col.render ? (
            col.render(item)
          ) : (
            <Text className="font-inter-regular text-body-sm text-text-primary" numberOfLines={1}>
              {String((item as Record<string, unknown>)[col.key] ?? '')}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => onPress(item)}
        style={({ pressed }) => [pressed && { backgroundColor: '#FAFAFA' }]}
      >
        {Row}
      </Pressable>
    );
  }

  return Row;
}

// ─── Table (main export) ────────────────────────────────────────

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowPress,
  sortKey,
  sortDirection,
  onSort,
  loading,
  emptyMessage = 'No data found',
  className,
}: TableProps<T>) {
  if (loading) {
    return (
      <View className={cn('rounded-lg border border-border-default bg-white', className)}>
        <TableHeader columns={columns} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} className="flex-row border-b border-border-subtle px-3 py-3.5">
            <View className="h-4 flex-1 rounded bg-bg-tertiary" />
          </View>
        ))}
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className={cn('rounded-lg border border-border-default bg-white', className)}>
        <TableHeader columns={columns} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
        <View className="items-center py-12">
          <Text className="font-inter-regular text-body-md text-text-tertiary">
            {emptyMessage}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('rounded-lg border border-border-default bg-white', className)}
    >
      <View style={{ minWidth: '100%' }}>
        <TableHeader columns={columns} sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} />
        {data.map((item) => (
          <TableRowComponent
            key={keyExtractor(item)}
            item={item}
            columns={columns}
            onPress={onRowPress}
          />
        ))}
      </View>
    </ScrollView>
  );
}
