// One search result inside the theme's SearchBar, laid out like the Altium 365 API reference's: kind pill, name (tool
// names in monospace), and on the right the tool group's chip, in the colour of its sidebar icon. `compact` is a
// recently opened entry: the first line only.
import React from 'react';
import base from '@altium-developer/docusaurus-theme/theme/SearchBar/styles.module.css';
import styles from './styles.module.css';

function GroupChip({ group }) {
  if (!group) return null;
  return <span className={`badge badge--secondary badge--context bc-${group.slug} ${styles.group}`}>{group.title}</span>;
}

export default function SearchResult({ record, words, compact, loaded, Highlight, KindPill }) {
  const group = record.c !== undefined ? loaded.groups?.[record.c] : undefined;
  return (
    <>
      <div className={base.line}>
        <KindPill kind={record.k} engine={loaded.engine} />
        <span className={record.x ? styles.tool : base.guideName}>
          {compact ? record.n : <Highlight text={record.n} words={words} />}
        </span>
        <span className={base.spacer} />
        <GroupChip group={group} />
      </div>
      {!compact && (record.d || record.t) && (
        <div className={base.description}>
          {record.t && record.t !== record.n && <span className={base.page}>{record.t} › </span>}
          {record.d && <Highlight text={record.d.length > 180 ? `${record.d.slice(0, 179)}…` : record.d} words={words} />}
        </div>
      )}
    </>
  );
}
