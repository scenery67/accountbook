import type { TagDraft, TagRecord } from "../types";

interface TagManagerProps {
  draft: TagDraft;
  tags: TagRecord[];
  disabled: boolean;
  labels: {
    title: string;
    subtitle: string;
    name: string;
    color: string;
    add: string;
    none: string;
    disable: string;
    sort: string;
  };
  onChange: (next: TagDraft) => void;
  onSubmit: () => void;
  onDisable: (tagId: string) => void;
}

export function TagManager({
  draft,
  tags,
  disabled,
  labels,
  onChange,
  onSubmit,
  onDisable,
}: TagManagerProps) {
  return (
    <section className="panel category-panel">
      <div className="panel-header">
        <div>
          <h2>{labels.title}</h2>
          <p className="muted">{labels.subtitle}</p>
        </div>
      </div>

      <form
        className="tag-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label>
          <span className="field-label">{labels.name}</span>
          <input
            type="text"
            value={draft.name}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            required
          />
        </label>
        <label>
          <span className="field-label">{labels.color}</span>
          <input
            type="color"
            value={draft.color}
            onChange={(event) => onChange({ ...draft, color: event.target.value })}
          />
        </label>
        <button className="secondary-button" type="submit" disabled={disabled}>
          {labels.add}
        </button>
      </form>

      <div className="category-list">
        {tags.length === 0 ? (
          <div className="empty-state">{labels.none}</div>
        ) : (
          tags.map((tag) => (
            <article key={tag.id} className="category-item">
              <div className="category-header">
                <div className="chip">
                  <span className="color-dot" style={{ background: tag.color }} />
                  <span>{tag.name}</span>
                </div>
                <button className="mini-button" type="button" onClick={() => onDisable(tag.id)}>
                  {labels.disable}
                </button>
              </div>
              <div className="pill-row">
                <span className="pill">{labels.sort} {tag.sortOrder}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
