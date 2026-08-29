type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean; 
  showTimestamp?: boolean; 
}

const config: LoggerConfig = {
  enabled: __DEV__, 
  showTimestamp: true,
};

const formatMessage = (level: LogLevel, message: any) => {
  const timestamp = config.showTimestamp ? `[${new Date().toISOString()}]` : '';
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
};

const Logger = {
  debug: (...args: any[]) => {
    if (!config.enabled) return;
    console.debug(formatMessage('debug', args.join(' ')));
  },
  info: (...args: any[]) => {
    if (!config.enabled) return;
    console.info(formatMessage('info', args.join(' ')));
  },
  warn: (...args: any[]) => {
    if (!config.enabled) return;
    console.warn(formatMessage('warn', args.join(' ')));
  },
  error: (...args: any[]) => {
    if (!config.enabled) return;
    console.error(formatMessage('error', args.join(' ')));
  },
  setEnabled: (enabled: boolean) => {
    config.enabled = enabled;
  },
  setShowTimestamp: (show: boolean) => {
    config.showTimestamp = show;
  },
};

export default Logger;
