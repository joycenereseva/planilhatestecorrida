(function (global) {
  var REPO_OWNER = 'joycenereseva';
  var REPO_NAME = 'planilhatestecorrida';
  var FILE_PATH = 'students.json';
  var BRANCH = 'main';
  var TOKEN_KEY = 'teste_corrida_github_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || '';
  }

  function setToken(token) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }

  function hasToken() {
    return getToken().length > 0;
  }

  function toBase64(text) {
    return btoa(unescape(encodeURIComponent(text)));
  }

  function githubHeaders(token) {
    return {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  function publishStudents(allowed) {
    var token = getToken();
    if (!token) return Promise.reject(new Error('no_token'));

    var payload = JSON.stringify({ allowed: allowed }, null, 2) + '\n';
    var apiUrl = 'https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME + '/contents/' + FILE_PATH;

    return fetch(apiUrl + '?ref=' + BRANCH, { headers: githubHeaders(token) })
      .then(function (res) {
        if (res.status === 404) return { sha: null };
        if (!res.ok) return res.json().then(function (err) { throw new Error(err.message || 'fetch_failed'); });
        return res.json();
      })
      .then(function (file) {
        var body = {
          message: 'Atualizar codigos de acesso',
          content: toBase64(payload),
          branch: BRANCH
        };
        if (file && file.sha) body.sha = file.sha;
        return fetch(apiUrl, {
          method: 'PUT',
          headers: Object.assign({}, githubHeaders(token), { 'Content-Type': 'application/json' }),
          body: JSON.stringify(body)
        });
      })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (err) { throw new Error(err.message || 'publish_failed'); });
        return res.json();
      });
  }

  function testToken(token) {
    return fetch('https://api.github.com/repos/' + REPO_OWNER + '/' + REPO_NAME, {
      headers: githubHeaders(token)
    }).then(function (res) {
      if (!res.ok) return res.json().then(function (err) { throw new Error(err.message || 'token_invalid'); });
      return true;
    });
  }

  global.TestePublish = {
    TOKEN_KEY: TOKEN_KEY,
    getToken: getToken,
    setToken: setToken,
    hasToken: hasToken,
    publishStudents: publishStudents,
    testToken: testToken
  };
})(window);
