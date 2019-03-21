const express = require('express')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const {connect, UsersModel, TweetsModel} = require('./models/db')

connect()

const app = express()

app.set('views', './views')
app.set('view engine', 'pug')

app.use(express.static('public'))

const urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(urlencodedParser)
app.use(methodOverride(function (req, res) {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    const method = req.body._method
    delete req.body._method
    return method
    }
}))


async function formDelete (req, res){
  console.log('formDelete')
  const name_id = req.params.id
  console.log(`formDelete name_id = ${name_id}`)
  res.setHeader("Conetent-Type", 'text/html')
  await UsersModel.destroy({where: {username: name_id}})
  await TweetsModel.destroy({where: {username: name_id}})
	res.redirect(`/tweets`)
}

function formLogin (req, res){
  console.log('formLogin')
  res.setHeader("Conetent-Type", 'text/html')
  res.render('login')
}

async function formSession (req, res){
  console.log('formSession')
  const {username, password} = req.body
  console.log(`formSession username, password : ${username}, ${password}`)
  res.setHeader("Conetent-Type", 'text/html')
  if (username && password){
    //verify user password
    try {
      const user = await UsersModel.findOne({
        where: {
          username,
          password
        }
      })
      if (user && (typeof(user) !== undefined)){
        //get tweet by username
        const tweetLogin = await TweetsModel.findAll({
          where: {username: username}
        })
        if (tweetLogin && (typeof(tweetLogin) !== undefined) && tweetLogin.length != 0){
          res.render('tweets', {listTweets: tweetLogin, username})
        }else{
          const error = 'Data not found'
          res.render('tweets', {username, error})
        }
      }else{
        const error = 'Invalid User or Password'
        res.render('login', {error})
      }
    }catch (e){
      res.render('login', {error: e})
    }
  }else{
    const error = 'User or Password is null value'
    res.render('login', {error})
  }
}

async function formSearch (req, res){
  console.log('formSearch')
  const {qTweet, username} = req.body
  res.setHeader("Conetent-Type", 'text/html')
  const tweetsList = await TweetsModel.findAll({where: {tweet: qTweet}})
  console.log(tweetsList)
  if (tweetsList && (typeof(tweetsList) !== undefined) && tweetsList.length > 0){
    let isLogin = false
    for (let i = 0 ; i < tweetsList.length ; i += 1){
      if (tweetsList[i].username === username){
        isLogin = true
        break
      }
    }
    if (isLogin){
      //goto /tweets/:id/edit
      console.log(`formSearch username : ${username}`)
      res.redirect(`/tweets/${username}/edit`)
    }else{
      //goto /tweets/:id
      console.log(`formSearch username : ${tweetsList[tweetsList.length-1].username}`)
      res.redirect(`/tweets/${tweetsList[tweetsList.length-1].username}`)
    }
  }else{
    const error = 'Tweet not found'
    res.render('login', {error})
  }
}

async function formGetTweet (req, res){
  console.log('formGetTweet')
  const {id} = req.params
  console.log(`formGetTweet username : ${id}`)
  res.setHeader("Conetent-Type", 'text/html')
  //get tweet by username
  const listTweet = await TweetsModel.findAll({
    where: {username: id}
  })
  if (listTweet && (typeof(listTweet) !== undefined)){
    res.render('tweetid', {listTweets: listTweet, username: id})
  }else{
    const error = 'Data not found'
    res.render('tweets', {username, error})
  }
}

async function formEdit (req, res){
  console.log('formEdit')
  const {id} = req.params
  console.log(`formEdit username : ${id}`)
  res.setHeader("Conetent-Type", 'text/html')
  //get tweet by username
  const listTweet = await TweetsModel.findAll({
    where: {username: id}
  })
  if (listTweet && (typeof(listTweet) !== undefined)){
    res.render('tweetedit', {listTweets: listTweet, username: id})
  }else{
    const error = 'Data not found'
    res.render('tweets', {username, error})
  }
}

async function editContent (req, res){
  console.log('editContent')
  const {id} = req.params
  const {eTweet, eTweetDate} = req.body
  console.log(`editContent username : ${id}`)
  console.log(req.body)  
  //find tweet by name for update
  const listTweet = await TweetsModel.findAll({
    where: {username: id}
  })
  if (listTweet && (typeof(listTweet) !== undefined) && listTweet.length > 1){
    //update data
    for (let i = 0 ; i < listTweet.length ; i += 1){
      await TweetsModel.update({tweet: eTweet[i],
        createdAt: eTweetDate[i]}, 
        {where: {username: id, tweet: listTweet[i].tweet}})
    }
  }else{
    await TweetsModel.update({tweet: eTweet,
      createdAt: eTweetDate}, 
      {where: {username: id, tweet: listTweet[0].tweet}})
  }

  res.redirect(`/tweets/${id}/edit`)
}

function formNew (req, res){
  console.log('formNew')
  res.setHeader("Conetent-Type", 'text/html')
  res.render('new')
}

async function newContent (req, res){
  console.log('newContent')
  const {username, tweet, createdAt} = req.body
  console.log(`newContent username : ${username}`)
  console.log(req.body)
  try{
    //find user
    const user = await UsersModel.findOne({
      where: {username}
    })
    if (!user || (typeof(user) === undefined)){
      //create user into db
      await UsersModel.create({
        username,
        password: 'password'})
      }
    //create tweets data into db
    await TweetsModel.create({
      tweet,
      username,
      createdAt})
  }catch (e){
    console.error(e)
    const error = `Cannot new tweet [${e}]`
    res.render('login', {error: e})
  }
  res.redirect(`/tweets/${username}/edit`)
}

function formSignup (req, res){
  console.log('formSignup')
  res.setHeader("Conetent-Type", 'text/html')
  res.render('signup')
}

async function createUser (req, res){
  console.log('createUser')
  const {username, password} = req.body
  console.log(`createUser username, password : ${username}, ${password}`)
  res.setHeader("Conetent-Type", 'text/html')
  let msg = 'initial message'
  try{
    await UsersModel.create({username, password})
    msg = 'Create user completed'
  }catch (e){
    console.error(e)
    msg = `Cannot create user [${e}]`
  }
  res.render('login', {error: msg})
}

app.get('/users/login', formLogin)
   .post('/users/session', urlencodedParser, formSession)
   .post('/search', urlencodedParser, formSearch)
   .get('/tweets', urlencodedParser, formSession)
   .get('/tweets/new', formNew)
   .post('/tweets', urlencodedParser, newContent)
   .get('/tweets/:id/edit', formEdit)
   .put('/tweets/:id', urlencodedParser, editContent)
   .delete('/tweets/:id', urlencodedParser, formDelete)
   .get('/tweets/:id', formGetTweet)
   .get('/users/sign_up', formSignup)
   .post('/users', urlencodedParser, createUser)

app.listen(3000)