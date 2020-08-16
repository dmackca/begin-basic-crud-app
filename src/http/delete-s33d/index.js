const data = require('@begin/data');

/* eslint-disable no-console */

console.log(new Date(), '*** delete endpoint! ***', '\n\n');

// learn more about HTTP functions here: https://arc.codes/primitives/http
exports.handler = async function http(req) {
    if (!(req.queryStringParameters && req.queryStringParameters.table)) return false;

    if (!req.queryStringParameters.key) {
        const allData = await data.get({
            table: req.queryStringParameters.table,
        });
        console.log('allData', allData);
        return false;
    }

    const itemToDestroy = await data.get({
        table: req.queryStringParameters.table,
        key: req.queryStringParameters.key,
    });

    console.log('itemToDestroy', itemToDestroy);

    await data.destroy({
        table: req.queryStringParameters.table,
        key: req.queryStringParameters.key,
    });

    console.log('destroyed', req.queryStringParameters.key);

    return {
        headers: {
            'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
            'content-type': 'application/json; charset=utf8',
        },
        body: JSON.stringify({
            hello: 'world',
        }),
    };
};
