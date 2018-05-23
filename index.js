const skygear = require('skygear');
const routesRouter = require('routes');
const router = routesRouter();

const Key = skygear.Record.extend('key');
const ActionLog = skygear.Record.extend('action_log');

function includeme(skygearCloud) {
  const container = skygearCloud.getContainer();

  router.addRoute('GET /api/:namespace/keys', listKeys);
  router.addRoute('POST /api/:namespace/keys/:key/find', findKeys);
  router.addRoute('POST /api/:namespace/keys/:key/claim', claimKey);
  router.addRoute('POST /api/:namespace/keys/:key/release', releaseKey);

  skygearCloud.handler('/api/', function (req, options) {
    const method = req.method.toUpperCase();
    const route = router.match(method + ' ' + req.path);
    const json = method === 'GET' ? req.url.query : req.json;
    return route.fn.apply(null, [req, json, route.params.namespace, container]);
  });

  console.log('server started');
}

/*
Slack command request data

token=dqEBCyAoRWcwVVxJKRjy5xPj
team_id=T0001
team_domain=example
channel_id=C2147483705
channel_name=test
user_id=U2147483697
user_name=Steve
command=/weather
text=94070
response_url=https://hooks.slack.com/commands/1234/5678
*/

function listKeys(req, json, namespace, container) {
  const query = new skygear.Query(Key);
  query.equalTo('namespace', namespace);
  return container.publicDB.query(query)
    .then(r => ({ results: r.map(o => o) }));
}

function findKeys(req, json, namespace, container) {
  return Promise.resolve()
    .then(() => {
      const query = new skygear.Query(Key);
      query.equalTo('namespace', namespace);
      query.equalTo('claimed_by', null);
      return skyegar.publicDB.query(query);
    })
    .then(unclaimedKeys => {
      return unclaimedKeys.map(k => k.value).join(', ');
    });
}

function claimKey(req, json, namespace, container) {
}

function releaseKey(req, json, namespace, container) {
  const username = json.user_name;
  return new Promise.resolve()
    .then(() => {
      const query = new skygear.Query(Key);
      query.equalTo('namespace', namespace);
      query.equalTo('claimed_by', username);
      return skyegar.publicDB.query(query);
    })
    .then(claimedKeys => {
      claimedKeys = claimedKeys.map(k => k.claimed_by = null);
      const actionLog = new ActionLog({
        action: 'release',
        namespace,
        username,
        data: {
          keys: claimedKeys.map(k => k.value),
        },
      });
      return skygear.publicDB.save([...claimedKey, actionLog], { atomic: true});
    });
}

module.exports = {
  includeme,
};
