import net from 'node:net';

/** A tiny SMTP server for tests: records every message it accepts, and can be told to refuse them. */
export function startSmtpSink() {
  const messages = [];
  const sink = { messages, refuse: false, port: 0, close: () => new Promise((r) => server.close(r)) };
  const server = net.createServer((sock) => {
    let inData = false;
    let buf = '';
    sock.write('220 sink ESMTP\r\n');
    sock.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      for (;;) {
        if (inData) {
          const end = buf.indexOf('\r\n.\r\n');
          if (end === -1) return;
          messages.push(buf.slice(0, end));
          buf = buf.slice(end + 5);
          inData = false;
          sock.write('250 queued\r\n');
          continue;
        }
        const nl = buf.indexOf('\r\n');
        if (nl === -1) return;
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 2);
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO' || cmd === 'HELO') sock.write('250 sink\r\n');
        else if (cmd === 'RCPT') sock.write(sink.refuse ? '550 mailbox unavailable\r\n' : '250 ok\r\n');
        else if (cmd === 'DATA') {
          sock.write('354 go\r\n');
          inData = true;
        } else if (cmd === 'QUIT') {
          sock.write('221 bye\r\n');
          sock.end();
        } else sock.write('250 ok\r\n');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      sink.port = server.address().port;
      resolve(sink);
    });
  });
}
