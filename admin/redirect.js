export function redirectAdminDirectory(req, res, next) {
  if (req.url?.split('?')[0] !== '/admin') return next();
  res.statusCode = 308;
  res.setHeader('Location', `/admin/${req.url.slice('/admin'.length)}`);
  res.end();
}

export function adminDirectoryPlugin() {
  return {
    name: 'admin-directory-entry',
    configureServer(server) { server.middlewares.use(redirectAdminDirectory); },
    configurePreviewServer(server) { server.middlewares.use(redirectAdminDirectory); }
  };
}
