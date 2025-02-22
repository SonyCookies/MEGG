"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripHorizontal } from "lucide-react"

export function DraggableTab({ tab, isActive, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tab.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  }

  const Icon = tab.icon

  return (
    <button
      ref={setNodeRef}
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tab.id}-tab`}
      style={style}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative
        ${isDragging ? "shadow-lg" : ""}
        ${isActive ? "bg-[#0e5f97] text-white" : "bg-white text-gray-600 hover:bg-gray-100"}
        ${isDragging ? "opacity-75" : "opacity-100"}
      `}
      {...attributes}
    >
      <div className="cursor-grab active:cursor-grabbing p-1 -ml-2 hover:bg-black/5 rounded" {...listeners}>
        <GripHorizontal className="h-4 w-4" />
      </div>
      <Icon className="h-4 w-4" />
      {tab.label}
    </button>
  )
}

