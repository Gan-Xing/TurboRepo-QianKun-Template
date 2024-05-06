export interface Comment {
  id: number;
  nickName?: string;
  realName?: string;
  gmtModified?: number;
  gmtCreate?: number;
  content: string;
  [key: string]: any;
}
export interface CommentProps {
  id: string;
  bizType?: string;
  accessKey?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  title?: string;
  lastRemark?: string;
}
