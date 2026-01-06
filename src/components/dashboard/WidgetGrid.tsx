import { ReactNode } from "react";
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
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";
import { WidgetLayout } from "@/stores/dashboardStore";

interface SortableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
  layout?: WidgetLayout;
}

function SortableItem({ id, children, disabled, layout }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  // Default to 3 columns if no layout specified
  const colSpan = layout?.colSpan ?? 3;
  const rowSpan = layout?.rowSpan ?? 1;

  // Build the grid classes based on colSpan
  const getColSpanClass = () => {
    switch (colSpan) {
      case 1: return "md:col-span-1";
      case 2: return "md:col-span-2";
      case 3: return "md:col-span-3";
      case 4: return "md:col-span-4";
      case 5: return "md:col-span-5";
      case 6: return "md:col-span-6";
      case 7: return "md:col-span-7";
      case 8: return "md:col-span-8";
      case 9: return "md:col-span-9";
      case 10: return "md:col-span-10";
      case 11: return "md:col-span-11";
      case 12: return "md:col-span-12";
      default: return "md:col-span-3";
    }
  };

  const getRowSpanStyle = () => {
    if (rowSpan <= 1) return {};
    return { gridRow: `span ${rowSpan}` };
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        ...getRowSpanStyle(),
      }}
      className={cn(
        "relative group h-full",
        isDragging && "z-50 opacity-90",
        // Mobile: force full width, Desktop: respect colSpan
        "col-span-12",
        getColSpanClass()
      )}
    >
      {!disabled && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-background border shadow-sm cursor-grab active:cursor-grabbing"
          aria-label="Arrastar widget"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
      {children}
    </div>
  );
}

interface WidgetGridItem {
  id: string;
  element: ReactNode;
  layout?: WidgetLayout;
}

interface WidgetGridProps {
  items: WidgetGridItem[];
  onReorder: (ids: string[]) => void;
  disabled?: boolean;
}

export function WidgetGrid({ items, onReorder, disabled }: WidgetGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newOrder = arrayMove(
        items.map((item) => item.id),
        oldIndex,
        newIndex
      );
      onReorder(newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={rectSortingStrategy}
        disabled={disabled}
      >
        <div className="grid grid-cols-12 gap-4 auto-rows-min">
          {items.map((item) => (
            <SortableItem 
              key={item.id} 
              id={item.id} 
              disabled={disabled}
              layout={item.layout}
            >
              {item.element}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
