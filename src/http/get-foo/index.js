const data = require('@begin/data');
const Parser = require('rss-parser');
const RSS = require('rss');

// parse typical S00E00 episode codes
function parseEpisodeNumber(title) {
    const parsed = title.match(/S?(\d{1,2})E(\d{1,2})/i);
    if (parsed === null) {
        return null;
    }
    const season = Number(parsed[1]);
    const episode = Number(parsed[2]);
    return {
        season,
        episode,
    };
}

// parse AB-style "Episode 00" episode codes where the season isn't counted
// returns 0 for season number so comparison logic will still work
function parseEpisodeNumberAB(title) {
    const parsed = title.match(/Episode.(\d+)/i);
    if (parsed === null) {
        return null;
    }
    const season = 0;
    const episode = Number(parsed[1]);
    return {
        season,
        episode,
    };
}

// returns true if the episode title is a PROPER or a REPACK
function isProper(title) {
    return title.includes('PROPER') || title.includes('REPACK');
}

// compare candidates: return the better of the 2
function getBestCandidate(currentBest, newCandidate) {
    // if there is no current best, this new one automatically wins
    if (!currentBest) {
        return newCandidate;
    }

    // favor the new candidate if it's a PROPER
    if (isProper(newCandidate.title)) {
        return newCandidate;
    }

    // @TODO: do some comparisons to favor WEB/AMZN, etc
    return currentBest; // always use the first match for now
}

exports.handler = async function http(req) {
    const feedUrl = req.queryStringParameters.feed;
    const parser = new Parser();
    const inputFeed = await parser.parseURL(feedUrl);

    const subscriptionData = await data.get({
        table: 'subscriptions',
    });

    // get details from the db and build this array programatically
    const subscriptions = subscriptionData.map((s) => ({
        ...s,
        startSeason: s.latestSeason,
        startEpisode: s.latestEpisode,
        matches: new Map(),
    }));

    // check each item in the input feed against the subscriptions
    inputFeed.items.forEach((i) => {
        // check if this item matches a filter
        const subscription = subscriptions.find(({ filter }) => {
            const regex = new RegExp(filter, 'i');
            return regex.test(i.title);
        });

        // skip if it doesn't match any subscription
        if (!subscription) return;

        // if it matches, parse episode code and add to "candidates" map

        // now parse each episode's season and episode number
        let episodeParser = parseEpisodeNumber;
        // optionally use custom episode number parser
        if (req.queryStringParameters.episodeParser === 'AB') {
            episodeParser = parseEpisodeNumberAB;
        }
        const parsed = episodeParser(i.title);
        if (parsed === null) return;
        const { season, episode } = parsed;

        // discard old episodes that aren't new or PROPER/REPACK
        if (!isProper(i.title)) {
            if (season < subscription.startSeason) {
                return;
            }
            if (season === subscription.startSeason) {
                if (episode <= subscription.startEpisode) return;
            } // else: newer season, or newer episode of same season
        }

        console.log('Matched item:', i.title); // eslint-disable-line no-console
        // add episode to a Map
        const id = `s${season}e${episode}`;
        const currentCandidate = subscription.matches.get(id);
        const bestCandidate = getBestCandidate(currentCandidate, i);
        subscription.matches.set(id, bestCandidate);

        // update new "latest" season/episode numbers
        if (season > subscription.latestSeason) {
            subscription.latestSeason = season;
            subscription.latestEpisode = episode;
        } else if (season === subscription.latestSeason) {
            if (episode > subscription.latestEpisode) {
                subscription.latestEpisode = episode;
            }
        }
    });

    // filter to only subscriptions with matches
    const matched = subscriptions.filter((s) => s.matches.size > 0);

    // persist updated seasons/episodes to db
    const updateData = matched.map((s) => {
        const {
            table, key, latestSeason, latestEpisode, filter,
        } = s;
        return {
            table,
            key,
            filter,
            latestSeason,
            latestEpisode,
        };
    });

    if (updateData.length) {
        data.set(updateData);
    }

    console.log('updateData', updateData); // eslint-disable-line no-console

    // generate xml from matches
    const outputFeed = new RSS({
        title: 'Filtered Episodes',
    });

    matched.forEach((subscription) => {
        const { matches } = subscription;
        matches.forEach((episode) => {
            outputFeed.item({
                title: episode.title,
                description: episode.content,
                url: episode.link,
                date: episode.pubDate,
            });
        });
    });

    const xml = outputFeed.xml({ indent: ' ' });

    return {
        headers: {
            'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
            'content-type': 'application/rss+xml; charset=utf8',
        },
        body: xml,
    };
};
