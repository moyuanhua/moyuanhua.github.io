import React from 'react';
import ProjectCard from '../ProjectCard';
import projectsData from '@site/src/data/projects.json';
import styles from './styles.module.css';

export default function HomepageFeatures(): JSX.Element {
  const featuredProjects = projectsData.projects
    .filter(project => project.featured && project.status === 'active')
    .sort((a, b) => (a.order || 999) - (b.order || 999));

  return (
    <section className={styles.features}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <h2>精选项目</h2>
          <p>这里展示了一些我的代表性项目和开源贡献</p>
        </div>
        <div className={styles.projectGrid}>
          {featuredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              title={project.title}
              description={project.description}
              link={project.link}
              image={project.image}
              tags={project.tags}
              status={project.status}
              featured={project.featured}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
