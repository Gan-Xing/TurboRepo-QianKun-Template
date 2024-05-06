import React, { useState, useRef } from "react";
import { message } from "antd";
import BraftEditor from "braft-editor";
import "braft-editor/dist/index.css";
import { addComment, upload } from "./api";
import { restoreImageUrlsForSubmission, processImageUrl } from "./utils";

interface CommentEditorProps {
  id: string;
  bizType?: string;
  accessKey?: string;
  placeholder?: string;
  onCommentAdded: () => void; // 用于触发更新评论列表的回调
}

const CommentEditor: React.FC<CommentEditorProps> = ({
  id,
  bizType = "REVIEW",
  accessKey,
  placeholder,
  onCommentAdded,
}) => {
  const [editorState, setEditorState] = useState(
    BraftEditor.createEditorState(null)
  );
  const [disabledBtn, setDisabledBtn] = useState(true);
  const [baseUrl, setBaseUrl] = useState("https://soc.alibaba-inc.com");
  const editor = useRef<BraftEditor>(null);

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
          baseUrl,
        ),
        parentId: 0,
        relBizId: id,
        level: 1,
        bizType,
        ...(accessKey ? { accessKey } : {}),
      };
      const res = await addComment(param);
      if (res) {
        onCommentAdded();
        setEditorState(BraftEditor.createEditorState(null)); // 清空编辑器内容
      }
    } catch (error) {
      message.error("提交评论失败，请稍后再试");
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
    <div className="comment-editor">
      <BraftEditor
        value={editorState}
        onChange={handleChange}
        placeholder={placeholder || "输入评论内容..."}
        media={{
          uploadFn: (params) => {
            const fd = new FormData();
            fd.append("file", params.file);
            fd.append("bizType", "soc_vul_mng");
            upload(fd)
              .then((response) => {
                const { origin, adjustedImageUrl } = processImageUrl(
                  response.url
                );
                setBaseUrl(origin);
                params.success({
                  url: adjustedImageUrl,
                  meta: {
                    id: "",
                    title: "",
                    alt: "",
                    loop: false,
                    autoPlay: false,
                    controls: true,
                    poster: "",
                  },
                });
              })
              .catch((error) => {
                params.error({ msg: "Unable to upload file" });
              });
          },
        }}
        ref={editor}
      />
      <button
        disabled={disabledBtn}
        className={disabledBtn ? "comment-btn-dis" : "comment-btn-able"}
        onClick={save}
      >
        提交
      </button>
    </div>
  );
};

export default CommentEditor;
