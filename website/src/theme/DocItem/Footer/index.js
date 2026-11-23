import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import Heading from '@theme-original/Heading';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import Comments from '@site/src/components/Comments';

// Every page shows comments unless its front matter sets `comments: false`.
export default function FooterWrapper(props) {
  const { metadata } = useDoc();
  const { comments = true } = metadata.frontMatter;
  return (
    <>
      <Footer {...props} />
      {comments && (
        <>
          <br />
          <Heading as="h2" id="comments">Comments</Heading>
          <Comments />
        </>
      )}
    </>
  );
}
