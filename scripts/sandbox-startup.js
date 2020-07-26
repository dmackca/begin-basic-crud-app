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
  await data.set(greetings)
}
module.exports = startUpScript
