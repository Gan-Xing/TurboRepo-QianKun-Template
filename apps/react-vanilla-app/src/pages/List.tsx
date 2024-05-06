import React from 'react';
import './Path.css'; // 样式文件的引用方式也做相应调整

// 假设类型定义如下
type MilestoneData = {
  id: number;
  label: string;
  slug: string;
  [key: string]: any; // 允许任意类型的额外键值对
};

type MilestoneProps = {
  label: string;
  slug: string;
} & React.HTMLAttributes<HTMLDivElement>; // 扩展标准的 HTML div 属性

const milestones: MilestoneData[] = [
  { id: 1, label: 'Comment', slug: 'comment' },
  { id: 2, label: 'Editor', slug: 'editor' },
  { id: 3, label: 'Ajax', slug: 'ajax' },
  { id: 4, label: 'ES6', slug: 'es6' },
  { id: 5, label: 'HomeBrew', slug: 'homebrew' },
  { id: 6, label: 'NPM', slug: 'npm' },
  { id: 7, label: 'Gulp', slug: 'gulp' },
  { id: 8, label: 'Git', slug: 'git' },
  { id: 9, label: 'React', slug: 'react' },
  { id: 10, label: '物流项目', slug: 'logimate' }
];

const Milestone: React.FC<MilestoneProps> = ({ label, slug }) => {
  return (
    <a className="milestone" href={`/${slug}`}>
      <div className="milestoneInner">
        <div className="milestoneFront">
          <h2 className="label">{label}</h2>
        </div>
        <div className="milestoneBack">
          <h2 className="label">More Info</h2>
          这是更多的内容
        </div>
      </div>
    </a>
  );
};

const Path = () => {
  return (
    <div className="pathContainer">
      {milestones.map((milestone, index) => (
        <Milestone
          key={milestone.id}
          label={milestone.label}
          slug={milestone.slug}
        />
      ))}
    </div>
  );
};

export default Path;
