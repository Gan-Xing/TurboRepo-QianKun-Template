// export const getComments = async (params: {
//     accessKey?: string | undefined;
//     relBizId: string;
//     bizType: string;
//   }) => {
//     const result = await axios({
//       url: "api/ssp/common/get_comments.json",
//       params,
//     });

//     return result?.data;
//   };

// export const addComment = async (params: { accessKey?: string | undefined; content: string; parentId: number; relBizId: string; level: number; bizType: string; }) => {
//     const result = await axios({
//       url: 'api/ssp/common/add_comment.json?_csrf=b4c8491c-fb4e-4b68-b09e-2aba494027da',
//       data: params,
//       method: 'post',
//     });

//     return result?.data;
//   };

export const addComment = async (params: {
  accessKey?: string | undefined;
  content: string;
  parentId: number;
  relBizId: string;
  level: number;
  bizType: string;
}) => {
    const res = {
        code: 200,
        msg: "OK",
        data: ["OK"],
      };
  return res.data
};

// 模拟的 getComments 函数
export const getComments = async (params: {
  accessKey?: string | undefined;
  relBizId: string;
  bizType: string | undefined;
}) => {
  
  const res =  {
    code: 200,
    msg: "OK",
    data: [
      {
        id: 145725,
        parentId: 0,
        bizType: "REVIEW_FRO_ALL_APP",
        relBizId: "38",
        content:
          '<p>这是第一条评论的内容</p><div class="media-wrap image-wrap"><img src="https://soc.alibaba-inc.com/api/ssp/common/download?file=soc_vul_mng/2024/01b56184-ae9a-473b-ab5f-2bcfb31fcdd7&filename=image.png"/></div>',
        deptName: null,
        empId: "WB746166",
        extra: null,
        gmtCreate: 1713150327000,
        gmtModified: 1713150327000,
        growthLevel: null,
        hotFlag: 0,
        isDialogue: null,
        level: 1,
        medalTitle: null,
        myPraisel: null,
        nickName: "",
        parentComment: null,
        photoUrl: null,
        praise: null,
        realName: "张三",
        replyOfficialFlag: null,
        replyUserInfo: null,
        replyUserid: null,
        responderOfficialFlag: null,
        secCommentVOS: null,
        source: "sspmng",
        status: null,
        title: null,
      },
      {
        id: 145736,
        parentId: 0,
        bizType: "REVIEW_FRO_ALL_APP",
        relBizId: "38",
        content:
          '<p>这是第二条评论的内容</p><div class="media-wrap image-wrap"><img src="https://soc.alibaba-inc.com/api/ssp/common/download?file=soc_vul_mng/2024/02c56284-be9b-474c-ac6f-3bdcb41fcdd8&filename=image.png"/></div>',
        deptName: null,
        empId: "WB746167",
        extra: null,
        gmtCreate: 1713150427000,
        gmtModified: 1713150427000,
        growthLevel: null,
        hotFlag: 0,
        isDialogue: null,
        level: 1,
        medalTitle: null,
        myPraisel: null,
        nickName: "",
        parentComment: null,
        photoUrl: null,
        praise: null,
        realName: "李四",
        replyOfficialFlag: null,
        replyUserInfo: null,
        replyUserid: null,
        responderOfficialFlag: null,
        secCommentVOS: null,
        source: "sspmng",
        status: null,
        title: null,
      },
    ],
  };
  return res.data
};

// export const upload = async (params: FormData) => {
//     const result = await axios({
//       url: 'api/ssp/common/upload.json',
//       data: params,
//       method: 'post',
//     });

//     return result?.data;
//   };

export const upload = async (params: FormData) => {
  const res = {
    code: 200,
    msg: "OK",
    requestId: "212b004117132854094972588e38af",
    data: {
      originFilename: "image.png",
      creator: "WB746166",
      gmtCreate: "2024-04-17T00:36:49.838+08:00",
      fileHash: "09000a652f752d353867e3e9a044d67a",
      ossFilepath: "soc_vul_mng/2024/80aa0882-e338-4450-b94a-2c670cc7139f",
      size: 206740,
      url: "https://soc.alibaba-inc.com/api/ssp/common/download?file=soc_vul_mng/2024/80aa0882-e338-4450-b94a-2c670cc7139f&filename=image.png",
    },
  };
  return res.data;
};
