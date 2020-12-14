const beginData = require('@begin/data');
const RssParser = require('rss-parser');
const RssFeed = require('rss');

// parse typical S00E00 episode codes
function parseEpisodeCode(title) {
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
function parseEpisodeCodeAB(title) {
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
    const rssParser = new RssParser();
    const inputFeed = await rssParser.parseURL(feedUrl);

    // get all subscriptions from db
    let subscriptionData = await beginData.get({
        table: 'subscriptions',
    });

    // optionally use a specific subset of subscriptions for this feed
    // with the `subscriptionSet` query parameter
    // matches the subscription's "feed" field in the database
    // default: `undefined` (all subscriptions with no "feed" value specified)
    const { subscriptionSet } = req.queryStringParameters;
    subscriptionData = subscriptionData.filter((s) => s.feed === subscriptionSet);

    // add local season, episode, & candidates items to each subscription for comparison
    const subscriptions = subscriptionData.map((s) => ({
        ...s,
        startSeason: s.latestSeason,
        startEpisode: s.latestEpisode,
        matches: new Map(),
    }));

    // check each item in the input feed against the subscriptions
    inputFeed.items.forEach((i) => {
        // check if this item matches a subscription's regex filter
        const subscription = subscriptions.find(({ filter }) => {
            const regex = new RegExp(filter, 'i');
            return regex.test(i.title);
        });

        // skip if it doesn't match any subscription
        if (!subscription) return;

        // if it matches, parse season/episode numbers and add to "candidates" map
        let episodeParser = parseEpisodeCode;
        // optionally use custom episode number parser
        if (req.queryStringParameters.episodeParser === 'AB') {
            episodeParser = parseEpisodeCodeAB;
        }
        const parsedEpisodeCode = episodeParser(i.title);
        if (parsedEpisodeCode === null) return;
        const { season, episode } = parsedEpisodeCode;

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

        // add episode to a Map with season/episode code as ID
        const id = `s${season}e${episode}`;
        // if there's already a candidate for this season/episode code, use the "best" one
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
    const subscriptionsWithMatches = subscriptions.filter((s) => s.matches.size > 0);

    // persist updated seasons/episodes to db
    if (subscriptionsWithMatches.length) {
        const updateData = subscriptionsWithMatches.map((s) => {
            const {
                table,
                key,

                feed,
                filter,
                latestSeason,
                latestEpisode,
            } = s;
            return {
                table,
                key,

                feed,
                filter,
                latestSeason,
                latestEpisode,
            };
        });

        beginData.set(updateData);
        console.log('updateData', updateData); // eslint-disable-line no-console
    }

    // generate xml from matches
    const outputFeed = new RssFeed({
        title: 'Filtered Episodes',
    });

    subscriptionsWithMatches.forEach((subscription) => {
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
