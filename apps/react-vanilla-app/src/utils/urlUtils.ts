/**
 * 解析给定URL并返回其协议和域名部分（如'https://example.com'）。
 * 如果URL不包含协议和域名部分，则返回空字符串。
 * @param url - 需要解析的完整URL。
 * @returns 返回URL的协议和域名部分，或空字符串。
 */
export function getDomainFromUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    } catch (error) {
      console.error('Invalid URL:', error);
      return '';
    }
  }
 /**
 * 在开发环境中，如果URL以指定的协议和域名开头，则移除这部分，返回相对路径。
 * 否则返回原URL。
 * @param domain - 要检查和移除的协议和域名（如 'https://example.com'）。
 * @param url - 被处理的完整URL。
 * @returns 如果是开发环境并且URL以指定的协议和域名开始，则返回移除后的相对路径；否则返回原URL。
 */
 export function removeDomainIfDev(domain: string, url: string): string {
    if (process.env.NODE_ENV === 'development') {
      if (url.startsWith(domain)) {
        return url.substring(domain.length);
      }
    }
    return url;
  }
   