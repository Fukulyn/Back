import { Service } from "../abstract/Service";
import { Pal } from "../interfaces/Pal";
import { logger } from "../middlewares/log";
import { PalModel } from "../orm/schemas/PalSchema";
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
    public async getAllPals(): Promise<Array<DBResp<Pal>>|undefined> {
        try {
            const res:Array<DBResp<Pal>> = await PalModel.find({});
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
    public async insertOne(info: Pal): Promise<resp<DBResp<Pal> | undefined>> {
        const resp: resp<DBResp<Pal> | undefined> = {
            code: 200,
            message: "",
            body: undefined
        };
        try {
            // 驗證用戶
            const nameValidator = await this.userNameValidator(info.name);
            if (nameValidator !== "驗證通過") {
                resp.code = 403;
                resp.message = nameValidator;
                return resp;
            }
            // 學生數量
            const studentCount = await studentsModel.countDocuments();
            if (studentCount >= 200) { 
                resp.message = "student list is full";
                resp.code = 403;
                return resp;
            }
            // 查詢最大座號
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
        // 驗證座號
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
            const updateFields = { ...updateData };
            delete updateFields._id;
            delete updateFields.sid;
    
            // findOneAndUpdate => 資料更新 返回更新後資料
            const user = await studentsModel.findOneAndUpdate(
                { name: name },  
                { $set: updateFields }, 
                { 
                    new: true,  
                    runValidators: true 
                }
            );
            if (user) {
                resp.body = user;  
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
}