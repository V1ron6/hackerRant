import express from 'express'
import cors from 'cors'
import 'dotenv/config'

const app = express();
const port =process.env.PORT


app.get("/",(req,res)=>{
 res.send("--- Hades ---")
})


app.listen(port,()=>{
    console.log(`[running] on port ${port}`) 
})
