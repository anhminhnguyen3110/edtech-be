import { PrometheusModule } from '@willsoto/nestjs-prometheus';

export const prometheusModule = (path: string, label: string) => {
    return PrometheusModule.register({
        path: path,
        defaultMetrics: {
            enabled: true,
        },
        defaultLabels: {
            app: label,
        },
        global: true,
    });
};
