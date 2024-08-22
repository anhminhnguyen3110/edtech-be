import { ELogColors, ELogLevel } from '../logger/interfaces/log-data.interface';

export const colorize = (color: ELogColors, message: string): string => {
    return `${color}${message}\x1b[0m`;
};

export const mapLogLevelColor = (level: ELogLevel): ELogColors => {
    const levelColorMap: { [key: string]: ELogColors } = {
        [ELogLevel.Debug]: ELogColors.blue,
        [ELogLevel.Info]: ELogColors.green,
        [ELogLevel.Warn]: ELogColors.yellow,
        [ELogLevel.Error]: ELogColors.red,
        [ELogLevel.Fatal]: ELogColors.magenta,
        [ELogLevel.Emergency]: ELogColors.pink,
    };

    return levelColorMap[level] || ELogColors.cyan;
};
