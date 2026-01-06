import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ColumnOption } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  GripVertical,
  Plus,
  Trash2,
  Check,
  X,
  Palette,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface OptionsEditorProps {
  options: ColumnOption[];
  onChange: (options: ColumnOption[]) => void;
}

const colorPresets = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899",
  "#06b6d4", "#ef4444", "#64748b", "#22c55e", "#a855f7",
];

const SortableOptionItem = ({
  option,
  onUpdate,
  onDelete,
  onSetDefault,
  isDefault,
}: {
  option: ColumnOption;
  onUpdate: (updates: Partial<ColumnOption>) => void;
  onDelete: () => void;
  onSetDefault: () => void;
  isDefault: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(option.label);
  const [editValue, setEditValue] = useState(option.value);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.value });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    onUpdate({ label: editLabel, value: editValue });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(option.label);
    setEditValue(option.value);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md border border-border bg-background",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Rótulo"
            className="h-7 text-xs flex-1"
          />
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Valor"
            className="h-7 text-xs w-24"
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: option.color || "#64748b" }}
          />
          <span
            className="flex-1 text-sm cursor-pointer hover:text-primary"
            onClick={() => setIsEditing(true)}
          >
            {option.label}
          </span>
          <span className="text-xs text-muted-foreground">{option.value}</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Palette className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid grid-cols-5 gap-1">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-md border-2",
                      option.color === color ? "border-primary" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdate({ color })}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1">
            <Checkbox
              checked={isDefault}
              onCheckedChange={() => onSetDefault()}
              className="h-4 w-4"
            />
            <span className="text-xs text-muted-foreground">Padrão</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </>
      )}
    </div>
  );
};

export const OptionsEditor = ({ options, onChange }: OptionsEditorProps) => {
  const [newLabel, setNewLabel] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = options.findIndex((opt) => opt.value === active.id);
      const newIndex = options.findIndex((opt) => opt.value === over.id);
      onChange(arrayMove(options, oldIndex, newIndex));
    }
  };

  const handleAddOption = () => {
    if (!newLabel.trim()) return;

    const newValue = newLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const newOption: ColumnOption = {
      value: newValue,
      label: newLabel.trim(),
      color: colorPresets[options.length % colorPresets.length],
    };

    onChange([...options, newOption]);
    setNewLabel("");
  };

  const handleUpdateOption = (value: string, updates: Partial<ColumnOption>) => {
    onChange(
      options.map((opt) =>
        opt.value === value ? { ...opt, ...updates } : opt
      )
    );
  };

  const handleDeleteOption = (value: string) => {
    onChange(options.filter((opt) => opt.value !== value));
  };

  const handleSetDefault = (value: string) => {
    onChange(
      options.map((opt) => ({
        ...opt,
        isDefault: opt.value === value ? !opt.isDefault : false,
      }))
    );
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">Opções</Label>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={options.map((opt) => opt.value)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {options.map((option) => (
              <SortableOptionItem
                key={option.value}
                option={option}
                onUpdate={(updates) => handleUpdateOption(option.value, updates)}
                onDelete={() => handleDeleteOption(option.value)}
                onSetDefault={() => handleSetDefault(option.value)}
                isDefault={option.isDefault || false}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-2">
        <Input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
          placeholder="Nova opção..."
          className="h-8 text-sm flex-1"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={!newLabel.trim()}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};
