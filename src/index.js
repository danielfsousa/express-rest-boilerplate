// make bluebird default Promise
import app from './config/express';
import {dev} from "./config/env";
// open mongoose connection

// listen to requests
app.listen(dev.server.port, () => console.info(`server started on port ${dev.server.port} with host ${dev.server.host}`));

/**
* Exports express
* @public
*/
module.exports = app;
