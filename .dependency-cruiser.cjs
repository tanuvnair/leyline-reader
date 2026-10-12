/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-outward',
      severity: 'error',
      comment:
        'Domain must stay pure: no Electron, Application, Infrastructure, or IPC imports.',
      from: {path: '^electron/domain'},
      to: {
        path: '^electron/(application|infrastructure|ipc|main|preload)',
      },
    },
    {
      name: 'domain-no-electron-npm',
      severity: 'error',
      comment: 'Domain must not import Electron or hoyoapi.',
      from: {path: '^electron/domain'},
      to: {path: '^(electron|hoyoapi)$'},
    },
    {
      name: 'application-no-ipc-preload',
      severity: 'error',
      comment: 'Application must not depend on Presentation IPC/preload.',
      from: {path: '^electron/application'},
      to: {path: '^electron/(ipc|preload|main)'},
    },
    {
      name: 'infrastructure-no-application',
      severity: 'error',
      comment: 'Infrastructure must not import Application (avoid upward deps).',
      from: {path: '^electron/infrastructure'},
      to: {path: '^electron/application'},
    },
    {
      name: 'infrastructure-no-ipc',
      severity: 'error',
      comment: 'Infrastructure must not import IPC presentation adapters.',
      from: {path: '^electron/infrastructure'},
      to: {path: '^electron/(ipc|preload)'},
    },
  ],
  options: {
    doNotFollow: {
      path: ['node_modules', 'dist', 'dist-electron', 'release'],
    },
    tsConfig: {
      fileName: 'tsconfig.node.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
