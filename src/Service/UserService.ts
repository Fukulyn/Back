import { Service } from "../abstract/Service";
import { Student } from "../interfaces/Student";
import { logger } from "../middlewares/log";
import { studentsModel } from "../orm/schemas/studentSchemas";
import { Document, Types } from "mongoose"
import { MongoDB } from "../utils/MongoDB";
import { DBResp } from "../interfaces/DBResp";
import { resp } from "../utils/resp";

type seatInfo = {
    schoolName:string,
    department:string,
    seatNumber:string
}

export class UserService extends Service {
    /**尋找所有學生資料
     * 
     * @returns 
     */
    public async getAllStudents(): Promise<Array<DBResp<Student>>|undefined> {
        try {
            const res:Array<DBResp<Student>> = await studentsModel.find({});
            return res;
        } catch (error) {
            return undefined;
        }
        
    }

    /**
     * 新增學生
     * @param info 學生資訊
     * @returns resp
     */
    public async insertOne(info: Student): Promise<resp<DBResp<Student> | undefined>> {
        const resp: resp<DBResp<Student> | undefined> = {
            code: 200,
            message: "",
            body: undefined
        };
        try {
            // 驗證用戶名稱是否有效
            const nameValidator = await this.userNameValidator(info.userName);
            if (nameValidator !== "驗證通過") {
                resp.code = 403;
                resp.message = nameValidator;
                return resp;
            }
            // 查詢當前的學生數量
            const studentCount = await studentsModel.countDocuments();
            if (studentCount >= 200) { // 最多存放 200 筆資料
                resp.message = "student list is full";
                resp.code = 403;
                return resp;
            }
            // 查詢當前的最大座號
            const maxSid = await studentsModel
                .findOne()
                .sort({ sid: -1 }) // 按 sid 降序排列，取第一個
                .select("sid") // 只取 sid 欄位
                .exec();
            // 設置新的 sid
            const newSid = maxSid ? Number(maxSid.sid) + 1 : 1;
            info.sid = String(newSid);
            info._id = undefined; // 讓 MongoDB 自動生成 _id
    
            // 插入新學生
            const res = new studentsModel(info);
            resp.body = await res.save();
            resp.message = "insert success";
        } catch (error) {
            resp.message = "server error";
            resp.code = 500;
            console.error("Error inserting student:", error);
        }
        return resp;
    }

    /**
     * 學生名字驗證器
     * @param userName 學生名字
     * tku ee 0787
     * ee 科系縮寫
     *  0787 四碼
     * 座號檢查，跟之前有重複就噴錯  只能寫沒重複的號碼
     */
    public async userNameValidator(userName: string): Promise<
    '學生名字格式不正確，應為 tku + 科系縮寫 + 四碼座號，例如: tkubm1760' | '座號已存在' | '校名必須為 tku' | '座號格式不正確，必須為四位數字。' | '驗證通過'
    > {
        if (userName.length < 7) { 
            return ('學生名字格式不正確，應為 tku + 科系縮寫 + 四碼座號，例如: tkubm1760');
        }
        const info = this.userNameFormator(userName);
        if (info.schoolName !== 'tku') {
            return '校名必須為 tku';
        }
        // 驗證座號(正則不想寫可以給 gpt 寫, 記得測試就好)
        const seatNumberPattern = /^\d{4}$/; // 驗證4個數字
        if (!seatNumberPattern.test(info.seatNumber)) {
            return '座號格式不正確，必須為四位數字。';
        }
        if (await this.existingSeatNumbers(info.seatNumber)) {
            return '座號已存在'
        }
        return '驗證通過'
        
    }

    /**
     * 用戶名格式化
     * @param userName 用戶名
     * @returns seatInfo
     */
    public userNameFormator(userName: string){
            if (!userName || typeof userName !== "string" || userName.length < 7) {
        throw new Error("無效的用戶名格式");
    }
        const info:seatInfo = {
            schoolName: userName.slice(0, 3),
            department: userName.slice(3, userName.length - 4),
            seatNumber: userName.slice(-4)
        }
        return info
    }

    /**
     * 檢查用戶名是否存在
     * @param SeatNumber 用戶座號
     * @returns boolean
     */
    public async existingSeatNumbers(SeatNumber:string):Promise<boolean>{
        const students = await this.getAllStudents();
        let exist = false
        if (students) {
            students.forEach((student)=>{
                const info = this.userNameFormator(student.userName)
                if (info.seatNumber === SeatNumber) {
                    exist = true;
                }
            })
        }
        return exist
    }

