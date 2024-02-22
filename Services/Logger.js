import { createLogger, transports } from "winston";
import LokiTransport from "winston-loki";
import { LOKI_HOST } from "../config";

const options = {
  transports: [
    new LokiTransport({
      labels: {
        appName: "SOD_Server"
      },
      host: LOKI_HOST
    })
  ]
};
const Logger = createLogger(options);

export default Logger