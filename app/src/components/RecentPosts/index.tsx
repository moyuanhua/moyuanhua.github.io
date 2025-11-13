import React from 'react';
import Link from '@docusaurus/Link';
import { usePluginData } from '@docusaurus/useGlobalData';
import styles from './styles.module.css';

interface BlogPost {
  id: string;
  metadata: {
    title: string;
    description?: string;
    formattedDate: string;
    permalink: string;
    tags: Array<{ label: string; permalink: string }>;
  };
}

export default function RecentPosts(): JSX.Element {
  const blogData = usePluginData('docusaurus-plugin-content-blog', 'default') as { 
    recentPosts: BlogPost[] 
  };
  
  const recentPosts = (blogData?.recentPosts || []).slice(0, 5);

  if (recentPosts.length === 0) {
    return null;
  }

  return (
    <section className={styles.recentPosts}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2>最新博文</h2>
          <p>分享技术见解和项目经验</p>
        </div>
        <div className={styles.postsGrid}>
          {recentPosts.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <Link to={post.metadata.permalink} className={styles.postLink}>
                <h3 className={styles.postTitle}>{post.metadata.title}</h3>
                <p className={styles.postDescription}>
                  {post.metadata.description || '点击阅读全文...'}
                </p>
                <div className={styles.postMeta}>
                  <time className={styles.postDate}>{post.metadata.formattedDate}</time>
                  {post.metadata.tags.length > 0 && (
                    <div className={styles.postTags}>
                      {post.metadata.tags.slice(0, 3).map((tag) => (
                        <span key={tag.label} className={styles.tag}>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
        <div className={styles.viewAll}>
          <Link to="/blog" className="button button--primary button--lg">
            查看所有文章 →
          </Link>
        </div>
      </div>
    </section>
  );
}
