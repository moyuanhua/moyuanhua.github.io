import React from 'react';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

export interface ProjectCardProps {
  title: { zh: string; en: string } | string;
  description: { zh: string; en: string } | string;
  link: string;
  image?: string;
  tags?: string[];
  status?: 'active' | 'archived' | 'maintenance';
  featured?: boolean;
}

export default function ProjectCard(props: ProjectCardProps): JSX.Element {
  const { title, description, link, image, tags = [], status = 'active', featured = false } = props;
  
  const displayTitle = typeof title === 'object' ? title.zh : title;
  const displayDescription = typeof description === 'object' ? description.zh : description;

  const statusLabels = {
    active: '活跃',
    archived: '已归档',
    maintenance: '维护中',
  };

  return (
    <div className={featured ? styles.projectCard + ' ' + styles.featured : styles.projectCard}>
      {image && (
        <div className={styles.projectImage}>
          <img src={image} alt={displayTitle} loading="lazy" />
        </div>
      )}
      <div className={styles.projectContent}>
        <div className={styles.projectHeader}>
          <h3 className={styles.projectTitle}>{displayTitle}</h3>
          <span className={styles.statusBadge + ' ' + styles['status' + status.charAt(0).toUpperCase() + status.slice(1)]}>
            {statusLabels[status]}
          </span>
        </div>
        <p className={styles.projectDescription}>{displayDescription}</p>
        {tags.length > 0 && (
          <div className={styles.projectTags}>
            {tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <Link
          className={styles.projectLink}
          to={link}
          target="_blank"
          rel="noopener noreferrer"
        >
          查看项目 →
        </Link>
      </div>
    </div>
  );
}
