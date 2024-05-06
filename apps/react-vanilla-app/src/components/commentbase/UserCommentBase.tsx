import React, { useState, useEffect, useRef, useCallback } from "react";
import { message } from "antd";
import BraftEditor from "braft-editor";
import moment from "moment";
import { addComment, getComments, upload } from "./api";
import {
  processImageUrl,
  processImageUrls,
  restoreImageUrlsForSubmission,
} from "./utils";
import "braft-editor/dist/index.css";

interface CommentProps {
  id: string;
  bizType?: string;
  accessKey?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  title?: string;
  lastRemark?: string;
}
interface Comment {
  id: number;
  nickName?: string;
  realName?: string;
  gmtModified?: number;
  gmtCreate?: number;
  content: string;
  [key: string]: any;
}

const UserComment: React.FC<CommentProps> = ({
  id,
  bizType,
  accessKey,
  style,
  placeholder,
  title,
  lastRemark,
}) => {
  const [list, setList] = useState<Comment[]>([]);
  const [disabledBtn, setDisabledBtn] = useState(true);
  const [editorState, setEditorState] = useState(
    BraftEditor.createEditorState(null)
  );

  const editor = useRef<BraftEditor>(null);
  const getList = useCallback(async () => {
    const param = {
      relBizId: id,
      bizType: bizType || "REVIEW",
      ...(accessKey ? { accessKey } : {}),
    };
    const list = await getComments(param);
    if (list) {
      setList(list);
    }
  }, [id, bizType, accessKey]);
  useEffect(() => {
    getList();
  }, [getList]);

  const save = async () => {
    try {
      const content = editorState.toHTML();
      if (!content.trim() || !content.replace(/<p><\/p>/g, "").trim()) {
        message.warning("评论内容不可为空");
        return;
      }
      const param = {
        content: restoreImageUrlsForSubmission(
          content,
          "https://soc.alibaba-inc.com"
        ),
        parentId: 0,
        relBizId: id,
        level: 1,
        bizType: bizType || "REVIEW",
        ...(accessKey ? { accessKey } : {}),
      };
      const res = await addComment(param);
      if (res) {
        getList();
        setEditorState(BraftEditor.createEditorState(null)); // 清空编辑器内容
      }
    } catch (error) {
      message.error('提交评论失败，请稍后再试');
    }
  };

  const handleChange = (newState: { toHTML: () => string }) => {
    setEditorState(newState);
    setDisabledBtn(
      !newState
        .toHTML()
        .replace(/<p><\/p>/g, "")
        .trim()
    );
  };
 

  return (
    <div className="comment bg-fff" style={style} id="comment">
      <div className="comment-title">{title || "备注"}</div>
      <div className="comment-body">
        <BraftEditor
          value={editorState}
          placeholder={
            placeholder || "您可输入实际修复方案；Ctrl+V 支持图片截图"
          }
          contentClassName={disabledBtn ? "body-content" : "body-content-focus"}
          onChange={handleChange}
          media={{
            uploadFn: (params) => {
              const fd = new FormData();
              fd.append("file", params.file);
              fd.append("bizType", "soc_vul_mng");

              // 调用你的上传逻辑
              upload(fd)
                .then((response) => {
                  const {origin, adjustedImageUrl} = processImageUrl(response.url)
                  // 成功时调用
                  params.success({
                    url: adjustedImageUrl,
                    meta: {
                      id: "", // 你可能需要从响应中获取或生成这个id
                      title: "", // 标题，如果有的话
                      alt: "", // 图片的alt描述，如果有的话
                      loop: false, // 如果是视频，是否循环播放
                      autoPlay: false, // 如果是视频，是否自动播放
                      controls: true, // 如果是视频，是否显示控制条
                      poster: "", // 如果是视频，视频封面图
                    },
                  });
                })
                .catch((error) => {
                  // 处理错误
                  params.error({
                    msg: "Unable to upload file",
                  });
                });
            },
          }}
          ref={editor}
        />
      </div>
      <button
        disabled={disabledBtn}
        className={disabledBtn ? "comment-btn-dis" : "comment-btn-able"}
        onClick={save}
        style={{ float: "right" }}
      >
        {"提交"}
      </button>
      <div className="total">
        {lastRemark || `${"全部"} ${"备注"}`}
        {"评论"} {list?.length}
      </div>
      <div className="list">
        {list.map((item) => (
          <div className="item" key={item.id}>
            <div className="info">
              <span className="name">{item.nickName || item.realName}</span>
              <span className="time">
                {moment(item.gmtModified || item.gmtCreate)?.format(
                  "YYYY-MM-DD HH:mm:ss"
                )}
              </span>
            </div>
            <div
              className="html"
              dangerouslySetInnerHTML={{
                __html: processImageUrls(item.content),
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserComment;
