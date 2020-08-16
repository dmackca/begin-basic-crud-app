const data = require('@begin/data');

// learn more about HTTP functions here: https://arc.codes/primitives/http
exports.handler = async function http() {
    // seed db with subscriptions
    const subscriptions = [
        {
            filter: '^Perry.Mason.+1080p',
            latestSeason: 1,
            latestEpisode: 8,
        },
        {
            filter: '^12.oz.Mouse.+1080p',
            latestSeason: 3,
            latestEpisode: 1,
        },
        {
            filter: '^Better.Call.Saul.+1080p',
            latestSeason: 5,
            latestEpisode: 10,
        },
        {
            filter: '^Its.Always.Sunny.in.Philadelphia.+1080p',
            latestSeason: 14,
            latestEpisode: 10,
        },
        {
            filter: '^Kidding.+1080p',
            latestSeason: 2,
            latestEpisode: 10,
        },
        {
            filter: '^on.becoming.a.god.in.central.florida.+1080p',
            latestSeason: 1,
            latestEpisode: 10,
        },
        {
            filter: '^Genndy.Tartakovskys.Primal.+1080p',
            latestSeason: 1,
            latestEpisode: 6,
        },
        {
            filter: '^Rick.+Morty.+1080p',
            latestSeason: 4,
            latestEpisode: 10,
        },
        {
            filter: '^Snowpiercer.+1080p',
            latestSeason: 1,
            latestEpisode: 10,
        },
        {
            filter: '^Lovecraft.Country.+1080p',
            latestSeason: 0,
            latestEpisode: 0,
        },
    ];

    await data.set(subscriptions.map((e) => ({
        table: 'subscriptions',
        ...e,
    })));

    return {
        headers: {
            'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
            'content-type': 'text/plain; charset=utf8',
        },
        body: 'db seeded!',
    };
};
