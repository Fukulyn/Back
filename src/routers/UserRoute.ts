import { Route } from "../abstract/Route"
import { UserController } from "../controller/UserController";
import { logger } from "../middlewares/log";

export class UserRoute extends Route{
    
    protected url: string;
    protected Contorller = new UserController();

    constructor(){
        super()
        this.url = '/api/v1/user/'
        this.setRoutes()
    }

    protected setRoutes(): void {
        
        this.router.get(`${this.url}findAll`,(req, res)=>{
            this.Contorller.findAll(req, res);
        })

        this.router.get(`${this.url}findByName`,(req, res)=>{
            this.Contorller.findByName(req, res);
        })

        this.router.get(`${this.url}findById`,(req, res)=>{
            this.Contorller.findById(req, res);
        })

        /**
         * 新增學生
         * request body {
         *  userName: string,
         *  name: string",
         *  department: string,
         *  grade: string,
         *  class: string,
         *  Email: string
         * } 
         * @returns resp<Student>
         */
        this.router.post(`${this.url}insertOne`,(req, res)=>{
            this.Contorller.insertOne(req, res);
        })

        this.router.delete(`${this.url}deletedById`,(req, res)=>{
            this.Contorller.deletedById(req, res);
        })

        this.router.delete(`${this.url}deletedByName`,(req, res)=>{
            this.Contorller.deletedByName(req, res);
        })

        this.router.put(`${this.url}updateByName`,(req, res)=>{
            this.Contorller.updateByName(req, res);
        })
        this.router.put(`${this.url}updateById`,(req, res)=>{
            this.Contorller.updateById(req, res);
        })

    }
}