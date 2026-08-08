import { useMemo, useState } from "react";
import { formatDisplayDate, toLocalDateString } from "../lib/date";
import type { ChecklistItem } from "../lib/types";
import { useChecklistActions } from "../lib/queries";
import { Badge, Button, Card, Input } from "./ui";
import { Modal } from "./modal";

export function ManagePanel({ items }: { items: ChecklistItem[] }) {
  const { addChecklistItem, renameChecklistItem, archiveChecklistItem, reorderChecklistItem } =
    useChecklistActions();
  const [draft, setDraft] = useState("");
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const sortedItems = useMemo(() => [...items].sort((a, b) => a.sortOrder - b.sortOrder), [items]);

  async function addItem() {
    const label = draft.trim();
    if (!label) {
      return;
    }
    await addChecklistItem(label);
    setDraft("");
  }

  async function saveRename() {
    if (!editingItem) {
      return;
    }
    const label = renameValue.trim();
    if (!label) {
      return;
    }
    await renameChecklistItem(editingItem.id, label);
    setEditingItem(null);
  }

  async function archiveItem(item: ChecklistItem) {
    await archiveChecklistItem(item.id);
  }

  async function moveItem(item: ChecklistItem, direction: -1 | 1) {
    const index = sortedItems.findIndex((entry) => entry.id === item.id);
    const neighbor = sortedItems[index + direction];
    if (!neighbor) {
      return;
    }
    await reorderChecklistItem(item.id, neighbor.sortOrder);
    await reorderChecklistItem(neighbor.id, item.sortOrder);
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            Checklist management
          </div>
          <h2 className="mt-1 text-xl font-semibold">Add, rename, archive, reorder</h2>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Add a new checklist item"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void addItem();
              }
            }}
          />
          <Button onClick={() => void addItem()}>Add item</Button>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Items</h3>
          <Badge tone="muted">{sortedItems.length} total</Badge>
        </div>

        <div className="space-y-2">
          {sortedItems.map((item, index) => {
            const archived = Boolean(item.archivedAt);
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-card px-4 py-3 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`truncate text-sm font-medium ${archived ? "text-muted line-through" : "text-primary"}`}
                    >
                      {item.label}
                    </span>
                    {archived ? <Badge tone="muted">Archived</Badge> : <Badge tone="neutral">Active</Badge>}
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted">
                    Created {formatDisplayDate(toLocalDateString(item.createdAt))}
                    {item.archivedAt
                      ? ` - Archived ${formatDisplayDate(toLocalDateString(item.archivedAt))}`
                      : ""}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditingItem(item);
                      setRenameValue(item.label);
                    }}
                  >
                    Rename
                  </Button>
                  <Button variant="secondary" onClick={() => void moveItem(item, -1)} disabled={index === 0}>
                    Up
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void moveItem(item, 1)}
                    disabled={index === sortedItems.length - 1}
                  >
                    Down
                  </Button>
                  <Button variant="danger" onClick={() => void archiveItem(item)} disabled={archived}>
                    Archive
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal open={editingItem !== null} title="Rename item" onClose={() => setEditingItem(null)}>
        <div className="space-y-4">
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Item name"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveRename();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveRename()}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
