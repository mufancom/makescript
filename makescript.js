module.exports = {
  password: '$2b$10$Qqz.Lqa1WwtvdFXgHM3pAu/sbzwpKo94zUCYwMiipDJZq.67QB/wW',
  hooks: {
    install: 'echo "This will run while scripts repo cloned."',
    postscript: 'sh ./example-scripts/post-trigger-hook.sh',
  },
  scripts: [
    {
      displayName: 'Echo Message',
      name: 'echo-message',
      type: 'node',
      module: 'example-scripts/echo-message.js',
      parameters: {message: true},
      manual: false,
    },
    {
      displayName: 'Echo Message (Shell)',
      name: 'echo-message-shell',
      type: 'shell',
      command: 'echo $message',
      parameters: {message: true},
      manual: false,
    },
    {
      displayName: 'Generate Resources',
      name: 'generate-resources',
      type: 'process',
      command: 'example-scripts/generate-resources.sh',
      parameters: {
        text: {
          displayName: 'Text',
          required: true,
        },
      },
      manual: true,
    },
    {
      displayName: 'Operate Sqlite',
      name: 'operate-sqlite',
      type: 'sqlite',
      file: 'example-scripts/operate-sqlite.sql',
      parameters: {
        message: {
          displayName: 'Message',
          required: true,
        },
      },
      manual: true,
      db: {
        path: '/tmp/database.sqlite3',
        password: process.env['SQLITE_PASSWORD'],
      },
      password: '$2b$10$WTept7/7AbSZ4hL0mBo92OK9hn6criSZ9bUjSxI4TyueV8BT3DEJ2',
      hooks: {
        postscript:
          'sh example-scripts/post-trigger-hook-for-a-single-script.sh',
      },
    },
  ],
};
