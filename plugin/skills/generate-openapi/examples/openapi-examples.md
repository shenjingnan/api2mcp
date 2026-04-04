# OpenAPI 规范示例模板

## 模式一：查询参数认证（Query Key）

适用于 API Key 通过 URL 查询参数传递的 API（如高德地图、和风天气等）。

- 认证方式：`API_FIXED_PARAMS`（参数自动注入到查询参数中）
- 典型 URL：`https://api.example.com/v1/resource?key=YOUR_KEY&param=value`

```yaml
openapi: "3.0.0"
info:
  title: 示例 API（查询参数认证）
  version: "1.0"
  description: |
    示例 API，使用查询参数传递 API Key。
    认证参数 key 通过 API_FIXED_PARAMS 环境变量自动注入，调用时无需手动传入。

servers:
  - url: https://api.example.com

paths:
  /v1/resource:
    get:
      operationId: getResource
      summary: 获取资源列表
      description: 查询资源列表，支持分页和关键字过滤。
      tags:
        - 资源管理
      parameters:
        - name: key
          in: query
          required: true
          description: API 鉴权密钥（通过 API_FIXED_PARAMS 自动注入）
          schema:
            type: string
        - name: keyword
          in: query
          required: false
          description: 搜索关键字
          schema:
            type: string
        - name: page
          in: query
          required: false
          description: 页码，从 1 开始
          schema:
            type: integer
            minimum: 1
            default: 1
      responses:
        "200":
          description: 成功返回资源列表
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    description: 返回状态
                  data:
                    type: array
                    description: 资源列表
                    items:
                      type: object
                      properties:
                        id:
                          type: string
                          description: 资源 ID
                        name:
                          type: string
                          description: 资源名称
```

## 模式二：路径参数认证（Path Key）

适用于 API Key 嵌入 URL 路径中的 API（如彩云天气等）。

- 认证方式：`API_FIXED_PARAMS`（参数自动注入到路径参数中）
- 典型 URL：`https://api.example.com/v2/{appKey}/location/resource`

```yaml
openapi: "3.0.0"
info:
  title: 示例 API（路径参数认证）
  version: "2.0"
  description: |
    示例 API，使用路径参数传递 API Key。
    认证参数 appKey 通过 API_FIXED_PARAMS 环境变量自动注入，调用时无需手动传入。

servers:
  - url: https://api.example.com

paths:
  /v2/{appKey}/{location}/resource:
    get:
      operationId: getResourceByLocation
      summary: 按位置获取资源
      description: 根据位置信息获取相关资源数据。
      tags:
        - 资源查询
      parameters:
        - name: appKey
          in: path
          required: true
          description: API 鉴权密钥（通过 API_FIXED_PARAMS 自动注入）
          schema:
            type: string
        - name: location
          in: path
          required: true
          description: |
            经纬度坐标，格式为 `经度,纬度`
            例如：`116.4,39.9`
          schema:
            type: string
        - name: detail
          in: query
          required: false
          description: 是否返回详细信息
          schema:
            type: boolean
            default: false
      responses:
        "200":
          description: 成功返回资源数据
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    description: 返回状态
                  result:
                    type: object
                    description: 资源数据
```

## 模式三：Bearer Token 认证（Header）

适用于通过 HTTP Header 传递认证令牌的 API（如 Home Assistant、自建服务等）。

- 认证方式：`API_HEADERS`（请求头自动注入）
- 典型请求头：`Authorization: Bearer YOUR_TOKEN`

```yaml
openapi: "3.0.0"
info:
  title: 示例 API（Bearer Token 认证）
  version: "1.0"
  description: |
    示例 API，使用 Bearer Token 认证。
    认证信息通过 API_HEADERS 环境变量自动注入，调用时无需手动传入。

servers:
  - url: http://localhost:8080

tags:
  - name: 系统管理
    description: 系统配置与状态检查
  - name: 数据操作
    description: 数据的增删改查

paths:
  /api/status:
    get:
      operationId: getStatus
      summary: 获取系统状态
      description: 返回系统当前运行状态信息。
      tags:
        - 系统管理
      responses:
        "200":
          description: 成功返回系统状态
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    description: 系统状态
                  version:
                    type: string
                    description: 系统版本

  /api/items:
    get:
      operationId: listItems
      summary: 获取项目列表
      description: 返回所有项目的列表。
      tags:
        - 数据操作
      responses:
        "200":
          description: 成功返回项目列表
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    id:
                      type: string
                      description: 项目 ID
                    name:
                      type: string
                      description: 项目名称

  /api/items/{item_id}:
    get:
      operationId: getItem
      summary: 获取项目详情
      description: 根据 ID 获取指定项目的详细信息。
      tags:
        - 数据操作
      parameters:
        - name: item_id
          in: path
          required: true
          description: 项目 ID
          schema:
            type: string
      responses:
        "200":
          description: 成功返回项目详情
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    description: 项目 ID
                  name:
                    type: string
                    description: 项目名称
                  created_at:
                    type: string
                    description: 创建时间

    post:
      operationId: updateItem
      summary: 更新项目
      description: 更新指定项目的数据。
      tags:
        - 数据操作
      parameters:
        - name: item_id
          in: path
          required: true
          description: 项目 ID
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - name
              properties:
                name:
                  type: string
                  description: 项目名称
      responses:
        "200":
          description: 更新成功
```
