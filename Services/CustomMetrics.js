import PClient from 'prom-client';
import responseTime from 'response-time';

const reqResTime = new PClient.Histogram({
    name: "Server_req_res_time",
    help: "This shows the time taken by a request",
    labelNames: ["status_code", "method", "route"],
    buckets: [1, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000],
})

const CustomMetrics = {
    responseTime(req, res, time) {
        reqResTime.labels({
            route: req.url,
            method: req.method,
            status_code: res.statusCode,
        }).observe(time);
    },
}

export default CustomMetrics