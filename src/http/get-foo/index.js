const data = require('@begin/data')
const Parser = require('rss-parser');
const RSS = require('rss');

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

// compare candidates: return the better of the 2
function getBestCandidate(currentBest, newCandidate) {
  // if there is no current best, this new one automatically wins
  if (!currentBest) {
    return newCandidate;
  }
  // later, do some comparisons to favor WEB/AMZN, etc
  return currentBest; // always return false for now (always use the first match)
}

exports.handler = async function http (req) {
      const feedUrl = req.queryStringParameters.feed;

      const parser = new Parser();

      const feed = await parser.parseURL(feedUrl);

      const subscriptionData = await data.get({
        table: 'subscriptions'
      });

      // get details from the db and build this array programatically
      const subscriptions = subscriptionData.map(s => {
        return {
          ...s,
          startSeason: s.latestSeason,
          startEpisode: s.latestEpisode,
          matches: new Map(),
        }
      });


      // filter (regex, really)
      feed.items.forEach((i) => {
          // preliminary global quality filter
          // (temporary, later we'll just match regex for both)
          // if (!i.title.includes('1080p')) return;

          // check if this item matches a filter
          const subscription = subscriptions.find(({ filter }) => i.title.startsWith(filter)); // later use regex

          // skip if it doesn't match any subscription
          if (!subscription) return;

          // if it matches, parse episode code and add to candidates

          // now parse each one's season and episode number
          const parsed = parseEpisodeNumber(i.title);
          if (parsed === null) return;
          const { season, episode } = parsed;

          // -- discard any that aren't new (do this in the loop above)
          // later, allow for PROPER and (REPACK?) whatever other smart ep filters do
          if (season < subscription.startSeason) {
            return;
          } else if (season === subscription.startSeason) {
            if (episode <= subscription.startEpisode) return;
          } // else: newer season, or newer episode of same season

          console.log('Matched item:', i.title);
          // -- add new ones to a Map
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
      const matched = subscriptions.filter(s => s.matches.size > 0);

      // persist updated seasons/episodes to db
      const updateData = matched.map(s => {
        const { table, key, latestSeason, latestEpisode, filter } = s;
        return {
          table,
          key,
          filter,
          latestSeason,
          latestEpisode
        };
      });

      if (updateData.length) {
        data.set(updateData);
      }

      console.log('updateData', updateData);

      // generate xml from matches
      const feedOutput = new RSS({
        title: 'Filtered Episodes',
      });

      matched.forEach(subscription => {
        const { matches } = subscription;
        matches.forEach(episode => {
          feedOutput.item({
            title: episode.title,
            description: episode.content,
            url: episode.link,
            date: episode.pubDate,
          });
        });
      });

      const xml = feedOutput.xml({indent: ' '});

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'application/rss+xml; charset=utf8'
    },
    body: xml,
  }
}
