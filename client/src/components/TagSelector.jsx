import './TagSelector.css';

export default function TagSelector({ label, tags, selected, onChange, small }) {
  const toggleTag = (tag) => {
    if (!onChange) return;
    const next = selected.includes(tag)
      ? selected.filter((item) => item !== tag)
      : [...selected, tag];
    onChange(next);
  };

  return (
    <div className={`tag-selector ${small ? 'small' : ''}`}>
      <div className="tag-selector-label">{label}</div>
      <div className="tag-selector-grid">
        {tags.map((tag) => (
          <button
            type="button"
            key={tag}
            className={`tag-chip ${selected.includes(tag) ? 'selected' : ''}`}
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
