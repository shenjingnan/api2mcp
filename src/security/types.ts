/**
 * 安全模块类型定义
 */

/**
 * 已解析的认证信息
 */
export interface ResolvedAuthentication {
  /** 需要注入的请求头 */
  headers: Record<string, string>;
  /** 需要注入的查询参数 */
  query: Record<string, string>;
  /** 需要注入的 cookie */
  cookies: Record<string, string>;
}