    /**
     * 刪除一筆用戶資料
     * @param id 用戶_id
     * @returns resp
     */
    public async deletedById(id:string): Promise<resp<DBResp<Student> | undefined>>{
        const resp: resp<any> ={
            code: 200,
            message: "",
            body: undefined
        }
        const user = await studentsModel.findById(id);
        if (user) {
            try {
                const res = await studentsModel.deleteOne({_id: id});
                resp.message = "sucess";
                resp.body = res;
            } catch (error) {
                resp.message = error as string;
                resp.code = 500;
            }
        } else {
            resp.message = "user not found";
            resp.code = 404;
        }
        return resp;
    }
    /**
     * 刪除一筆用戶資料
     * @param name 用戶名稱
     * @returns resp
     */
    public async deletedByName(name: string): Promise<resp<DBResp<Student> | undefined>>{
        const resp: resp<any> ={
            code: 200,
            message: "",
            body: undefined
        }
        const user = await studentsModel.findOne({name: name});
        if (user) {
            try {
                const res = await studentsModel.deleteOne({name: name});
                resp.message = "sucess";
                resp.body = res;
            } catch (error) {
                resp.message = error as string;
                resp.code = 500;
            }
        } else {
            resp.code = 404;
            resp.message = "user not found";
        }
        return resp;
    }
    /**
     * 根據用戶名稱更新資料
     * @param old_name 用戶名稱
     * @param updateData 更新的資料
     * @returns resp
     */
    public async updateByName(name: string, updateData: Student): Promise<resp<DBResp<Student> | undefined>> {
        const resp: resp<DBResp<Student> | undefined> = {
            code: 200,
            message: "",
            body: undefined
        };
        try {
            // 移除不想被看到的欄位，_id、sid、absences
            const updateFields = { ...updateData };
            delete updateFields._id;
            delete updateFields.sid;
            delete updateFields.absences;
    
            // 使用 findOneAndUpdate 進行資料更新，並返回更新後的資料
            const user = await studentsModel.findOneAndUpdate(
                { name: name },  // 查找條件
                { $set: updateFields },  // 更新操作
                { 
                    new: true,  // 返回更新後的資料
                    runValidators: true  // 執行 Schema 驗證
                }
            );
            if (user) {
                resp.body = user;  // 返回更新後的資料
                resp.message = "Update successful";
            } else {
                resp.code = 404;
                resp.message = "User not found";
            }
        } catch (error) {
            resp.code = 500;
            resp.message = "server error";
        }
        return resp;
    }
    /**
     * 根據用戶id更新資料
     * @param id 用戶id
     * @param updateData 更新的資料
     * @returns resp
     */
    public async updateById(id: string, updateData: Student): Promise<resp<DBResp<Student> | undefined>> {
        const resp: resp<DBResp<Student> | undefined> = {
            code: 200,
            message: "",
            body: undefined
        };
        try {
            // 移除不想被看到的欄位，_id、sid、absences
            const updateFields = { ...updateData };
            delete updateFields._id;
            delete updateFields.sid;
            delete updateFields.absences;
            // 使用 findOneAndUpdate 進行資料更新，並返回更新後的資料
            const user = await studentsModel.findOneAndUpdate(
                { _id: id },  // 查找條件
                { $set: updateFields },  // 更新操作
                { 
                    new: true,  // 返回更新後的資料
                    runValidators: true  // 執行 Schema 驗證
                }
            );
            if (user) {
                resp.body = user;  // 返回更新後的資料
                resp.message = "Update successful";
            } else {
                resp.code = 404;
                resp.message = "User not found";
            }
        } catch (error) {
            resp.code = 500;
            resp.message = "server error";
        }
        return resp;
    }

    /**
     * 根據名稱尋找用戶
     * @param name 用戶名稱
     * @returns resp
     */
    public async findByName(name: string): Promise<resp<DBResp<Student> | undefined>>{
        const resp: resp<DBResp<Student> | undefined> ={
            code: 200,
            message: "",
            body: undefined
        }
        const user = await studentsModel.findOne({name: name});
        if (user) {
            try {
                resp.body = user;
                resp.message = "find success";
            } catch (error) {
                resp.code = 500;
                resp.message = "server error"
            }
        }else {
            resp.code = 404;
            resp.message = "user not found";
        }
        return resp;
    }

    /**
     * 根據id尋找用戶
     * @param id 用戶id
     * @returns resp
     */
    public async findById(id: string): Promise<resp<DBResp<Student> | undefined>> {
        const resp: resp<DBResp<Student> | undefined> = {
            code: 200,
            message: "",
            body: undefined
        };
        // 檢查 id 是否為有效的 ObjectId 格式
        if (!Types.ObjectId.isValid(id)) {
            resp.code = 404;
            resp.message = "user not found";  // 若 ID 格式不正確，返回 400 錯誤
            return resp;
        }
        try {
            const user = await studentsModel.findById(id);
            if (user){
                resp.body = user;
                resp.message = "find success";
            }
        } catch (error) {
            resp.code = 500;
            resp.message = "server error";  // 若出現其他錯誤，返回 500 錯誤
            console.error("Error finding user by ID:", error);  // 輸出錯誤以便調試
        }
        return resp;
    }
}
