let data = require('@begin/data')
async function startUpScript() {
  let table = 'greetings'
  let greetings = [
    { table, key: 'Māori', greeting: `Kia ora` },
    { table, key: 'Swahili', greeting: `Hujambo` },
    { table: 'greetings', key: 'Japanese', greeting: `Kon'nichiwa` },
    {
       table: 'todos',
       key: 'fizbuz',
       completed: false,
       created: 1594622267369,
       text: 'say HELLO'
     }
   ]
  await data.set(greetings);

  const subscriptions = [
    {
        filter: '^Hotel.Instantane.+1080p',
        latestSeason: 2,
        latestEpisode: 5,
    },
    {
        filter: 'Saturday Morning with James Martin.+1080p',
        latestSeason: 0,
        latestEpisode: 0,
    },
    {
        filter: 'Some show that wont be matched.+1080p',
        latestSeason: 2,
        latestEpisode: 1,
    },
    {
        filter: 'Pit Bulls and Parolees.+1080p',
        latestSeason: 0,
        latestEpisode: 0,
    },
    {
        filter: 'Corn Pone Wisdom.+1080p',
        latestSeason: 0,
        latestEpisode: 0,
    },
  ];

    await data.set(subscriptions.map(e => {
      return {
        table: 'subscriptions',
        // key: e.filter,
        ...e,
      };
    }));

}
module.exports = startUpScript
