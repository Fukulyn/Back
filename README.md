# 安裝與執行指引
```
git clone https://github.com/Fukulyn/Front.git
git clone https://github.com/Fukulyn/Back.git
```
切換到專案目錄(需要開兩個終端)
```
cd Front
cd Back
```
## 前端

`Front` 目錄下  
複製 `.env.example` 到 `.env`  

配置環境變數
```
VITE_IP = api_url  
```

本地運行:  
```
cd Front
npm install
npm run dev
```
## 後端

`Back` 目錄下  
複製 `.env.example` 到 `.env`  

配置環境變數
```
DBUSER=test               # 資料庫使用者
DBPASSWORD=password       # 資料庫密碼
DBHOST=127.0.0.1          # 資料庫連線位置
DBPORT=8974               # 資料庫連線埠
DBNAME=name               # 資料庫名稱
PORT=2083                 # 後端監聽位置
LogPath=logs              # log生成位置
assetsPath=/assets        # assets生成位置
HomePagePath=/index.html  # 首頁位置
privateKey=key            # 私密金鑰
```

運行  
```
cd Back
npm install
npm run dev
```

## 資料庫

設置 mongogb , DB , Collection , 指定 Collection name : `students`  
範例資料 `studentslist.csv`

```
{
  "_id": {
    "$oid": "6751b29a94a899c352e189f1"
  },
  "userName": "tkuee0787",
  "sid": 1,
  "name": "張佳慧",
  "department": "電機工程系",
  "grade": "四年級",
  "class": "A",
  "Email": "tkuee0787@tkuim.com"
}
```

---

# API 規格說明

`Back/src/Service/UserService.ts`  
- GET /api/v1/user/findAll (取得全部學生資料，且按 sid (座號) 排序)  
    ```
    public async getAllStudents(): Promise<Array<DBResp<Student>>|undefined>
    ```
     回傳範例 
    - 200
        ```
        {
            "code": 200,
            "message": "find sucess",
            "body": [
                {
                    "_id": "6751b29a94a899c352e189f1",
                    "userName": "tkuee0787",
                    "sid": "1",
                    "name": "張佳慧",
                    "department": "電機工程系",
                    "grade": "四年級",
                    "class": "A",
                    "Email": "tkuee0787@tkuim.com"
                },
                {
                    "_id": "6751b29a94a899c352e189f2",
                    "userName": "tkubm9553",
                    "sid": "2",
                    "name": "蔡文杰",
                    "department": "企業管理系",
                    "grade": "二年級",
                    "class": "A",
                    "Email": "tkubm9553@tkuim.com"
                },
            ]
        }
        ```
    - 500
        ```
        {
            "code": 500,
            "message": "server error"
        }
        ```
- POST /api/v1/user/insertOne (新增一筆學生資料)
    ```
    public async insertOne(info: Student): Promise<resp<DBResp<Student> | undefined>>
    ```
    請求範例
    - body
        ```
        {
            "userName": "tkubm11111",
            "name": "慧",
            "department": "系",
            "grade": "四年級",
            "class": "A",
            "Email": "tku787@tkuim.com"
        }
        ```
    回傳範例
    - 200
        ```
       {
          "code": 200,
          "message": "insert success",
          "body": {
                  "userName": "tkubm11111",
                  "sid": "51",
                  "name": "慧",
                  "department": "系",
                  "grade": "四年級",
                  "class": "A",
                  "Email": "tku787@tkuim.com",
                  "_id": "6762134ca50c72e40b87b7f3",
                  "__v": 0
                 }
         }
        ```
    - 403
        ```
        {
            "code": 403,
            "message": "座號已存在"
        }
        ```
    - 500
        ```
        {
            "code": 500,
            "message": "server error"
        }
        ```
- PUT /api/v1/user/updateByName (使用 name(名字) 為索引更新學生資料)
    ```
   public async updateByName(name: string, updateData: Student): Promise<resp<DBResp<Student> | undefined>>
    ```
  請求範例
    - name
        ```
        name=慧
        ```
    - body
        ```
        {
            "_id": "6762134ca50c72e40b87b7f3",
            "userName": "tkubm11111",
            "sid": "51",
            "name": "張",
            "department": "系",
            "grade": "四年級",
            "class": "A",
            "Email": "tku787@tkuim.com"
        }
        ```
     回傳範例
    - 200
        ```
          {
            "code": 200,
            "message": "Update successful",
            "body": {
                "_id": "6762134ca50c72e40b87b7f3",
                "userName": "tkubm11111",
                "sid": "51",
                "name": "張",
                "department": "系",
                "grade": "四年級",
                "class": "A",
                "Email": "tku787@tkuim.com"
            }
         }
        ```
    - 404
        ```
        {
            "code": 404,
            "message": "user not found"
        }
        ```
    - 500
        ```
        {
            "code": 500,
            "message": "server error"
        }
        ```
- DELETE /api/v1/user/deleteByName (使用 name 刪除學生)
    ```
    public async deletedByName(name: string): Promise<resp<DBResp<Student> | undefined>>
    ```
     請求範例
    - name
        ```
        name=慧
        ```
     回傳範例
    - 200
        ```
            {
                "code":200,
                "message":"success",
                "body":{
                    "acknowledged":true,
                    "deletedCount":1
                }
            }
        ```
    - 404
        ```
            {
                "code": 404,
                "message": "user not found",
                "body":{
                    "acknowledged":false,
                    "deletedCount":0
                }
            }
        ```
    - 500
        ```
            {
                "code": 500,
                "message": `Server error: ${error}`,
                "body":{
                    "acknowledged":false,
                    "deletedCount":0
                }
            }
        ```

---

# 架構圖 / 流程圖

![image](https://github.com/Fukulyn/Front/blob/main/src/%E7%B3%BB%E7%B5%B1%E6%9E%B6%E6%A7%8B%E5%9C%96.drawio.png)

---

# 操作示範
https://youtu.be/pDIKty857LU
---
