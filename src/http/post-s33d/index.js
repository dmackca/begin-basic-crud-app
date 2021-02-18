const data = require('@begin/data');

// learn more about HTTP functions here: https://arc.codes/primitives/http
exports.handler = async function http() {
    // seed db with subscriptions
    const subscriptions = [
        {
            filter: '^Perry.Mason.+1080p',
            key: 'Perry.Mason',
            latestSeason: 1,
            latestEpisode: 8,
        },
        {
            filter: '^Better.Call.Saul.+1080p',
            key: 'Better.Call.Saul',
            latestSeason: 5,
            latestEpisode: 10,
        },
        {
            filter: '^Its.Always.Sunny.in.Philadelphia.+1080p',
            key: 'Its.Always.Sunny.in.Philadelphia',
            latestSeason: 14,
            latestEpisode: 10,
        },
        {
            filter: '^Kidding.+1080p',
            key: 'Kidding',
            latestSeason: 2,
            latestEpisode: 10,
        },
        {
            filter: '^on.becoming.a.god.in.central.florida.+1080p',
            key: 'on.becoming.a.god.in.central.florida',
            latestSeason: 1,
            latestEpisode: 10,
        },
        {
            filter: '^(Genndy.Tartakovskys.)?Primal.S[0-9]{2}.+1080p',
            key: 'Genndy.Tartakovskys.Primal',
            latestSeason: 1,
            latestEpisode: 10,
        },
        {
            filter: '^Rick.+Morty.+1080p',
            key: 'Rick.Morty',
            latestSeason: 4,
            latestEpisode: 10,
        },
        {
            filter: '^Snowpiercer.+1080p',
            key: 'Snowpiercer',
            latestSeason: 1,
            latestEpisode: 10,
        },
        {
            filter: '^Lovecraft.Country.+1080p',
            key: 'Lovecraft.Country',
            latestSeason: 1,
            latestEpisode: 10,
        },
        {
            filter: '^Archer.2009.+1080p',
            key: 'Archer',
            latestSeason: 11,
            latestEpisode: 8,
        },
        {
            filter: '^Dream.Corp.LLC.+1080p',
            key: 'DreamCorp',
            latestSeason: 3,
            latestEpisode: 8,
        },
        {
            filter: '^How.To.with.John.Wilson.+1080p',
            key: 'How.To.with.John.Wilson',
            latestSeason: 1,
            latestEpisode: 6,
        },
        {
            filter: 'Attack.on.Titan.+1080p.+DameDesuYo',
            key: 'Attack on Titan',
            feed: 'AB', // only use on "AB" feed
            latestSeason: 0,
            latestEpisode: 69,
        },
        {
            filter: '^Search.Party.+1080p',
            key: 'Search Party',
            latestSeason: 4,
            latestEpisode: 10,
        },
        {
            filter: '^Painting.with.John.+1080p',
            key: 'Painting with John',
            latestSeason: 1,
            latestEpisode: 4,
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
