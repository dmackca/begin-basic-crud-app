const data = require('@begin/data')
const Parser = require('rss-parser');

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

      console.log('hey', feedUrl);

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
          console.log('%s parsed', i.title, parsed);
          console.log('tests:', (season <= subscription.startSeason), (episode <= subscription.startEpisode));

          // -- discard any that aren't new (do this in the loop above)
          // later, allow for PROPER and (REPACK?) whatever other smart ep filters do
          if (season < subscription.startSeason) {
            return;
          } else if (season === subscription.startSeason) {
            if (episode <= subscription.startEpisode) return;
          } // else: newer season, or newer episode of same season

          console.log('got here for ', i.title);
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

      console.log('subs', subscriptions);

      // filter to only subscriptions with matches
      const matched = subscriptions.filter(s => s.matches.size > 0)

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
      // @TODO

  return {
    headers: {
      'cache-control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0',
      'content-type': 'text/html; charset=utf8'
    },
    body: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Architect</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .max-width-320 {
      max-width: 20rem;
    }
    .margin-left-8 {
      margin-left: 0.5rem;
    }
    .margin-bottom-16 {
      margin-bottom: 1rem;
    }
    .margin-bottom-8 {
      margin-bottom: 0.5rem;
    }
    .padding-32 {
      padding: 2rem;
    }
    .color-grey {
      color: #333;
    }
    .color-black-link:hover {
      color: black;
    }
  </style>
</head>
<body class="padding-32">
  <div class="max-width-320">
    <p>ayy what it do</p>
  </div>
</body>
</html>
`
  }
}
