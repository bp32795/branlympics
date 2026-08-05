"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { reorderGamesAction } from "@/app/actions/games";
import { DeleteGameButton, EditGameForm } from "@/components/admin-game-forms";
import type { Game } from "@/lib/models";

export function SortableActivityList({ activities }: { activities: Game[] }) {
  const [items, setItems] = useState(activities);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;

    const previous = items;
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    setSaving(true);
    setError(undefined);

    try {
      await reorderGamesAction(reordered.map((item) => item.id));
    } catch {
      setItems(previous);
      setError("Could not save the new order. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-5 items-center justify-between gap-3 text-xs">
        <p className="text-zinc-500">Drag the grip to reorder.</p>
        {saving && <p className="text-fuchsia-300">Saving…</p>}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800">
            {items.map((activity) => (
              <SortableActivity
                key={activity.id}
                activity={activity}
                disabled={saving}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableActivity({
  activity,
  disabled,
}: {
  activity: Game;
  disabled: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id, disabled });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-start gap-3 bg-[#09030d] px-3 py-3 text-sm ${
        isDragging ? "relative z-10 shadow-[0_0_24px_rgba(255,43,214,0.35)]" : ""
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={`Drag to reorder ${activity.title}`}
        className="mt-1 flex h-10 w-10 shrink-0 touch-none cursor-grab items-center justify-center rounded-md border border-zinc-700 text-xl leading-none text-zinc-300 active:cursor-grabbing active:border-fuchsia-400 active:text-fuchsia-200 disabled:cursor-wait disabled:opacity-50"
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      {activity.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={activity.imageUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded border border-fuchsia-500/30 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium">{activity.title}</p>
        <div className="mt-2">
          <EditGameForm game={activity} />
        </div>
      </div>
      <DeleteGameButton gameId={activity.id} />
    </li>
  );
}
