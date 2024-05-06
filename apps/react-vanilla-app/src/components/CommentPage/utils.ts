/**
 * 从完整的 URL 中提取原点（origin），包括协议和主机名。
 *
 * @param url - 要解析原点的完整URL。
 * @returns 提取的原点或空字符串（如果提取失败）。
 */
export const getOriginFromUrl = (url: string): string => {
  if (!url) return "";
  try {
    const { origin } = new URL(url);
    return origin;
  } catch (error) {
    // 如果 URL 解析失败，则返回空字符串
    return "";
  }
}


/**
 * 处理单个图片 URL，并返回其原点和调整后的 URL。
 * 在开发环境中可能会根据环境移除 URL 的原点部分，而在生产环境中保持不变。
 *
 * @param imageUrl - 要处理的图片 URL。
 * @returns 返回一个对象，包含图片的原点（origin）和调整后的 URL（adjustedImageUrl）。
 */
export const processImageUrl = (imageUrl: string): { origin: string; adjustedImageUrl: string } => {
  const origin = getOriginFromUrl(imageUrl);
  const adjustedImageUrl = adjustUrlForEnvironment(imageUrl, origin);
  return { origin, adjustedImageUrl };
};


/**
 * 处理 HTML 字符串中所有 `img` 标签的 `src` 属性，调整其 URL 根据当前环境。
 * 在开发环境中可能会移除 URL 的原点部分以适应代理等配置，而在生产环境中通常保持 URL 不变。
 * 
 * @param htmlString - 包含 HTML 内容的字符串，其中可能包含一个或多个 `img` 标签。
 * @returns 返回处理后的 HTML 字符串，其中所有 `img` 标签的 `src` 属性都已根据环境进行了相应调整。
 */
export function processImageUrls(htmlString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const images = doc.querySelectorAll("img");

  images.forEach((img) => {
    const originalSrc = img.getAttribute("src");
    if (originalSrc) {
      const origin = getOriginFromUrl(originalSrc);
      const adjustedSrc = adjustUrlForEnvironment(originalSrc, origin);
      img.setAttribute("src", adjustedSrc);
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.body); // 序列化 body 内的内容
}


/**
 * 根据当前环境调整给定的 URL。
 * 在开发环境中，如果 URL 以指定的原点（包括协议、域名和端口）开头，则移除该原点部分以便使用代理。
 * 在生产环境中，保持 URL 不变。
 *
 * @param url - 要根据当前环境进行调整的完整 URL。
 * @param origin - 在开发环境中要从 URL 中移除的原点。
 * @returns 调整后适合当前环境的 URL。
 */
const adjustUrlForEnvironment = (url: string, origin: string): string => {
  if (!url) return "";

  // 如果 URL 以指定的原点开头，移除原点
  if (url.startsWith(origin)) {
    // 保持路径、查询参数和片段不变
    return url.substring(origin.length);
  }
  return url;

  // 仅在开发环境中调整 URL
  if (process?.env?.NODE_ENV !== "production") {
    // 如果 URL 以指定的原点开头，移除原点
    if (url.startsWith(origin)) {
      // 保持路径、查询参数和片段不变
      return url.substring(origin.length);
    }
    return url;
  }
  // 在生产环境或原点不匹配的情况下，返回原始 URL
  return url;
};

/**
 * 根据当前环境恢复给定的 URL 到其原始完整状态。
 * 在开发环境中，如果 URL 被移除了 origin 部分，将其添加回去以还原原始 URL。
 * 在生产环境中，返回原始 URL 不作改动。
 *
 * @param url - 要根据当前环境进行恢复的 URL。
 * @param origin - 在开发环境中要还原到 URL 中的原点（包括协议、域名和端口）。
 * @returns 恢复后的完整 URL。
 */
export function restoreUrlForProduction(url: string, origin: string): string {
  if (!url) return "";

  if (!url.startsWith(origin)) {
    // 添加 origin 到路径前以还原完整 URL
    return origin + (url.startsWith('/') ? "" : '/') + url;
  }

  return url;
  // 仅在开发环境中恢复 URL
  if (process?.env?.NODE_ENV !== "production") {
    if (!url.startsWith(origin)) {
      // 添加 origin 到路径前以还原完整 URL
      return origin + (url.startsWith('/') ? "" : '/') + url;
    }
  }
  // 在生产环境或 URL 已经包含 origin 时，返回原始 URL
  return url;
}


/**
 * 将编辑器内容的所有图片 URL 恢复到其原始状态。
 *
 * @param editorContent - 编辑器内容的 HTML 字符串。
 * @param origin - 待恢复的原点（包括协议、域名和端口）。
 * @returns 处理后的内容，图片 URL 已恢复。
 */
export function restoreImageUrlsForSubmission(
  editorContent: string,
  origin: string
) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(editorContent, "text/html");
  const images = doc.querySelectorAll("img");

  images.forEach(img => {
    const adjustedSrc = img.getAttribute("src");
    if (adjustedSrc) {
      const restoredSrc = restoreUrlForProduction(adjustedSrc, origin);
      img.setAttribute("src", restoredSrc);
    }
  });

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc.body);
}



// /**
//  * 根据当前环境调整给定的 URL。
//  * 在开发环境中，如果 URL 以指定的原点（包括协议、域名和端口）开头，则移除该原点部分以便使用代理。
//  * 在生产环境中，保持 URL 不变。
//  *
//  * @param url - 要根据当前环境进行调整的完整 URL。
//  * @param origin - 在开发环境中要从 URL 中移除的原点。
//  * @returns 调整后适合当前环境的 URL。
//  */
// const adjustUrlForEnvironment = (url: string, origin: string): string => {
//   if (!url) return "";

//   // 仅在开发环境中调整 URL
//   if (process?.env?.NODE_ENV !== "production") {
//     // 如果 URL 以指定的原点开头，移除原点
//     if (url.startsWith(origin)) {
//       // 保持路径、查询参数和片段不变
//       return url.substring(origin.length);
//     }
//   }
//   // 在生产环境或原点不匹配的情况下，返回原始 URL
//   return url;
// };

// /**
//  * 根据当前环境恢复给定的 URL 到其原始完整状态。
//  * 在开发环境中，如果 URL 被移除了 origin 部分，将其添加回去以还原原始 URL。
//  * 在生产环境中，返回原始 URL 不作改动。
//  *
//  * @param url - 要根据当前环境进行恢复的 URL。
//  * @param origin - 在开发环境中要还原到 URL 中的原点（包括协议、域名和端口）。
//  * @returns 恢复后的完整 URL。
//  */
// export function restoreUrlForProduction(url: string, origin: string): string {
//   if (!url) return "";
//   // 仅在开发环境中恢复 URL
//   if (process?.env?.NODE_ENV !== "production") {
//     if (!url.startsWith(origin)) {
//       // 添加 origin 到路径前以还原完整 URL
//       return origin + (url.startsWith('/') ? "" : '/') + url;
//     }
//   }
//   // 在生产环境或 URL 已经包含 origin 时，返回原始 URL
//   return url;
// }
