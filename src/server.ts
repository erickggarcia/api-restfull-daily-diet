import { app } from './app'
import 'dotenv/config'

app
  .listen({
    port: 3333,
    host: 'RENDER' in process.env ? '0.0.0.0' : 'localhost',
  })
  .then(() => {
    console.log('HTTP Server Running!')
  })
