import * as os from 'os';

// Cleanup code
type Signals =
  "SIGABRT" | "SIGALRM" | "SIGBUS" | "SIGCHLD" | "SIGCONT" | "SIGFPE" | "SIGHUP" | "SIGILL" | "SIGINT" | "SIGIO" |
  "SIGIOT" | "SIGKILL" | "SIGPIPE" | "SIGPOLL" | "SIGPROF" | "SIGPWR" | "SIGQUIT" | "SIGSEGV" | "SIGSTKFLT" |
  "SIGSTOP" | "SIGSYS" | "SIGTERM" | "SIGTRAP" | "SIGTSTP" | "SIGTTIN" | "SIGTTOU" | "SIGUNUSED" | "SIGURG" |
  "SIGUSR1" | "SIGUSR2" | "SIGVTALRM" | "SIGWINCH" | "SIGXCPU" | "SIGXFSZ" | "SIGBREAK" | "SIGLOST" | "SIGINFO";

function exitHandler(exitCode: number) {
  // if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  // if (options.exit) process.exit();
}function exitHandler2(exitCode: Signals) {
  // if (options.cleanup) console.log('clean');
  if (exitCode || exitCode === 0) console.log(exitCode);
  if (exitCode === "SIGINT") process.exit();
}
function exitHandler3(error: Error) {
  // if (options.cleanup) console.log('clean');
  if (error) console.log(error);
  // if (options.exit) process.exit();
}

process.on('beforeExit', exitHandler);
process.on('SIGINT',  exitHandler2);
process.on('SIGUSR1', exitHandler2);
process.on('SIGUSR2', exitHandler2);
process.on('uncaughtException', exitHandler3);

const topicHeartBeat = `${os.hostname()}.heartbeat.OmniCloud`;
const topicLog = `${os.hostname()}.log.OmniCloud`;

export const kafka = require('kafka-node'),
  HighLevelProducer = kafka.HighLevelProducer,
  client = new kafka.KafkaClient({kafkaHost: '10.187.97.138:32768'}),
  producer = new HighLevelProducer(client);
// Create topics sync
producer.on("ready", () => {
  console.log("ready");
  producer.createTopics([topicHeartBeat, topicLog], false, function (err: {}, data: {}) {
    const log = console.log;
    const error = console.log;
    // tslint:disable-next-line:no-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.log = (...args: any) => {
      const date = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
      log.apply(console, [`[${date}]`, ...args]);
      producer.send([
          { topic: topicLog,
            messages: JSON.stringify([date, "info", ...args]),
          }],
        (err2: object, data2: object) => {
          if(err2) console.error(err2);
        });
    };
    console.error = (...args: any) => {
      const date = new Date().toISOString().replace("T", " ").replace(/\..+/, "");
      error.apply(console, [`[${date}]`, ...args]);
      producer.send([
          { topic: topicLog,
            messages: JSON.stringify([date, "error", ...args]),
          }],
        (err2: object, data2: object) => {
          if(err2) console.error(err2);
        });
    };

    setInterval(() => {
      // const km = new KeyedMessage('key', 'message'),
      const payloads = [
        { topic: topicHeartBeat, messages: JSON.stringify({
            timestamp: Date.now(),
            totalmem: os.totalmem(),
            freemem: os.freemem(),
            uptime: os.uptime(),
            loadavg: os.loadavg(),
            rulesCalled: stats.rulesCalled
          }), partition: 0 }
      ];
      producer.send(payloads, (err2: object, data2: object) => {
        if(err2) console.error(err2);
      });
    }, 2000);
  });
});

export const stats = {
  rulesCalled: 0
};

export function startHeartBeat(){}