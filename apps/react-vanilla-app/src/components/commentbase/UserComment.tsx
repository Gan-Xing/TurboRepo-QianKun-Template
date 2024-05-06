import React, { useState, useEffect, useCallback } from 'react';
import { getComments } from './api';
import CommentEditor from './CommentEditor';
import CommentList from './CommentList';
import { Comment,CommentProps } from './types';

const UserComment: React.FC<CommentProps> = ({
  id,
  bizType,
  accessKey,
  style,
  placeholder,
  title,
  lastRemark,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);

  const fetchComments = useCallback(async () => {
    const params = { relBizId: id, bizType: bizType, ...(accessKey ? { accessKey } : {}) };
    const newComments = await getComments(params);
    if (newComments) {
      setComments(newComments);
    }
  }, [id, bizType, accessKey]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="user-comments" style={style}>
      <div className="comments-title">{title || "用户评论"}</div>
      <CommentEditor id={id} bizType={bizType} accessKey={accessKey} placeholder={placeholder} onCommentAdded={fetchComments} />
      <CommentList comments={comments} />
    </div>
  );
};

export default UserComment;
