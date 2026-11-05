import { defineConfig } from 'vite';
export default defineConfig({server:{host:'0.0.0.0',port:4174,allowedHosts:true},plugins:[{name:'prototype-home',configureServer(server){server.middlewares.use((req,res,next)=>{if(req.url==='/'){res.writeHead(302,{Location:'/prototype.html'});res.end();}else next();});}}]});
