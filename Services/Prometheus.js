import PClient from 'prom-client';

// prometheus client
const collectDefaultMetrics = PClient.collectDefaultMetrics;
collectDefaultMetrics({ register: PClient.register });

const PrometheusMetricsController = {
    async generate(req, res) {
        res.setHeader("Content-Type", PClient.register.contentType);
        const metrics = await PClient.register.metrics();
        res.send(metrics);
    }
}

export default PrometheusMetricsController;
