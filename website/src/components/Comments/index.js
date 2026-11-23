import React from 'react';
import Giscus from '@giscus/react';
import { useColorMode } from '@docusaurus/theme-common';

// Page comments via giscus: GitHub Discussions in this repository's "Comments" category, one thread per page URL.
export default function Comments() {
  const { colorMode } = useColorMode();
  return (
    <Giscus
      repo="AltiumDeveloper/platform-mcp-docs"
      repoId="R_kgDOV4sT8w"
      category="Comments"
      categoryId="DIC_kwDOV4sT884DLysm"
      mapping="pathname"
      strict="1"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme={colorMode === 'dark' ? 'dark' : 'light'}
      lang="en"
      loading="lazy"
    />
  );
}
