// The tool-group filter next to the theme SearchBar's tabs, like the Altium 365 API reference's bounded-context
// select: "All tool groups", or one group of the sidebar's Tool reference.
import React, { useState } from 'react';
import base from '@altium-developer/docusaurus-theme/theme/SearchBar/styles.module.css';
import styles from '../SearchResult/styles.module.css';

export default function useSearchFilters({ loaded }) {
  const [toolGroup, setToolGroup] = useState(null);
  const controls = (
    <>
      <span className={base.spacer} />
      <select
        className={styles.select}
        value={toolGroup ?? ''}
        onChange={(event) => setToolGroup(event.target.value === '' ? null : Number(event.target.value))}
        aria-label="Tool group"
      >
        <option value="">All tool groups</option>
        {loaded?.groups?.map((g, i) => <option key={g.slug} value={i}>{g.title}</option>)}
      </select>
    </>
  );
  return { options: { toolGroup }, controls, key: String(toolGroup) };
}
