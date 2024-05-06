import React from 'react';
import moment from 'moment';
import { Comment } from './types'; // 假设类型定义在单独文件

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="comment-list">
      {comments.map((item) => (
        <div className="comment-item" key={item.id}>
          <div className="comment-info">
            <span className="comment-name">{item.nickName || item.realName}</span>
            <span className="comment-time">{moment(item.gmtModified || item.gmtCreate).format("YYYY-MM-DD HH:mm:ss")}</span>
          </div>
          <div className="comment-content" dangerouslySetInnerHTML={{ __html: item.content }} />
        </div>
      ))}
    </div>
  );
};

export default CommentList;
