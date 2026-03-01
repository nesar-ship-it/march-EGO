import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal as RNModal } from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { cn } from '@/lib/cn';

// ─── Types ──────────────────────────────────────────────────────

interface FilterOption {
  value: string;
  label: string;
}

interface FilterConfig {
  key: string;
  label: string;
  type: 'single' | 'multi';
  options: FilterOption[];
}

interface FilterBarProps {
  filters: FilterConfig[];
  activeFilters: Record<string, string | string[]>;
  onFilterChange: (key: string, value: string | string[] | undefined) => void;
  onClearAll: () => void;
  className?: string;
}

// ─── FilterChip ─────────────────────────────────────────────────

function FilterChip({
  config,
  activeValue,
  onPress,
}: {
  config: FilterConfig;
  activeValue?: string | string[];
  onPress: () => void;
}) {
  const isActive =
    activeValue !== undefined &&
    (Array.isArray(activeValue) ? activeValue.length > 0 : activeValue !== '');

  const displayLabel = () => {
    if (!isActive) return config.label;
    if (config.type === 'single') {
      const opt = config.options.find((o) => o.value === activeValue);
      return opt?.label || config.label;
    }
    if (Array.isArray(activeValue) && activeValue.length > 0) {
      if (activeValue.length === 1) {
        return config.options.find((o) => o.value === activeValue[0])?.label || config.label;
      }
      return `${config.label} (${activeValue.length})`;
    }
    return config.label;
  };

  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'mr-2 flex-row items-center rounded-md border px-2.5 py-1.5',
        isActive
          ? 'border-interactive-primary bg-interactive-primary'
          : 'border-border-default bg-white',
      )}
    >
      <Text
        className={cn(
          'font-inter-medium text-label-sm',
          isActive ? 'text-white' : 'text-text-secondary',
        )}
      >
        {displayLabel()}
      </Text>
      <ChevronDown
        size={14}
        color={isActive ? '#FFFFFF' : '#999999'}
        style={{ marginLeft: 4 }}
      />
    </Pressable>
  );
}

// ─── FilterDropdown ─────────────────────────────────────────────

function FilterDropdown({
  config,
  activeValue,
  onSelect,
  onClose,
}: {
  config: FilterConfig;
  activeValue?: string | string[];
  onSelect: (value: string | string[] | undefined) => void;
  onClose: () => void;
}) {
  const [localValue, setLocalValue] = useState<string[]>(
    Array.isArray(activeValue)
      ? activeValue
      : activeValue
        ? [activeValue]
        : [],
  );

  const handleOptionPress = (optionValue: string) => {
    if (config.type === 'single') {
      onSelect(optionValue === activeValue ? undefined : optionValue);
      onClose();
    } else {
      setLocalValue((prev) =>
        prev.includes(optionValue)
          ? prev.filter((v) => v !== optionValue)
          : [...prev, optionValue],
      );
    }
  };

  const handleApply = () => {
    onSelect(localValue.length > 0 ? localValue : undefined);
    onClose();
  };

  const handleClear = () => {
    onSelect(undefined);
    onClose();
  };

  return (
    <RNModal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <View className="max-h-[50%] rounded-t-xl bg-white pb-6">
          <View className="items-center py-3">
            <View className="h-1 w-9 rounded-full bg-border-default" />
          </View>

          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="font-inter-semibold text-h3 text-text-primary">
              {config.label}
            </Text>
            <Pressable onPress={handleClear}>
              <Text className="font-inter-medium text-label-md text-text-tertiary">
                Clear
              </Text>
            </Pressable>
          </View>

          <ScrollView className="px-2">
            {config.options.map((option) => {
              const isSelected =
                config.type === 'single'
                  ? activeValue === option.value
                  : localValue.includes(option.value);

              return (
                <Pressable
                  key={option.value}
                  onPress={() => handleOptionPress(option.value)}
                  className={cn(
                    'mx-2 flex-row items-center justify-between rounded-md px-3 py-3',
                    isSelected && 'bg-bg-tertiary',
                  )}
                >
                  <Text
                    className={cn(
                      'font-inter-regular text-body-md',
                      isSelected ? 'font-inter-medium text-text-primary' : 'text-text-secondary',
                    )}
                  >
                    {option.label}
                  </Text>
                  {isSelected && <Check size={16} color="#0A0A0A" />}
                </Pressable>
              );
            })}
          </ScrollView>

          {config.type === 'multi' && (
            <View className="mt-3 px-4">
              <Pressable
                onPress={handleApply}
                className="h-10 items-center justify-center rounded-md bg-interactive-primary"
              >
                <Text className="font-inter-medium text-label-lg text-white">
                  Apply{localValue.length > 0 ? ` (${localValue.length})` : ''}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Pressable>
    </RNModal>
  );
}

// ─── FilterBar (main export) ────────────────────────────────────

export function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll,
  className,
}: FilterBarProps) {
  const [openFilterKey, setOpenFilterKey] = useState<string | null>(null);

  const hasActiveFilters = Object.values(activeFilters).some((v) =>
    Array.isArray(v) ? v.length > 0 : v !== undefined && v !== '',
  );

  const openConfig = filters.find((f) => f.key === openFilterKey);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className={cn('flex-row', className)}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {filters.map((config) => (
          <FilterChip
            key={config.key}
            config={config}
            activeValue={activeFilters[config.key]}
            onPress={() => setOpenFilterKey(config.key)}
          />
        ))}

        {hasActiveFilters && (
          <Pressable
            onPress={onClearAll}
            className="flex-row items-center rounded-md px-2.5 py-1.5"
          >
            <X size={14} color="#999999" style={{ marginRight: 4 }} />
            <Text className="font-inter-medium text-label-sm text-text-tertiary">
              Clear all
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* Active filter dropdown */}
      {openConfig && (
        <FilterDropdown
          config={openConfig}
          activeValue={activeFilters[openConfig.key]}
          onSelect={(value) => onFilterChange(openConfig.key, value)}
          onClose={() => setOpenFilterKey(null)}
        />
      )}
    </>
  );
}
