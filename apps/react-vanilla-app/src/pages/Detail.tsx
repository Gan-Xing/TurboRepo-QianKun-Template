import { getDomainFromUrl, removeDomainIfDev } from '../utils/urlUtils';

const UrlProcessor = () => {
  const url = 'https://www.example.com/api/to/page';
  const domain = getDomainFromUrl(url);
  const processedUrl = removeDomainIfDev(domain, url);

  return (
    <div>
      <p>原始URL: {url}</p>
      <p>协议和域名: {domain}</p>
      <p>处理后的URL: {processedUrl}</p>
    </div>
  );
};

export default UrlProcessor;
