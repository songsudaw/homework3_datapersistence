const Sequelize = require('sequelize')
const sequelize = new Sequelize('postgres://localhost:5432/songsuda') 

const connect = async function(){
    try{
        await sequelize.authenticate()
        // await sequelize.sync({force: true})
        console.log('Connected to database!')
    }catch (e){
      console.log('Cannot connect to database!')
    }
}

const Users = function(sequelize, type){
    return sequelize.define('users', {
      username: {
        type: type.STRING,
        unique: true
      },
      password: type.STRING
    })
}
  
const Tweets = function(sequelize, type){
    return sequelize.define('tweets', {
        tweet: type.STRING,
        username: type.STRING,
        createdAt: type.STRING
    })
}

module.exports = {
    connect,
    UsersModel: Users(sequelize, Sequelize),
    TweetsModel: Tweets(sequelize, Sequelize)
}